import type { BackgroundPreset } from './types.js';

export const BACKGROUNDS: Record<string, BackgroundPreset> = {
  'gradient-mono': {
    id: 'gradient-mono',
    name: 'Midnight',
    type: 'gradient',
    stops: [
      { offset: '0%', color: '#1a1a1a' },
      { offset: '100%', color: '#4a4a4a' },
    ],
    defaultTextColor: '#ffffff',
  },
  'gradient-modern': {
    id: 'gradient-modern',
    name: 'Vibe',
    type: 'gradient',
    stops: [
      { offset: '0%', color: '#ec4899' },
      { offset: '100%', color: '#3b82f6' },
    ],
    defaultTextColor: '#ffffff',
  },
  'gradient-fresh': {
    id: 'gradient-fresh',
    name: 'Ocean',
    type: 'gradient',
    stops: [
      { offset: '0%', color: '#14b8a6' },
      { offset: '100%', color: '#06b6d4' },
    ],
    defaultTextColor: '#ffffff',
  },
  'gradient-ossph': {
    id: 'gradient-ossph',
    name: 'OSSPH',
    type: 'gradient',
    stops: [
      { offset: '0%', color: '#E7F9FF' },
      { offset: '100%', color: '#90C4E8' },
    ],
    defaultTextColor: '#0060A0',
  },
  'solid-lightblue': {
    id: 'solid-lightblue',
    name: 'Sky',
    type: 'solid',
    color: '#87CEEB',
    defaultTextColor: '#1e3a8a',
  },
  'solid-salmon': {
    id: 'solid-salmon',
    name: 'Molty',
    type: 'solid',
    color: '#fee2e2',
    defaultTextColor: '#BB2C2C',
  },
  'solid-claude': {
    id: 'solid-claude',
    name: 'Claude',
    type: 'solid',
    color: '#fde8e3',
    defaultTextColor: '#DE7356',
  },
  'solid-gpt': {
    id: 'solid-gpt',
    name: 'GPT',
    type: 'solid',
    color: '#10a37f',
    defaultTextColor: '#ffffff',
  },
  'solid-lightgray': {
    id: 'solid-lightgray',
    name: 'Minimal',
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

export const DEFAULT_BG = 'gradient-mono';
