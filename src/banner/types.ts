export interface BackgroundPreset {
  id: string;
  name: string;
  type: 'gradient' | 'solid' | 'transparent';
  stops?: Array<{ offset: string; color: string }>;
  color?: string;
  defaultTextColor: string;
}

export interface HeaderSegment {
  type: 'text' | 'emoji' | 'icon';
  value: string;
  /** Theme for icons (auto, light, or dark) */
  theme?: 'light' | 'dark' | 'auto';
  /** Width in SVG units — computed during rendering */
  width?: number;
}

export interface BannerOptions {
  header: string;
  subheader?: string;
  background: BackgroundPreset;
  textColor: string;
  subheaderColor?: string;
  fontFamily: string;
  headerFont?: string;
  subheaderFont?: string;
  showWatermark?: boolean;
  watermarkPosition?: string;
}
