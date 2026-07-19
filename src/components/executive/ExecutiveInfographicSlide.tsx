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

type DensityLevel = 'comfortable' | 'balanced' | 'dense' | 'max';

type DensityProfile = {
  density: DensityLevel;
  outerPadding: string;
  titleSize: string;
  verticalTitleSize: string;
  titleClamp: number;
  framingTextSize: string;
  framingClamp: number;
  framingPadding: string;
  cardGap: string;
  cardPadding: string;
  cardInnerGap: string;
  cardHeadingSize: string;
  headingClamp: number;
  subheadingClamp: number;
  pointClamp: number;
  pointsPerCard: number;
  takeawayClamp: number;
  iconSize: string;
  framingIconSize: string;
  bottomIconSize: string;
  bottomTextSize: string;
  bottomClamp: number;
  bottomPadding: string;
};

const DENSITY_PROFILES: Record<DensityLevel, DensityProfile> = {
  comfortable: {
    density: 'comfortable', outerPadding: 'p-10', titleSize: 'text-6xl', verticalTitleSize: 'text-4xl', titleClamp: 2, framingTextSize: 'text-2xl', framingClamp: 3, framingPadding: 'p-5', cardGap: 'gap-5', cardPadding: 'p-5', cardInnerGap: 'gap-3', cardHeadingSize: 'text-xl', headingClamp: 2, subheadingClamp: 2, pointClamp: 2, pointsPerCard: 4, takeawayClamp: 2, iconSize: 'h-20 w-20', framingIconSize: 'h-16 w-16', bottomIconSize: 'h-14 w-14', bottomTextSize: 'text-lg', bottomClamp: 2, bottomPadding: 'px-6 py-4',
  },
  balanced: {
    density: 'balanced', outerPadding: 'p-8', titleSize: 'text-5xl', verticalTitleSize: 'text-[2.45rem]', titleClamp: 2, framingTextSize: 'text-xl', framingClamp: 3, framingPadding: 'p-4', cardGap: 'gap-4', cardPadding: 'p-4', cardInnerGap: 'gap-2.5', cardHeadingSize: 'text-lg', headingClamp: 2, subheadingClamp: 1, pointClamp: 2, pointsPerCard: 3, takeawayClamp: 2, iconSize: 'h-16 w-16', framingIconSize: 'h-14 w-14', bottomIconSize: 'h-12 w-12', bottomTextSize: 'text-base', bottomClamp: 2, bottomPadding: 'px-5 py-3.5',
  },
  dense: {
    density: 'dense', outerPadding: 'p-7', titleSize: 'text-4xl', verticalTitleSize: 'text-4xl', titleClamp: 2, framingTextSize: 'text-lg', framingClamp: 2, framingPadding: 'p-3.5', cardGap: 'gap-3', cardPadding: 'p-3.5', cardInnerGap: 'gap-2', cardHeadingSize: 'text-base', headingClamp: 2, subheadingClamp: 1, pointClamp: 1, pointsPerCard: 2, takeawayClamp: 1, iconSize: 'h-14 w-14', framingIconSize: 'h-12 w-12', bottomIconSize: 'h-10 w-10', bottomTextSize: 'text-sm', bottomClamp: 2, bottomPadding: 'px-4 py-3',
  },
  max: {
    density: 'max', outerPadding: 'p-6', titleSize: 'text-[2.35rem]', verticalTitleSize: 'text-[2rem]', titleClamp: 2, framingTextSize: 'text-base', framingClamp: 2, framingPadding: 'p-3', cardGap: 'gap-2.5', cardPadding: 'p-3', cardInnerGap: 'gap-1.5', cardHeadingSize: 'text-[0.95rem]', headingClamp: 1, subheadingClamp: 1, pointClamp: 1, pointsPerCard: 2, takeawayClamp: 1, iconSize: 'h-11 w-11', framingIconSize: 'h-10 w-10', bottomIconSize: 'h-9 w-9', bottomTextSize: 'text-xs', bottomClamp: 2, bottomPadding: 'px-3.5 py-2.5',
  },
};

function plainLength(value?: string) {
  return (value || '').replace(/<[^>]*>/g, '').trim().length;
}

