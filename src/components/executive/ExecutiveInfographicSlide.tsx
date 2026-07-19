import React from 'react';
import { BarChart3, CheckCircle2, CircleDot, FileText, Layers3, Network, Shield, Sparkles, Target } from 'lucide-react';
import { ExecutiveSlideCard, ExecutiveVisualAsset, PresentationData, SlideContent } from '../../types';
import { getExecutiveAssetUrl } from '../../lib/executiveAssetMap';
import { sanitizeRichTextHtml } from '../../lib/richText';
import { cn } from '../../lib/utils';
import { ExecutiveStructuredVisualRenderer } from './visuals';

interface ExecutiveInfographicSlideProps {
  slide: SlideContent;
  deckTitle: PresentationData['title'];
  slideIndex: number;
  totalSlides: number;
  isTitleSlide?: boolean;
  exportMode?: boolean;
  isVertical?: boolean;
}

const COLOR_MAP = {
  blue: { bg: '#20AEEA', deep: '#0455C9', dark: '#06233F', accent: '#20AEEA' },
  'deep-blue': { bg: '#0455C9', deep: '#034BC5', dark: '#06233F', accent: '#20AEEA' },
  green: { bg: '#00CE68', deep: '#014F36', dark: '#014F36', accent: '#00CE68' },
  'dark-green': { bg: '#014F36', deep: '#006B3D', dark: '#062E23', accent: '#00CE68' },
  white: { bg: '#FFFFFF', deep: '#014F36', dark: '#06233F', accent: '#00CE68' },
  light: { bg: '#F7FAFC', deep: '#0455C9', dark: '#06233F', accent: '#00CE68' },
};

const ACCENT_MAP: Record<string, string> = {
  blue: '#20AEEA',
  green: '#00CE68',
  teal: '#14B8A6',
  orange: '#F97316',
  yellow: '#EAB308',
  magenta: '#D946EF',
  red: '#EF4444',
  neutral: '#64748B',
};

function getIcon(name?: string) {
  const key = (name || '').toLowerCase();
  if (key.includes('shield') || key.includes('risk') || key.includes('lock')) return Shield;
  if (key.includes('network') || key.includes('globe') || key.includes('align')) return Network;
  if (key.includes('chart') || key.includes('metric') || key.includes('data')) return BarChart3;
  if (key.includes('layer') || key.includes('stage') || key.includes('roadmap')) return Layers3;
  if (key.includes('file') || key.includes('report') || key.includes('policy')) return FileText;
  if (key.includes('check') || key.includes('ready')) return CheckCircle2;
  if (key.includes('target') || key.includes('goal')) return Target;
  return Sparkles;
}


function getVisualAssetUrl(asset?: ExecutiveVisualAsset) {
  return asset?.status === 'ready' && asset.url ? asset.url : getExecutiveAssetUrl(asset?.key);
}

function getVisualPlaceholderLabel(asset?: ExecutiveVisualAsset) {
  if (asset?.status === 'failed') return 'Visual unavailable';
  if (asset?.status === 'pending') return 'Visual queued';
  return asset?.key ? asset.key.replace(/-/g, ' ') : 'Executive visual';
}

function getSlideAsset(slide: SlideContent, key?: string) {
  return slide.visualAssets?.find((asset) => asset.key === key || asset.id === key);
}

