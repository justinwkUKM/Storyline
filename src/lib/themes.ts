import { ThemeName } from '../types';

export interface ThemeOption {
  id: ThemeName;
  name: string;
  desc: string;
  colors: string;
}

export interface ThemeStyle {
  bg: string;
  text: string;
  accent: string;
  title: string;
}

export const THEMES: ThemeOption[] = [
  { id: 'limefrost', name: 'Lime Frost', desc: 'Fresh minty lime and dark green tones', colors: 'bg-lime-500 text-lime-900' },
  { id: 'modern', name: 'Modern Corporate', desc: 'Clean professional blue & slate theme', colors: 'bg-blue-600 text-slate-800' },
  { id: 'cosmic', name: 'Cosmic Slate', desc: 'Ambient futuristic dark mode styling', colors: 'bg-purple-600 text-slate-200 dark' },
  { id: 'minimal', name: 'High-Contrast Mono', desc: 'Swiss minimalist absolute dark & white', colors: 'bg-black text-black' },
  { id: 'sunset', name: 'Sunset Editorial', desc: 'Warm amber, coral, and rose contrast', colors: 'bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 text-white' },
  { id: 'ocean', name: 'Ocean Strategy', desc: 'Cool cyan, teal, and deep navy focus', colors: 'bg-gradient-to-br from-cyan-300 via-teal-500 to-blue-950 text-white' },
  { id: 'lavender', name: 'Lavender Premium', desc: 'Soft violet surfaces with indigo accents', colors: 'bg-gradient-to-br from-violet-100 via-purple-300 to-indigo-500 text-indigo-950' },
  { id: 'rose', name: 'Rose Editorial', desc: 'Pink, cream, and burgundy presentation tones', colors: 'bg-gradient-to-br from-rose-100 via-pink-300 to-rose-700 text-rose-950' },
  { id: 'custom', name: 'Custom Theme Builder', desc: 'Tailor colors, spacing, and layouts', colors: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' }
];

export const themeStyles: Record<ThemeName, ThemeStyle> = {
  modern: { bg: 'bg-white', text: 'text-gray-600', accent: 'bg-blue-600', title: 'text-gray-900' },
  limefrost: { bg: 'bg-lime-50', text: 'text-lime-900', accent: 'bg-lime-500', title: 'text-lime-950' },
  cosmic: { bg: 'bg-slate-950', text: 'text-slate-300', accent: 'bg-purple-600', title: 'text-white' },
  minimal: { bg: 'bg-white', text: 'text-black', accent: 'bg-black', title: 'text-black' },
  sunset: { bg: 'bg-orange-50', text: 'text-orange-950', accent: 'bg-rose-500', title: 'text-orange-950' },
  ocean: { bg: 'bg-cyan-50', text: 'text-slate-700', accent: 'bg-teal-500', title: 'text-slate-950' },
  lavender: { bg: 'bg-violet-50', text: 'text-violet-900', accent: 'bg-violet-500', title: 'text-indigo-950' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-900', accent: 'bg-rose-600', title: 'text-rose-950' },
  custom: { bg: '', text: '', accent: '', title: '' }
};