function computeDensity(slide: SlideContent, title: string, cards: ExecutiveSlideCard[], isVertical?: boolean): DensityProfile {
  const titleScore = plainLength(title) / 34;
  const framingScore = plainLength(slide.framingStatement) / 70;
  const cardScore = Math.max(0, cards.length - (isVertical ? 2 : 3)) * 1.1;
  const pointCount = cards.reduce((sum, card) => sum + (card.points?.length || 0), 0);
  const pointScore = pointCount / (isVertical ? 4 : 6);
  const copyScore = cards.reduce((sum, card) => sum + plainLength(card.heading) / 42 + plainLength(card.subheading) / 56 + plainLength(card.takeaway) / 70, 0);
  const score = titleScore + framingScore + cardScore + pointScore + copyScore + (isVertical ? 1.25 : 0) + (slide.structuredVisual ? 1 : 0);
  if (score >= 10) return DENSITY_PROFILES.max;
  if (score >= 7) return DENSITY_PROFILES.dense;
  if (score >= 4.5) return DENSITY_PROFILES.balanced;
  return DENSITY_PROFILES.comfortable;
}

function lineClamp(lines: number, lineHeightEm = 1.25): React.CSSProperties {
  return {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: lines,
    maxHeight: `${lines * lineHeightEm}em`,
    overflow: 'hidden',
  };
}

function FramingCard({ slide, accent, density }: { slide: SlideContent; accent: string; density: DensityProfile }) {
  if (!slide.framingStatement) return null;
  return (
    <div className={cn('relative z-10 flex max-h-32 items-center gap-4 overflow-hidden rounded-[26px] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]', density.framingPadding)}>
      <VisualAnchor asset={slide.heroVisualAsset || slide.visualAssets?.[0]} iconName={slide.bottomLine?.icon || slide.cards?.[0]?.icon} accent={accent} className={density.framingIconSize} />
      <div className={cn('font-black leading-tight text-slate-950', density.framingTextSize)} style={lineClamp(density.framingClamp)} dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(slide.framingStatement) }} />
    </div>
  );
}

const StoryCard: React.FC<{ card: ExecutiveSlideCard; compact?: boolean; density: DensityProfile }> = ({ card, compact = false, density }) => {
  const accent = ACCENT_MAP[card.accent || 'green'] || ACCENT_MAP.green;
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_18px_38px_rgba(15,23,42,0.14)] ring-1 ring-black/5">
      <div className="h-2" style={{ backgroundColor: accent }} />
      <div className={cn('flex flex-1 flex-col overflow-hidden', density.cardPadding, compact ? 'gap-1.5' : density.cardInnerGap)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: accent }}>{card.number}</div>
            <h3 className={cn('mt-1 font-black leading-tight text-slate-950', density.cardHeadingSize)} style={lineClamp(density.headingClamp)}>{card.heading}</h3>
            {card.subheading && <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500" style={lineClamp(density.subheadingClamp, 1.1)}>{card.subheading}</p>}
          </div>
          <VisualAnchor asset={card.visualAsset} iconName={card.icon || card.illustration || card.heading} accent={accent} className={compact ? density.framingIconSize : density.iconSize} />
        </div>
        <ul className="min-h-0 space-y-1.5 overflow-hidden text-sm font-semibold leading-snug text-slate-700">
          {(card.points || []).slice(0, density.pointsPerCard).map((point, index) => (
            <li key={index} className="flex gap-2">
              <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
              <span style={lineClamp(density.pointClamp, 1.4)} dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(point) }} />
            </li>
          ))}
        </ul>
      </div>
      {card.takeaway && <div className="max-h-14 overflow-hidden bg-slate-950 px-4 py-2.5 text-sm font-black text-white" style={lineClamp(density.takeawayClamp, 1.35)}>{card.takeaway}</div>}
    </div>
  );
};

function BottomLine({ slide, dark, density }: { slide: SlideContent; dark: string; density: DensityProfile }) {
  if (!slide.bottomLine?.text) return null;
  return (
    <div className={cn('relative z-10 flex max-h-24 items-center gap-3 overflow-hidden rounded-[24px] text-white shadow-[0_16px_34px_rgba(15,23,42,0.18)]', density.bottomPadding)} style={{ backgroundColor: dark }}>
      <VisualAnchor asset={slide.bottomLine.visualAsset} iconName={slide.bottomLine.icon || 'target'} accent="#ffffff" className={cn(density.bottomIconSize, 'bg-white/14')} />
      <p className={cn('font-bold leading-tight', density.bottomTextSize)} style={lineClamp(density.bottomClamp)}>
        {slide.bottomLine.label && <span className="font-black text-emerald-300">{slide.bottomLine.label}: </span>}
        <span dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(slide.bottomLine.text) }} />
      </p>
    </div>
  );
}

