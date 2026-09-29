export interface BackgroundEffects {
  blur: number;
  brightness: number;
  contrast: number;
  saturation: number;
  grayscale: number;
}

function bounded(value: string | undefined, max: number, fallback: number) {
  if (!value?.trim()) return fallback;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= max
    ? number
    : fallback;
}

export function parseBackgroundEffects(
  query: Record<string, string>,
): BackgroundEffects {
  return {
    blur: bounded(query.bgblur, 30, 0),
    brightness: bounded(query.bgbrightness, 200, 100),
    contrast: bounded(query.bgcontrast, 200, 100),
    saturation: bounded(query.bgsaturation, 200, 100),
    grayscale: bounded(query.bggrayscale, 100, 0),
  };
}

// Native SVG primitives also survive SVG downloads and canvas PNG export.
export function buildBackgroundFilter(
  effects: BackgroundEffects | undefined,
  hasImage: boolean,
): string {
  if (!effects) return '';
  const { blur, brightness, contrast, saturation, grayscale } = effects;
  const primitives: string[] = [];
  if (hasImage && blur > 0) {
    primitives.push(
      `<feGaussianBlur stdDeviation="${blur}" edgeMode="duplicate" />`,
    );
  }
  for (const [slope, intercept] of [
    [brightness / 100, 0],
    [contrast / 100, (1 - contrast / 100) / 2],
  ]) {
    if (slope === 1 && intercept === 0) continue;
    primitives.push(
      `<feComponentTransfer>${['R', 'G', 'B']
        .map(
          (channel) =>
            `<feFunc${channel} type="linear" slope="${slope}" intercept="${intercept}" />`,
        )
        .join('')}</feComponentTransfer>`,
    );
  }
  for (const color of [saturation / 100, 1 - grayscale / 100]) {
    if (color !== 1) {
      primitives.push(`<feColorMatrix type="saturate" values="${color}" />`);
    }
  }
  if (!primitives.length) return '';
  return `<filter id="background-effects" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">${primitives.join('')}</filter>`;
}
