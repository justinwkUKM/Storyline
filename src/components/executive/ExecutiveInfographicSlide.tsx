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
    <div className={cn('flex shrink-0 items-center justify-center rounded-2xl bg-slate-100', className || 'h-12 w-12')} style={{ color: accent }} data-executive-lucide-fallback="true">
      <Icon className="h-1/2 w-1/2" />
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

function SlideFooter({ deckTitle, slideIndex, totalSlides, light = false }: { deckTitle: PresentationData['title']; slideIndex: number; totalSlides: number; light?: boolean }) {
  return (
    <div className={cn('relative z-10 mt-5 flex items-center justify-between border-t pt-4 text-xs font-bold uppercase tracking-widest', light ? 'border-slate-200 text-slate-400' : 'border-white/25 text-white/65')}>
      <span>{deckTitle}</span>
      <span>{slideIndex + 1} / {totalSlides}</span>
    </div>
  );
}

function SlideHeader({ slide, title, badge, light = false, isVertical = false }: { slide: SlideContent; title: string; badge: string; light?: boolean; isVertical?: boolean }) {
  return (
    <div className="relative z-10 flex items-start justify-between gap-8">
      <div>
        {slide.eyebrow && <div className={cn('mb-3 text-xs font-black uppercase tracking-[0.28em]', light ? 'text-emerald-600' : 'text-white/70')}>{slide.eyebrow}</div>}
        <h2 className={cn('max-w-5xl font-black leading-[0.98]', isVertical ? 'text-4xl' : light ? 'text-5xl' : 'text-6xl')}>{title}</h2>
      </div>
      <div className={cn('shrink-0 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em]', light ? 'border-slate-200 text-slate-500' : 'border-white/25 text-white/75')}>{badge}</div>
    </div>
  );
}

function TitlePoster(props: ExecutiveInfographicSlideProps) {
  const { slide, deckTitle, slideIndex, totalSlides, isVertical } = props;
  const color = COLOR_MAP[slide.dominantColor || 'deep-blue'] || COLOR_MAP['deep-blue'];
  const title = props.isTitleSlide ? deckTitle : slide.title;
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden p-12 text-white" style={{ backgroundColor: color.bg }}>
      <ExecutiveMotif light={false} />
      <div className="relative z-10 grid flex-1 grid-cols-[1.25fr_.75fr] items-center gap-10">
        <div>
          {slide.eyebrow && <div className="mb-5 text-sm font-black uppercase tracking-[0.32em] text-white/70">{slide.eyebrow}</div>}
          <h1 className={cn('font-black leading-[0.9] tracking-[-0.05em]', isVertical ? 'text-6xl' : 'text-8xl')}>{title}</h1>
          {slide.framingStatement && <p className="mt-8 max-w-3xl text-2xl font-bold leading-tight text-white/86" dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(slide.framingStatement) }} />}
        </div>
        <div className="flex items-center justify-center">
          <VisualAnchor asset={slide.heroVisualAsset || slide.visualAssets?.[0]} iconName={slide.bottomLine?.icon || slide.title} accent="#ffffff" className="h-72 w-72 rounded-[44px] bg-white/14 ring-1 ring-white/20" />
        </div>
      </div>
      <SlideFooter deckTitle={deckTitle} slideIndex={slideIndex} totalSlides={totalSlides} />
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
      <SlideFooter deckTitle={deckTitle} slideIndex={slideIndex} totalSlides={totalSlides} light />
    </div>
  );
}

function ThreeCardStory(props: ExecutiveInfographicSlideProps) {
  const { slide, deckTitle, slideIndex, totalSlides, isTitleSlide, isVertical } = props;
  const color = COLOR_MAP[slide.dominantColor || (slideIndex % 2 === 0 ? 'green' : 'deep-blue')] || COLOR_MAP.green;
  const cards = getFallbackCards(slide).slice(0, 3);
  const title = isTitleSlide ? deckTitle : slide.title;
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden p-10 text-white" style={{ backgroundColor: color.bg }}>
      <ExecutiveMotif light={false} />
      <SlideHeader slide={slide} title={title} badge="Executive Infographic" isVertical={isVertical} />
      <div className="relative z-10 mt-6 space-y-5"><FramingCard slide={slide} accent={color.accent} /></div>
      <div className="relative z-10 mt-6 grid flex-1 grid-cols-3 gap-5 overflow-hidden">
        {cards.map((card, index) => <StoryCard key={index} card={card} compact={Boolean(slide.structuredVisual)} />)}
      </div>
      <div className="relative z-10 mt-5"><BottomLine slide={slide} dark={color.dark} /></div>
      <SlideFooter deckTitle={deckTitle} slideIndex={slideIndex} totalSlides={totalSlides} />
    </div>
  );
}

function TwoColumnComparison(props: ExecutiveInfographicSlideProps) {
  const { slide, deckTitle, slideIndex, totalSlides, isTitleSlide, isVertical } = props;
  const color = COLOR_MAP[slide.dominantColor || 'deep-blue'] || COLOR_MAP['deep-blue'];
  const cards = getFallbackCards(slide).slice(0, 2);
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden p-10 text-white" style={{ backgroundColor: color.bg }}>
      <ExecutiveMotif light={false} />
      <SlideHeader slide={slide} title={isTitleSlide ? deckTitle : slide.title} badge="Comparison" isVertical={isVertical} />
      <div className="relative z-10 mt-6 space-y-5"><FramingCard slide={slide} accent={color.accent} /></div>
      <div className="relative z-10 mt-6 grid flex-1 grid-cols-2 gap-6 overflow-hidden">
        {slide.structuredVisual ? <ExecutiveStructuredVisualRenderer visual={slide.structuredVisual} className="col-span-2 min-h-0" /> : cards.map((card, index) => <StoryCard key={index} card={card} />)}
      </div>
      <div className="relative z-10 mt-5"><BottomLine slide={slide} dark={color.dark} /></div>
      <SlideFooter deckTitle={deckTitle} slideIndex={slideIndex} totalSlides={totalSlides} />
    </div>
  );
}