function VisualAnchor({ asset, iconName, accent, className }: { asset?: ExecutiveVisualAsset; iconName?: string; accent: string; className?: string }) {
  const src = getVisualAssetUrl(asset);
  const Icon = getIcon(iconName || asset?.key);
  if (src) {
    return (
      <div className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-50', className || 'h-20 w-20')} data-executive-visual-asset={asset?.key || 'curated'}>
        <img src={src} alt={asset?.alt || `${asset?.key || 'Executive'} visual asset`} className="h-full w-full object-contain p-1" loading="eager" decoding="async" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
      </div>
    );
  }
  return (
    <div
      className={cn('relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br from-slate-50 via-white to-slate-100 shadow-inner', className || 'h-12 w-12')}
      style={{ color: accent }}
      data-executive-visual-placeholder={asset?.status || 'missing'}
      data-executive-lucide-fallback="true"
      aria-label={getVisualPlaceholderLabel(asset)}
    >
      <div className="absolute -right-3 -top-3 h-2/3 w-2/3 rounded-full opacity-15 blur-sm" style={{ backgroundColor: accent }} />
      <Icon className="relative h-1/2 w-1/2 drop-shadow-sm" />
      {asset?.status === 'failed' && <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white" />}
    </div>
  );
}

function getFallbackCards(slide: SlideContent): ExecutiveSlideCard[] {
  if (slide.cards && slide.cards.length > 0) return slide.cards;
  const points = slide.content.length > 0 ? slide.content : ['Key message'];
  return points.slice(0, 3).map((point, index) => ({
    number: String(index + 1).padStart(2, '0'),
    heading: index === 0 ? 'Core message' : `Key point ${index + 1}`,
    points: [point],
    accent: index % 2 === 0 ? 'green' : 'blue',
  }));
}

function ExecutiveMotif({ light }: { light: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className={cn('absolute -bottom-10 -left-10 h-52 w-72 rotate-[-18deg] rounded-[42px] border-[18px]', light ? 'border-slate-100' : 'border-white/24')}
      />
      <div className={cn('absolute bottom-5 left-0 h-px w-full', light ? 'bg-slate-200' : 'bg-white/70')} />
    </div>
  );
}

function FramingCard({ slide, accent }: { slide: SlideContent; accent: string }) {
  if (!slide.framingStatement) return null;
  return (
    <div className="relative z-10 flex items-center gap-5 rounded-[26px] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
      <VisualAnchor asset={slide.heroVisualAsset || slide.visualAssets?.[0]} iconName={slide.bottomLine?.icon || slide.cards?.[0]?.icon} accent={accent} className="h-16 w-16" />
      <div className="text-2xl font-black leading-tight text-slate-950" dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(slide.framingStatement) }} />
    </div>
  );
}

const StoryCard: React.FC<{ card: ExecutiveSlideCard; compact?: boolean }> = ({ card, compact = false }) => {
  const accent = ACCENT_MAP[card.accent || 'green'] || ACCENT_MAP.green;
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_18px_38px_rgba(15,23,42,0.14)] ring-1 ring-black/5">
      <div className="h-2" style={{ backgroundColor: accent }} />
      <div className={cn('flex flex-1 flex-col p-5', compact ? 'gap-2' : 'gap-3')}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: accent }}>{card.number}</div>
            <h3 className="mt-1 text-xl font-black leading-tight text-slate-950">{card.heading}</h3>
            {card.subheading && <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{card.subheading}</p>}
          </div>
          <VisualAnchor asset={card.visualAsset} iconName={card.icon || card.illustration || card.heading} accent={accent} className={compact ? 'h-14 w-14' : 'h-20 w-20'} />
        </div>
        <ul className="space-y-2 text-sm font-semibold leading-snug text-slate-700">
          {(card.points || []).slice(0, 4).map((point, index) => (
            <li key={index} className="flex gap-2">
              <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
              <span dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(point) }} />
            </li>
          ))}
        </ul>
      </div>
      {card.takeaway && <div className="bg-slate-950 px-5 py-3 text-sm font-black text-white">{card.takeaway}</div>}
    </div>
  );
};

