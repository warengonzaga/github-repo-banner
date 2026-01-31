export interface BackgroundPreset {
  id: string;
  name: string;
  type: 'gradient' | 'solid';
  stops?: Array<{ offset: string; color: string }>;
  color?: string;
  defaultTextColor: string;
}

export interface HeaderSegment {
  type: 'text' | 'emoji';
  value: string;
  /** Width in SVG units — computed during rendering */
  width?: number;
}

export interface BannerOptions {
  header: string;
  background: BackgroundPreset;
  textColor: string;
  fontFamily: string;
}
