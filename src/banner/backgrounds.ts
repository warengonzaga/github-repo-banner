import type { BackgroundPreset } from './types.js';

export const BACKGROUNDS: Record<string, BackgroundPreset> = {
  'gradient-mono': {
    id: 'gradient-mono',
    name: 'Monochrome',
    type: 'gradient',
    stops: [
      { offset: '0%', color: '#1a1a1a' },
      { offset: '100%', color: '#4a4a4a' },
    ],
    defaultTextColor: '#ffffff',
  },
  'gradient-modern': {
    id: 'gradient-modern',
    name: 'Modern',
    type: 'gradient',
    stops: [
      { offset: '0%', color: '#ec4899' },
      { offset: '100%', color: '#3b82f6' },
    ],
    defaultTextColor: '#ffffff',
  },
  'gradient-fresh': {
    id: 'gradient-fresh',
    name: 'Fresh',
    type: 'gradient',
    stops: [
      { offset: '0%', color: '#14b8a6' },
      { offset: '100%', color: '#06b6d4' },
    ],
    defaultTextColor: '#ffffff',
  },
  'solid-lightblue': {
    id: 'solid-lightblue',
    name: 'Light Blue',
    type: 'solid',
    color: '#dbeafe',
    defaultTextColor: '#1e3a5f',
  },
  'solid-salmon': {
    id: 'solid-salmon',
    name: 'Salmon',
    type: 'solid',
    color: '#fecaca',
    defaultTextColor: '#7f1d1d',
  },
  'solid-lightgray': {
    id: 'solid-lightgray',
    name: 'Light Gray',
    type: 'solid',
    color: '#f3f4f6',
    defaultTextColor: '#1f2937',
  },
  'transparent': {
    id: 'transparent',
    name: 'Transparent',
    type: 'transparent',
    defaultTextColor: '#ffffff',
  },
};

export const DEFAULT_BG = 'gradient-modern';