function FormalLandscape({ slide, deckTitle, slideIndex, totalSlides, isVertical }: ExecutiveInfographicSlideProps) {
  const cards = getFallbackCards(slide).slice(0, 6);
  const density = computeDensity(slide, slide.title, cards, isVertical);
  return (
    <div className={cn('relative flex h-full w-full flex-col overflow-hidden bg-white text-slate-950', isVertical ? density.outerPadding : 'p-12')}>
      <ExecutiveMotif light />
      <div className="relative z-10">
        {slide.eyebrow && <div className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-emerald-600">{slide.eyebrow}</div>}
        <h2 className={cn('max-w-5xl font-black leading-[1.02]', isVertical ? density.verticalTitleSize : density.titleSize)} style={lineClamp(density.titleClamp, 1.05)}>{slide.title}</h2>
        {slide.framingStatement && <p className={cn('mt-5 max-h-28 max-w-4xl overflow-hidden border-l-4 border-emerald-400 pl-5 font-bold leading-snug text-slate-700', density.framingTextSize)} style={lineClamp(density.framingClamp)}>{slide.framingStatement}</p>}
      </div>
      <div className={cn('relative z-10 mt-6 grid flex-1 overflow-hidden', isVertical ? 'grid-cols-1' : 'grid-cols-2', density.cardGap)}>
        {slide.structuredVisual ? <ExecutiveStructuredVisualRenderer visual={slide.structuredVisual} className={cn('min-h-0', isVertical ? 'col-span-1' : 'col-span-2')} /> : cards.map((card, index) => <StoryCard key={index} card={card} compact density={density} />)}
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
  const density = computeDensity(slide, title, cards, isVertical);

function TwoColumnComparison(props: ExecutiveInfographicSlideProps) {
  const { slide, deckTitle, slideIndex, totalSlides, isTitleSlide, isVertical } = props;
  const color = COLOR_MAP[slide.dominantColor || 'deep-blue'] || COLOR_MAP['deep-blue'];
  const cards = getFallbackCards(slide).slice(0, 2);
  return (
    <div className={cn('relative flex h-full w-full flex-col overflow-hidden text-white', density.outerPadding)} style={{ backgroundColor: color.bg }}>
      <ExecutiveMotif light={false} />
      <div className={cn('relative z-10 flex items-start justify-between gap-6', isVertical && 'flex-col')}>
        <div>
          {slide.eyebrow && <div className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-white/70">{slide.eyebrow}</div>}
          <h2 className={cn('max-w-5xl font-black leading-[0.98]', isVertical ? density.verticalTitleSize : density.titleSize)} style={lineClamp(density.titleClamp, 1.05)}>{title}</h2>
        </div>
        <div className="rounded-full border border-white/25 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/75">Executive Infographic</div>
      </div>
      <div className="relative z-10 mt-5"><BottomLine slide={slide} dark={color.dark} /></div>
      <SlideFooter deckTitle={deckTitle} slideIndex={slideIndex} totalSlides={totalSlides} />
    </div>
  );
}

      <div className="relative z-10 mt-6 space-y-5">
        <FramingCard slide={slide} accent={color.accent} density={density} />
      </div>
      <SlideFooter deckTitle={deckTitle} slideIndex={slideIndex} totalSlides={totalSlides} />
    </div>
  );
}

      <div className={cn('relative z-10 mt-6 grid flex-1 overflow-hidden', density.cardGap, isVertical ? (slide.structuredVisual ? 'grid-cols-1' : 'grid-cols-1') : slide.structuredVisual ? 'grid-cols-5' : cards.length === 2 ? 'grid-cols-2' : cards.length >= 5 ? 'grid-cols-5' : 'grid-cols-3')}>
        {slide.structuredVisual && <ExecutiveStructuredVisualRenderer visual={slide.structuredVisual} className={cn('min-h-0', isVertical ? 'max-h-[38%]' : 'col-span-3')} />}
        {cards.map((card, index) => <StoryCard key={index} card={card} compact={Boolean(slide.structuredVisual)} density={density} />)}
      </div>
      <div className="relative z-10 mt-5"><BottomLine slide={slide} dark={color.dark} /></div>
      <SlideFooter deckTitle={deckTitle} slideIndex={slideIndex} totalSlides={totalSlides} />
    </div>
  );
}

      <div className="relative z-10 mt-5">
        <BottomLine slide={slide} dark={color.dark} density={density} />
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
