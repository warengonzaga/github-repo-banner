import { request as httpsRequest } from 'node:https';
import type { LookupFunction } from 'node:net';
import { BoundedCache } from '../utils/bounded-cache.js';
import { resolvePublicImageAddress } from '../utils/sanitize.js';

/**
 * Fetch an image and return it as a base64 data URI for SVG embedding.
 */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
];

const imageCache = new BoundedCache(32 * 1024 * 1024, 60_000, 4);

export function fetchImageAsBase64(
  url: string,
  maxBytes = MAX_IMAGE_BYTES,
): Promise<string | null> {
  return imageCache.get(`${maxBytes}:${url}`, () =>
    downloadImageAsBase64(url, maxBytes),
  );
}

async function downloadImageAsBase64(
  url: string,
  maxBytes = MAX_IMAGE_BYTES,
): Promise<string | null> {
  try {
    const parsedUrl = new URL(url);
    if (
      parsedUrl.protocol !== 'https:' ||
      parsedUrl.username ||
      parsedUrl.password
    ) {
      return null;
    }
    const address = await resolvePublicImageAddress(
      parsedUrl.hostname.replace(/^\[|\]$/g, ''),
    );
    if (!address) return null;

    const pinnedLookup: LookupFunction = (_hostname, options, callback) => {
      if (typeof options === 'object' && options.all) {
        callback(null, [address]);
      } else {
        callback(null, address.address, address.family);
      }
    };

    return await new Promise<string | null>((resolve) => {
      let settled = false;
      const finish = (dataUri: string | null) => {
        if (settled) return;
        settled = true;
        resolve(dataUri);
      };

      const request = httpsRequest(
        parsedUrl,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (compatible; GitHubRepoBanner/1.0; +https://ghrb.waren.build)',
          },
          lookup: pinnedLookup,
          signal: AbortSignal.timeout(10_000),
        },
        (response) => {
          if (
            response.statusCode === undefined ||
            response.statusCode < 200 ||
            response.statusCode >= 300
          ) {
            response.destroy();
            finish(null);
            return;
          }

          const declaredLength = response.headers['content-length'];
          if (
            declaredLength &&
            Number.parseInt(declaredLength, 10) > maxBytes
          ) {
            response.destroy();
            finish(null);
            return;
          }

          const rawContentType = response.headers['content-type'];
          if (typeof rawContentType !== 'string') {
            response.destroy();
            finish(null);
            return;
          }
          const contentType = rawContentType
            .split(';', 1)[0]
            .trim()
            .toLowerCase();
          if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
            response.destroy();
            finish(null);
            return;
          }

          const chunks: Buffer[] = [];
          let totalBytes = 0;
          response.on('data', (chunk: Buffer) => {
            totalBytes += chunk.byteLength;
            if (totalBytes > maxBytes) {
              response.destroy();
              finish(null);
              return;
            }
            chunks.push(chunk);
          });
          response.on('end', () => {
            if (totalBytes === 0) {
              finish(null);
              return;
            }
            finish(
              `data:${contentType};base64,${Buffer.concat(chunks).toString('base64')}`,
            );
          });
          response.on('aborted', () => finish(null));
          response.on('error', () => finish(null));
        },
      );

      request.on('error', () => finish(null));
      request.end();
    });
  } catch {
    return null;
  }
}