function BottomLine({ slide, dark }: { slide: SlideContent; dark: string }) {
  if (!slide.bottomLine?.text) return null;
  return (
    <div className="relative z-10 flex items-center gap-4 rounded-[24px] px-6 py-4 text-white shadow-[0_16px_34px_rgba(15,23,42,0.18)]" style={{ backgroundColor: dark }}>
      <VisualAnchor asset={slide.bottomLine.visualAsset} iconName={slide.bottomLine.icon || 'target'} accent="#ffffff" className="h-14 w-14 bg-white/14" />
      <p className="text-lg font-bold leading-tight">
        {slide.bottomLine.label && <span className="font-black text-emerald-300">{slide.bottomLine.label}: </span>}
        <span dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(slide.bottomLine.text) }} />
      </p>
    </div>
  );
}

function FormalLandscape({ slide, deckTitle, slideIndex, totalSlides }: ExecutiveInfographicSlideProps) {
  const cards = getFallbackCards(slide).slice(0, 6);
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-white p-12 text-slate-950">
      <ExecutiveMotif light />
      <div className="relative z-10">
        {slide.eyebrow && <div className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-emerald-600">{slide.eyebrow}</div>}
        <h2 className="max-w-5xl text-5xl font-black leading-[1.02]">{slide.title}</h2>
        {slide.framingStatement && <p className="mt-5 max-w-4xl border-l-4 border-emerald-400 pl-5 text-xl font-bold leading-snug text-slate-700">{slide.framingStatement}</p>}
      </div>
      <div className="relative z-10 mt-8 grid flex-1 grid-cols-2 gap-5 overflow-hidden">
        {slide.structuredVisual ? <ExecutiveStructuredVisualRenderer visual={slide.structuredVisual} className="col-span-2 min-h-0" /> : cards.map((card, index) => <StoryCard key={index} card={card} compact />)}
      </div>
      <div className="relative z-10 mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-xs font-bold uppercase tracking-widest text-slate-400">
        <span>{deckTitle}</span><span>{slideIndex + 1} / {totalSlides}</span>
      </div>
    </div>
  );
}

export function ExecutiveInfographicSlide(props: ExecutiveInfographicSlideProps) {
  const { slide, deckTitle, slideIndex, totalSlides, isTitleSlide, isVertical } = props;
  const explicitReport = slide.executiveMode === 'executive-report' || slide.layoutArchetype === 'formal-landscape';
  if (explicitReport) return <FormalLandscape {...props} />;

  const color = COLOR_MAP[slide.dominantColor || (slideIndex % 2 === 0 ? 'green' : 'deep-blue')] || COLOR_MAP.green;
  const cards = getFallbackCards(slide).slice(0, slide.layoutArchetype === 'five-stage-model' ? 5 : slide.layoutArchetype === 'two-column-comparison' ? 2 : 3);
  const title = isTitleSlide ? deckTitle : slide.title;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden p-10 text-white" style={{ backgroundColor: color.bg }}>
      <ExecutiveMotif light={false} />
      <div className="relative z-10 flex items-start justify-between gap-8">
        <div>
          {slide.eyebrow && <div className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-white/70">{slide.eyebrow}</div>}
          <h2 className={cn('max-w-5xl font-black leading-[0.98]', isVertical ? 'text-4xl' : 'text-6xl')}>{title}</h2>
        </div>
        <div className="rounded-full border border-white/25 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/75">Executive Infographic</div>
      </div>

      <div className="relative z-10 mt-6 space-y-5">
        <FramingCard slide={slide} accent={color.accent} />
      </div>

      <div className={cn('relative z-10 mt-6 grid flex-1 gap-5 overflow-hidden', slide.structuredVisual ? 'grid-cols-5' : cards.length === 2 ? 'grid-cols-2' : cards.length >= 5 ? 'grid-cols-5' : 'grid-cols-3')}>
        {slide.structuredVisual && <ExecutiveStructuredVisualRenderer visual={slide.structuredVisual} className="col-span-3 min-h-0" />}
        {cards.map((card, index) => <StoryCard key={index} card={card} compact={Boolean(slide.structuredVisual)} />)}
      </div>

      <div className="relative z-10 mt-5">
        <BottomLine slide={slide} dark={color.dark} />
      </div>
    </div>
  );
}
