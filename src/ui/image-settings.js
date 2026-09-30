import { validateCustomImageUrl } from './inline-icons.js';

export const MAX_CUSTOM_IMAGES = 5;
export const MAX_IMAGE_SETTINGS = 4096;
/** @typedef {{src:string,x:number,y:number,w:number,h:number,rotation?:number,fit:'contain'|'stretch',placement:'behind'|'front'}} ImageLayer */
/** Canonical query/storage model, also used by the editor.
 * @param {string|undefined} raw @returns {ImageLayer[]} */
export function parseImageLayers(raw) {
  if (!raw) return [];
  if (raw.length > MAX_IMAGE_SETTINGS) throw new Error('Custom image settings are too long. Use shorter image URLs.');
  let layers;
  try { layers = JSON.parse(raw); } catch { throw new Error('Custom images must be a JSON array.'); }
  if (!Array.isArray(layers) || layers.length > MAX_CUSTOM_IMAGES) throw new Error('Use at most five custom images per banner.');
  return layers.map((layer, index) => {
    const prefix = `Image ${index + 1}: `;
    if (!layer || typeof layer !== 'object' || Array.isArray(layer) || Object.keys(layer).some(key => !['src','x','y','w','h','rotation','fit','placement'].includes(key))) throw new Error(prefix + 'invalid image settings.');
    if (typeof layer.src !== 'string') throw new Error(prefix + 'add a public HTTPS image URL.');
    try { validateCustomImageUrl(layer.src); } catch (error) { throw new Error(prefix + (error instanceof Error ? error.message : 'invalid URL.')); }
    const values = {x:layer.x === undefined ? 0 : layer.x,y:layer.y === undefined ? 0 : layer.y,w:layer.w === undefined ? 128 : layer.w,h:layer.h === undefined ? 128 : layer.h};
    for (const [name,min,max] of /** @type {[keyof typeof values,number,number][]} */ ([['x',0,1280],['y',0,304],['w',1,1280],['h',1,304]])) {
      if (typeof values[name] !== 'number' || !Number.isFinite(values[name]) || values[name] < min || values[name] > max) throw new Error(`${prefix}${name} must be ${min}–${max} pixels.`);
    }
    const rotation = layer.rotation === undefined ? 0 : layer.rotation;
    if (typeof rotation !== 'number' || !Number.isFinite(rotation) || rotation < 0 || rotation > 360) throw new Error(prefix + 'rotation must be 0–360 degrees.');
    const fit = layer.fit === undefined ? 'contain' : layer.fit, placement = layer.placement === undefined ? 'behind' : layer.placement;
    if (fit !== 'contain' && fit !== 'stretch') throw new Error(prefix + 'choose preserve proportions or stretch.');
    if (placement !== 'behind' && placement !== 'front') throw new Error(prefix + 'choose behind or in front of text.');
    // Omit the neutral value so existing saved-export fingerprints remain stable.
    return {src:layer.src,...values,...(rotation ? {rotation} : {}),fit,placement};
  });
}
