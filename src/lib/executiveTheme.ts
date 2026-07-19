import { ExecutiveLayoutArchetype, SlideContent } from '../types';

export type ExecutivePaletteKey = 'boardroom-light' | 'deep-navy' | 'emerald' | 'slate' | 'amber-risk' | 'neutral-report';

export interface ExecutiveDesignTokens {
  key: ExecutivePaletteKey;
  name: string;
  isLight: boolean;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  mutedText: string;
  accent: string;
  accentAlt: string;
  border: string;
  shadow: string;
  positive: string;
  warning: string;
  risk: string;
  gradient: string;
  motif: {
    ring: string;
    divider: string;
    wash: string;
  };
  chart: string[];
}

export const EXECUTIVE_PALETTES: Record<ExecutivePaletteKey, ExecutiveDesignTokens> = {
  'boardroom-light': {
    key: 'boardroom-light',
    name: 'Boardroom light',
    isLight: true,
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF4F8',
    text: '#0F172A',
    mutedText: '#475569',
    accent: '#0369A1',
    accentAlt: '#047857',
    border: '#CBD5E1',
    shadow: '0 18px 45px rgba(15, 23, 42, 0.14)',
    positive: '#047857',
    warning: '#B45309',
    risk: '#B91C1C',
    gradient: 'linear-gradient(135deg, #F8FAFC 0%, #E0F2FE 100%)',
    motif: { ring: '#E2E8F0', divider: '#CBD5E1', wash: 'rgba(3, 105, 161, 0.08)' },
    chart: ['#0369A1', '#047857', '#334155', '#B45309', '#6D28D9'],
  },
  'deep-navy': {
    key: 'deep-navy',
    name: 'Deep navy',
    isLight: false,
    background: '#061A2F',
    surface: '#FFFFFF',
    surfaceAlt: '#EAF2F8',
    text: '#FFFFFF',
    mutedText: '#D5E3EF',
    accent: '#38BDF8',
    accentAlt: '#34D399',
    border: 'rgba(255, 255, 255, 0.28)',
    shadow: '0 18px 45px rgba(2, 6, 23, 0.28)',
    positive: '#34D399',
    warning: '#FBBF24',
    risk: '#F87171',
    gradient: 'linear-gradient(135deg, #061A2F 0%, #0B3B66 100%)',
    motif: { ring: 'rgba(255, 255, 255, 0.24)', divider: 'rgba(255, 255, 255, 0.72)', wash: 'rgba(56, 189, 248, 0.14)' },
    chart: ['#38BDF8', '#34D399', '#93C5FD', '#FBBF24', '#C4B5FD'],
  },
  emerald: {
    key: 'emerald',
    name: 'Emerald',
    isLight: false,
    background: '#014F36',
    surface: '#FFFFFF',
    surfaceAlt: '#E7F8EF',
    text: '#FFFFFF',
    mutedText: '#D7F2E6',
    accent: '#22C55E',
    accentAlt: '#38BDF8',
    border: 'rgba(255, 255, 255, 0.26)',
    shadow: '0 18px 45px rgba(1, 38, 25, 0.28)',
    positive: '#22C55E',
    warning: '#F59E0B',
    risk: '#EF4444',
    gradient: 'linear-gradient(135deg, #014F36 0%, #047857 100%)',
    motif: { ring: 'rgba(255, 255, 255, 0.24)', divider: 'rgba(255, 255, 255, 0.68)', wash: 'rgba(34, 197, 94, 0.14)' },
    chart: ['#22C55E', '#38BDF8', '#A7F3D0', '#F59E0B', '#94A3B8'],
  },
  slate: {
    key: 'slate',
    name: 'Slate',
    isLight: false,
    background: '#1E293B',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    text: '#FFFFFF',
    mutedText: '#DCE5EF',
    accent: '#94A3B8',
    accentAlt: '#38BDF8',
    border: 'rgba(255, 255, 255, 0.25)',
    shadow: '0 18px 45px rgba(2, 6, 23, 0.24)',
    positive: '#22C55E',
    warning: '#F59E0B',
    risk: '#EF4444',
    gradient: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
    motif: { ring: 'rgba(255, 255, 255, 0.22)', divider: 'rgba(255, 255, 255, 0.68)', wash: 'rgba(148, 163, 184, 0.16)' },
    chart: ['#94A3B8', '#38BDF8', '#22C55E', '#F59E0B', '#F87171'],
  },
  'amber-risk': {
    key: 'amber-risk',
    name: 'Amber risk',
    isLight: true,
    background: '#FFF7ED',
    surface: '#FFFFFF',
    surfaceAlt: '#FFEDD5',
    text: '#1F2937',
    mutedText: '#57534E',
    accent: '#C2410C',
    accentAlt: '#B45309',
    border: '#FDBA74',
    shadow: '0 18px 45px rgba(124, 45, 18, 0.16)',
    positive: '#047857',
    warning: '#B45309',
    risk: '#B91C1C',
    gradient: 'linear-gradient(135deg, #FFF7ED 0%, #FED7AA 100%)',
    motif: { ring: '#FED7AA', divider: '#FDBA74', wash: 'rgba(194, 65, 12, 0.10)' },
    chart: ['#C2410C', '#B45309', '#B91C1C', '#047857', '#334155'],
  },
  'neutral-report': {
    key: 'neutral-report',
    name: 'Neutral report',
    isLight: true,
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    text: '#0F172A',
    mutedText: '#475569',
    accent: '#047857',
    accentAlt: '#0369A1',
    border: '#E2E8F0',
    shadow: '0 18px 45px rgba(15, 23, 42, 0.12)',
    positive: '#047857',
    warning: '#B45309',
    risk: '#B91C1C',
    gradient: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
    motif: { ring: '#F1F5F9', divider: '#E2E8F0', wash: 'rgba(15, 23, 42, 0.04)' },
    chart: ['#047857', '#0369A1', '#334155', '#B45309', '#B91C1C'],
  },
};

