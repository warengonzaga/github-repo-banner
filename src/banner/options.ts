import { MAX_CUSTOM_IMAGES, parseImageLayers } from '../ui/image-settings.js';
import { CUSTOM_ICON_SOURCE, validateCustomIcons } from '../ui/inline-icons.js';
import {
  isValidHexColor,
  isValidImageUrl,
  sanitizeFontName,
  sanitizeHeader,
} from '../utils/sanitize.js';
import { parseBackgroundEffects } from './background-effects.js';
import type { BackgroundPreset, BannerOptions } from './types.js';

/** Canonical settings for banner requests and saved export previews. */
export function parseBannerOptions(
  query: Record<string, string>,
): BannerOptions {
  const rawHeader = query.header || 'Hello World';
  const rawSubheader = query.subheader || '';
  const bgParam = query.bg || '1a1a1a-4a4a4a'; // Default gradient
  const bgImgParam = query.bgimg || '';
  const colorParam = query.color || '';
  const subheaderColorParam = query.subheadercolor || '';
  const supportParam = query.support || '';
  const headerFontParam = query.headerfont || '';
  const subheaderFontParam = query.subheaderfont || '';
  const watermarkPosParam = query.watermarkpos || 'bottom-right';

  validateCustomIcons(rawHeader);
  validateCustomIcons(rawSubheader);
  const header = sanitizeHeader(rawHeader, 50);
  const subheader = rawSubheader ? sanitizeHeader(rawSubheader, 60) : undefined;
  // HTML stripping must not introduce a token that escaped validation/counting.
  validateCustomIcons(header);
  validateCustomIcons(subheader || '');
  const images = parseImageLayers(query.images);
  const customCount = [
    ...header.matchAll(new RegExp(CUSTOM_ICON_SOURCE, 'g')),
    ...(subheader || '').matchAll(new RegExp(CUSTOM_ICON_SOURCE, 'g')),
  ].length;
  if (customCount + images.length > MAX_CUSTOM_IMAGES)
    throw new Error(
      'Use at most five custom images across the banner, including inline icons.',
    );

  // Invalid inputs keep the default gradient; a valid image takes precedence.
  let background: BackgroundPreset = {
    id: 'gradient',
    name: 'Gradient',
    type: 'gradient',
    stops: [
      { offset: '0%', color: '#1a1a1a' },
      { offset: '100%', color: '#4a4a4a' },
    ],
    defaultTextColor: '#ffffff',
  };
  if (bgImgParam && isValidImageUrl(bgImgParam)) {
    background = {
      id: 'image',
      name: 'Image',
      type: 'image',
      imageUrl: bgImgParam,
      defaultTextColor: '#ffffff',
    };
  } else if (bgParam.includes('-')) {
    const [startHex, endHex] = bgParam.split('-');
    if (isValidHexColor(startHex) && isValidHexColor(endHex)) {
      background.stops = [
        { offset: '0%', color: `#${startHex}` },
        { offset: '100%', color: `#${endHex}` },
      ];
    }
  } else if (isValidHexColor(bgParam)) {
    background = {
      id: 'solid',
      name: 'Solid',
      type: 'solid',
      color: `#${bgParam}`,
      defaultTextColor: '#ffffff',
    };
  }

  const textColor =
    colorParam && isValidHexColor(colorParam)
      ? `#${colorParam}`
      : background.defaultTextColor;
  const subheaderColor =
    subheaderColorParam && isValidHexColor(subheaderColorParam)
      ? `#${subheaderColorParam}`
      : undefined;

  const showWatermark = supportParam === 'true';

  // Validate watermark position
  const validPositions = [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ];
  const watermarkPosition = validPositions.includes(watermarkPosParam)
    ? watermarkPosParam
    : 'bottom-right';

  // Sanitize and validate font parameters
  const headerFont = headerFontParam
    ? sanitizeFontName(headerFontParam, 50)
    : undefined;
  const subheaderFont = subheaderFontParam
    ? sanitizeFontName(subheaderFontParam, 50)
    : undefined;

  return {
    ...(images.length ? { images } : {}),
    header,
    subheader,
    background,
    backgroundEffects: parseBackgroundEffects(query),
    textColor,
    subheaderColor,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    headerFont,
    subheaderFont,
    showWatermark,
    watermarkPosition,
  };
}
