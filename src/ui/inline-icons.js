import { isValidImageUrl } from './image-url.js';

export const BRAND_ICON_SOURCE = '!\\[([a-z0-9_-]+)\\](?:\\((light|dark|auto)\\))?';
export const CUSTOM_ICON_SOURCE = '!\\[icon(?:\\s+[a-z]+="[^"\\r\\n]*")+\\s*\\]';
export const INLINE_ICON_SOURCE = `${CUSTOM_ICON_SOURCE}|${BRAND_ICON_SOURCE}`;
export const MAX_TEXT_INPUT = 2048;
export const MAX_CUSTOM_IMAGE_URL = 512;

/** @typedef {{src:string,w?:string,h?:string}} CustomIcon */
/** @param {string} src */
export function validateCustomImageUrl(src) {
  if (src.length > MAX_CUSTOM_IMAGE_URL || !isValidImageUrl(src) || /[\uD800-\uDFFF]/u.test(src) || /[<>"\u0000-\u0020]/.test(src)) {
    throw new Error('Use a public HTTPS image URL of at most 512 characters.');
  }
}
/** @param {string} value */
function validSize(value) {
  const match = /^(\d+(?:\.\d+)?)(px|%)$/.exec(value);
  return !!match && Number(match[1]) >= 1 && Number(match[1]) <= (match[2] === '%' ? 200 : 304);
}
/** @param {string} token @returns {CustomIcon} */
export function parseCustomIcon(token) {
  if (!new RegExp(`^${CUSTOM_ICON_SOURCE}$`).test(token)) throw new Error('Use ![icon src="https://…" w="100%"] for a custom icon.');
  /** @type {Record<string,string>} */
  const attributes = {};
  for (const match of token.matchAll(/([a-z]+)="([^"\r\n]*)"/g)) {
    const [, name, value] = match;
    if (!['src', 'w', 'h'].includes(name) || Object.hasOwn(attributes, name)) throw new Error('Custom icons accept src, w and h once each.');
    attributes[name] = value;
  }
  if (!attributes.src) throw new Error('Add a public HTTPS src to the custom icon.');
  validateCustomImageUrl(attributes.src);
  for (const name of ['w', 'h']) {
    if (attributes[name] && !validSize(attributes[name])) throw new Error('Icon sizes must be 1–304px or 1–200%.');
    if (Object.hasOwn(attributes, name) && !attributes[name]) throw new Error('Remove an empty icon size or enter a size such as 48px.');
  }
  return {src:attributes.src, ...(attributes.w ? {w:attributes.w} : {}), ...(attributes.h ? {h:attributes.h} : {})};
}
/** Validate custom syntax before sanitization can truncate a URL. @param {string} text */
export function validateCustomIcons(text) {
  if (!/!\[icon\s/.test(text)) return;
  if (text.length > MAX_TEXT_INPUT) throw new Error('Text containing custom icons must be at most 2,048 characters including URLs.');
  const remaining = text.replace(new RegExp(CUSTOM_ICON_SOURCE, 'g'), token => { parseCustomIcon(token); return ''; });
  if (/!\[icon\s/.test(remaining)) throw new Error('Finish the custom icon syntax: ![icon src="https://…" w="100%"].');
}
/** @param {string|undefined} size @param {number} fontSize */
export function iconPixels(size, fontSize) {
  return size ? parseFloat(size) * (size.endsWith('%') ? fontSize / 100 : 1) : fontSize;
}
/** Canonical complete-token truncation, shared by the renderer and input counter.
 * @param {string} raw @param {number} maxLength */
export function sanitizeBannerText(raw, maxLength = 50) {
  const cap = /!\[icon\s/.test(raw) ? MAX_TEXT_INPUT : 500;
  const text = raw.replace(/<[^>]*>/g, '').slice(0, cap).replace(/[\uD800-\uDFFF]/gu, '');
  const allIcons = new RegExp(INLINE_ICON_SOURCE, 'g');
  if (text.replace(allIcons, '').length <= maxLength && (text.match(allIcons) || []).length <= 5) return text;
  const tokenAtStart = new RegExp(`^(?:${INLINE_ICON_SOURCE})`);
  let result = '', count = 0, icons = 0, protectedEnd = 0;
  for (let i = 0; i < text.length;) {
    const token = tokenAtStart.exec(text.slice(i));
    if (token) {
      if (icons++ < 5) {
        result += token[0];
        if (/!\[icon\s/.test(token[0])) protectedEnd = result.length;
      }
      i += token[0].length;
    } else {
      if (count >= maxLength) break;
      result += text[i++]; count++;
    }
  }
  // Complete custom tokens are atomic: brackets inside their URLs are not syntax to repair.
  const tail = result.slice(protectedEnd);
  const open = tail.lastIndexOf('![');
  if (open !== -1 && !tail.slice(open).includes(']')) result = result.slice(0, protectedEnd + open);
  // Preserve the established behavior for an unfinished brand theme suffix.
  const theme = tail.lastIndexOf('](');
  const brandStart = tail.lastIndexOf('![', theme);
  if (theme !== -1 && brandStart !== -1 && !tail.slice(theme).includes(')')) result = result.slice(0, protectedEnd + brandStart);
  return result.replace(/[\uD800-\uDFFF]/gu, '').trimEnd();
}
/** Public label must never read an image URL or attribute syntax aloud. @param {string} text */
export function describeBannerText(text) {
  return text.replace(new RegExp(CUSTOM_ICON_SOURCE, 'g'), 'custom icon')
    .replace(new RegExp(BRAND_ICON_SOURCE, 'g'), '$1 icon').replace(/\s+/g, ' ').trim();
}