function MetricDashboard(props: ExecutiveInfographicSlideProps) {
  const { slide, deckTitle, slideIndex, totalSlides, isVertical } = props;
  const color = COLOR_MAP[slide.dominantColor || 'dark-green'] || COLOR_MAP['dark-green'];
  const metrics = slide.structuredVisual?.metrics || [];
  const fallbackCards = getFallbackCards(slide).slice(0, 4);
  const kpis = metrics.length ? metrics.slice(0, 6) : fallbackCards.map((card) => ({ label: card.heading, value: card.number || 'KPI', description: card.points[0] }));
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden p-10 text-white" style={{ backgroundColor: color.bg }}>
      <ExecutiveMotif light={false} />
      <SlideHeader slide={slide} title={slide.title} badge="Metric Dashboard" isVertical={isVertical} />
      {slide.framingStatement && <p className="relative z-10 mt-5 max-w-4xl text-xl font-bold leading-snug text-white/82" dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(slide.framingStatement) }} />}
      <div className="relative z-10 mt-6 grid flex-1 grid-cols-3 gap-5 overflow-hidden">
        {kpis.map((metric, index) => (
          <div key={index} className="rounded-[26px] bg-white p-6 text-slate-950 shadow-[0_18px_38px_rgba(15,23,42,0.14)] ring-1 ring-black/5">
            <div className="text-5xl font-black leading-none" style={{ color: ACCENT_MAP[index % 2 ? 'blue' : 'green'] }}>{metric.value}</div>
            <div className="mt-3 text-lg font-black">{metric.label}</div>
            {metric.description && <div className="mt-2 text-sm font-semibold leading-snug text-slate-600">{metric.description}</div>}
            {metric.trend && <div className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-emerald-600">{metric.trend}</div>}
          </div>
        ))}
      </div>
      <SlideFooter deckTitle={deckTitle} slideIndex={slideIndex} totalSlides={totalSlides} />
    </div>
  );
}

function FiveStageModel(props: ExecutiveInfographicSlideProps) {
  const { slide, deckTitle, slideIndex, totalSlides, isVertical } = props;
  const color = COLOR_MAP[slide.dominantColor || 'green'] || COLOR_MAP.green;
  const cards = getFallbackCards(slide).slice(0, 5);
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden p-10 text-white" style={{ backgroundColor: color.bg }}>
      <ExecutiveMotif light={false} />
      <SlideHeader slide={slide} title={slide.title} badge="Five-stage Model" isVertical={isVertical} />
      <div className="relative z-10 mt-6 grid flex-1 grid-cols-5 items-stretch gap-4 overflow-hidden">
        {cards.map((card, index) => <StoryCard key={index} card={{ ...card, number: card.number || `0${index + 1}` }} compact />)}
      </div>
      <div className="relative z-10 mt-5"><BottomLine slide={slide} dark={color.dark} /></div>
      <SlideFooter deckTitle={deckTitle} slideIndex={slideIndex} totalSlides={totalSlides} />
    </div>
  );
}

function SummaryDashboard(props: ExecutiveInfographicSlideProps) {
  const { slide, deckTitle, slideIndex, totalSlides, isVertical } = props;
  const color = COLOR_MAP[slide.dominantColor || 'deep-blue'] || COLOR_MAP['deep-blue'];
  const cards = getFallbackCards(slide).slice(0, 4);
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden p-10 text-white" style={{ backgroundColor: color.bg }}>
      <ExecutiveMotif light={false} />
      <SlideHeader slide={slide} title={slide.title} badge="Executive Summary" isVertical={isVertical} />
      <div className="relative z-10 mt-6 rounded-[28px] bg-white p-6 text-2xl font-black leading-tight text-slate-950 shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
        <span dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(slide.framingStatement || slide.content[0] || slide.title) }} />
      </div>
      <div className="relative z-10 mt-5 grid flex-1 grid-cols-4 gap-4 overflow-hidden">
        {cards.map((card, index) => <StoryCard key={index} card={card} compact />)}
      </div>
      <div className="relative z-10 mt-5"><BottomLine slide={slide} dark={color.dark} /></div>
      <SlideFooter deckTitle={deckTitle} slideIndex={slideIndex} totalSlides={totalSlides} />
    </div>
  );
}

export function ExecutiveInfographicSlide(props: ExecutiveInfographicSlideProps) {
  switch (props.slide.layoutArchetype) {
    case 'title-poster':
      return <TitlePoster {...props} />;
    case 'two-column-comparison':
      return <TwoColumnComparison {...props} />;
    case 'metric-dashboard':
      return <MetricDashboard {...props} />;
    case 'five-stage-model':
      return <FiveStageModel {...props} />;
    case 'summary-dashboard':
      return <SummaryDashboard {...props} />;
    case 'formal-landscape':
      return <FormalLandscape {...props} />;
    case 'three-card-story':
    default:
      return props.slide.executiveMode === 'executive-report' ? <FormalLandscape {...props} /> : <ThreeCardStory {...props} />;
  }
}
