import { ExecutiveVisualAsset, ExecutiveVisualPalette } from '../types';

export const EXECUTIVE_VISUAL_ASSET_KEYS = [
  'shield-lock','bank-building','server-hsm','certificate','network-nodes','clipboard-magnifier','roadmap-calendar','puzzle-interoperability','collaboration','target'
] as const;

export type ExecutiveVisualAssetKey = typeof EXECUTIVE_VISUAL_ASSET_KEYS[number];

export const EXECUTIVE_VISUAL_PALETTES: ExecutiveVisualPalette[] = ['blue', 'green', 'dark-green', 'deep-blue', 'neutral'];

const STYLE_RULES = 'Brand-neutral executive illustration, no logos, no text, no watermark, no external branding, soft 3D clay or isometric style, white green blue and slate materials, consistent studio lighting, transparent background or clean removable chroma-key background.';

export const EXECUTIVE_ILLUSTRATION_PROMPTS: Record<ExecutiveVisualAssetKey, string> = {
  'shield-lock': 'A soft 3D clay shield with an integrated lock, security and trust concept.',
  'bank-building': 'A minimal isometric bank or institutional building with columns, governance and stability concept.',
  'server-hsm': 'A soft 3D secure server rack with a hardware security module cube, encryption and infrastructure concept.',
  certificate: 'A clean certificate or policy document with seal shape but no readable words, compliance concept.',
  'network-nodes': 'A cluster of connected network nodes and rails, interoperability and ecosystem concept.',
  'clipboard-magnifier': 'A clipboard with check marks implied by shapes and a magnifying glass, audit and assessment concept.',
  'roadmap-calendar': 'A calendar tile with roadmap path markers but no numbers or words, sequencing and milestones concept.',
  'puzzle-interoperability': 'Interlocking puzzle pieces and connector pins, interoperability and fit concept.',
  collaboration: 'A circle of abstract people nodes around a shared center, collaboration and alignment concept.',
  target: 'A strategic target with an arrow and simple orbit rings, focus and execution concept.'
};

export function buildExecutiveIllustrationPrompt(input: {
  key: string;
  slideTitle?: string;
  cardHeading?: string;
  cardTakeaway?: string;
  palette?: ExecutiveVisualPalette;
}) {
  const key = EXECUTIVE_VISUAL_ASSET_KEYS.includes(input.key as ExecutiveVisualAssetKey) ? input.key as ExecutiveVisualAssetKey : 'target';
  const base = EXECUTIVE_ILLUSTRATION_PROMPTS[key];
  const palette = input.palette || 'neutral';
  return `${base} Palette emphasis: ${palette}. Slide context: ${input.slideTitle || 'Executive slide'}. Card context: ${input.cardHeading || 'Key message'}${input.cardTakeaway ? `; takeaway: ${input.cardTakeaway}` : ''}. ${STYLE_RULES}`;
}

export function createPendingExecutiveVisualAsset(input: { key: string; prompt: string; alt?: string }): ExecutiveVisualAsset {
  return { key: input.key, prompt: input.prompt, alt: input.alt, status: 'pending' };
}