const dominantColorPalette: Record<string, ExecutivePaletteKey> = {
  blue: 'boardroom-light',
  'deep-blue': 'deep-navy',
  green: 'emerald',
  'dark-green': 'emerald',
  white: 'neutral-report',
  light: 'boardroom-light',
};

export function selectExecutiveTheme(slide: SlideContent, options: { isTitleSlide?: boolean; slideRole?: string } = {}): ExecutiveDesignTokens {
  const archetype = slide.layoutArchetype;
  const visualType = slide.structuredVisual?.type;
  const roleText = `${options.slideRole || ''} ${slide.eyebrow || ''} ${slide.title || ''}`.toLowerCase();

  let key: ExecutivePaletteKey = dominantColorPalette[slide.dominantColor || ''] || 'emerald';

  if (slide.executiveMode === 'executive-report' || archetype === 'formal-landscape') key = 'neutral-report';
  else if (options.isTitleSlide || archetype === 'title-poster') key = slide.dominantColor === 'green' || slide.dominantColor === 'dark-green' ? 'emerald' : 'deep-navy';
  else if (visualType === 'risk-matrix' || /risk|threat|issue|mitigat|escalat/.test(roleText)) key = 'amber-risk';
  else if (archetype === 'metric-dashboard' || archetype === 'summary-dashboard') key = 'boardroom-light';
  else if (archetype === 'two-column-comparison') key = 'slate';
  else if (archetype === 'five-stage-model') key = slide.dominantColor ? key : 'deep-navy';

  return EXECUTIVE_PALETTES[key];
}

export function getExecutiveAccentColor(accent: string | undefined, theme: ExecutiveDesignTokens): string {
  const accents: Record<string, string> = {
    blue: theme.accentAlt,
    green: theme.positive,
    teal: '#0F766E',
    orange: theme.warning,
    yellow: '#A16207',
    magenta: '#A21CAF',
    red: theme.risk,
    neutral: theme.mutedText,
  };
  return accents[accent || ''] || theme.accent;
}
