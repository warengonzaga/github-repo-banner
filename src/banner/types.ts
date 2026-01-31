export interface BackgroundPreset {
  id: string;
  name: string;
  type: 'gradient' | 'solid' | 'transparent';
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
  subheader?: string;
  background: BackgroundPreset;
  textColor: string;
  subheaderColor?: string;
  fontFamily: string;
  showWatermark?: boolean;
}
