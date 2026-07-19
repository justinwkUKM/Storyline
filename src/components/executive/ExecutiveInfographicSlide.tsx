import React from 'react';
import { BarChart3, CheckCircle2, CircleDot, FileText, Layers3, Network, Shield, Sparkles, Target } from 'lucide-react';
import { ExecutiveSlideCard, ExecutiveVisualAsset, PresentationData, SlideContent } from '../../types';
import { getExecutiveAssetUrl } from '../../lib/executiveAssetMap';
import { sanitizeRichTextHtml } from '../../lib/richText';
import { cn } from '../../lib/utils';
import { ExecutiveStructuredVisualRenderer } from './visuals';
import { ExecutiveDesignTokens, getExecutiveAccentColor, selectExecutiveTheme } from '../../lib/executiveTheme';

interface ExecutiveInfographicSlideProps {
  slide: SlideContent;
  deckTitle: PresentationData['title'];
  slideIndex: number;
  totalSlides: number;
  isTitleSlide?: boolean;
  exportMode?: boolean;
  isVertical?: boolean;
}

interface SlideDensity {
  padding: string;
  title: string;
  frameText: string;
  cardPadding: string;
  iconSize: string;
  pointLimit: number;
}

const DENSITY: Record<'roomy' | 'normal' | 'dense', SlideDensity> = {
  roomy: { padding: 'p-12', title: 'text-6xl', frameText: 'text-2xl', cardPadding: 'p-5', iconSize: 'h-20 w-20', pointLimit: 4 },
  normal: { padding: 'p-10', title: 'text-5xl', frameText: 'text-xl', cardPadding: 'p-4', iconSize: 'h-16 w-16', pointLimit: 3 },
  dense: { padding: 'p-8', title: 'text-4xl', frameText: 'text-lg', cardPadding: 'p-3.5', iconSize: 'h-14 w-14', pointLimit: 2 },
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
  if (!key) return undefined;
  return slide.visualAssets?.find((asset) => asset.key === key || asset.id === key);
}

function resolveHeroAsset(slide: SlideContent) {
  return slide.heroVisualAsset || getSlideAsset(slide, slide.visualAssets?.[0]?.key) || slide.visualAssets?.[0];
}

function resolveCardAsset(slide: SlideContent, card: ExecutiveSlideCard) {
  return card.visualAsset || getSlideAsset(slide, card.illustration || card.icon || card.heading);
}

function resolveBottomLineAsset(slide: SlideContent) {
  return slide.bottomLine?.visualAsset || getSlideAsset(slide, slide.bottomLine?.icon);
}

function VisualAnchor({ asset, iconName, accent, className, surface }: { asset?: ExecutiveVisualAsset; iconName?: string; accent: string; className?: string; surface: string }) {
  const src = getVisualAssetUrl(asset);
  const Icon = getIcon(iconName || asset?.key);

  if (src) {
    return (
      <div className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-2xl', className)} style={{ backgroundColor: surface }} data-executive-visual-asset={asset?.key || 'curated'}>
        <img src={src} alt={asset?.alt || `${asset?.key || 'Executive'} visual asset`} className="h-full w-full object-contain p-1" loading="eager" decoding="async" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
      </div>
    );
  }

  return (
    <div className={cn('flex shrink-0 items-center justify-center rounded-2xl', className)} style={{ color: accent, backgroundColor: surface }} data-executive-lucide-fallback="true">
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

function getDensity(slide: SlideContent, title: string, cardCount: number, isVertical?: boolean): SlideDensity {
  const contentScore = title.length + (slide.framingStatement?.length || 0) + getFallbackCards(slide).reduce((sum, card) => sum + card.heading.length + (card.points || []).join('').length, 0) + cardCount * 60 + (isVertical ? 120 : 0);
  if (contentScore > 980) return DENSITY.dense;
  if (contentScore > 620) return DENSITY.normal;
  return DENSITY.roomy;
}

function ExecutiveMotif({ theme }: { theme: ExecutiveDesignTokens }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -bottom-10 -left-10 h-52 w-72 rotate-[-18deg] rounded-[42px] border-[18px]" style={{ borderColor: theme.motif.ring }} />
      <div className="absolute bottom-5 left-0 h-px w-full" style={{ backgroundColor: theme.motif.divider }} />
    </div>
  );
}

function SlideFooter({ deckTitle, slideIndex, totalSlides, theme }: { deckTitle: string; slideIndex: number; totalSlides: number; theme: ExecutiveDesignTokens }) {
  return (
    <div className="relative z-10 mt-5 flex items-center justify-between border-t pt-4 text-xs font-bold uppercase tracking-widest" style={{ borderColor: theme.border, color: theme.mutedText }}>
      <span>{deckTitle}</span>
      <span>{slideIndex + 1} / {totalSlides}</span>
    </div>
  );
}

function FramingCard({ slide, theme, density }: { slide: SlideContent; theme: ExecutiveDesignTokens; density: SlideDensity }) {
  if (!slide.framingStatement) return null;
  return (
    <div className="relative z-10 flex items-center gap-5 rounded-[26px] p-5" style={{ backgroundColor: theme.surface, boxShadow: theme.shadow, color: '#0F172A' }}>
      <VisualAnchor asset={resolveHeroAsset(slide)} iconName={slide.bottomLine?.icon || slide.cards?.[0]?.icon} accent={theme.accent} surface={theme.surfaceAlt} className={density.iconSize} />
      <div className={cn('font-black leading-tight', density.frameText)} dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(slide.framingStatement) }} />
    </div>
  );
}

const StoryCard: React.FC<{ slide: SlideContent; card: ExecutiveSlideCard; theme: ExecutiveDesignTokens; density: SlideDensity; compact?: boolean }> = ({ slide, card, theme, density, compact = false }) => {
  const accent = getExecutiveAccentColor(card.accent, theme);
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-[24px] ring-1" style={{ backgroundColor: theme.surface, boxShadow: theme.shadow, borderColor: theme.border, color: '#0F172A' }}>
      <div className="h-2" style={{ backgroundColor: accent }} />
      <div className={cn('flex flex-1 flex-col overflow-hidden gap-3', density.cardPadding)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: accent }}>{card.number}</div>
            <h3 className={cn('mt-1 font-black leading-tight', compact ? 'text-base' : 'text-xl')}>{card.heading}</h3>
            {card.subheading && <p className="mt-1 text-xs font-bold uppercase tracking-wide" style={{ color: theme.mutedText }}>{card.subheading}</p>}
          </div>
          <VisualAnchor asset={resolveCardAsset(slide, card)} iconName={card.icon || card.illustration || card.heading} accent={accent} surface={theme.surfaceAlt} className={compact ? 'h-12 w-12' : density.iconSize} />
        </div>
        <ul className="space-y-2 text-sm font-semibold leading-snug" style={{ color: theme.mutedText }}>
          {(card.points || []).slice(0, density.pointLimit).map((point, index) => (
            <li key={index} className="flex gap-2">
              <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
              <span dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(point) }} />
            </li>
          ))}
        </ul>
      </div>
      {card.takeaway && <div className="px-5 py-3 text-sm font-black" style={{ backgroundColor: theme.text, color: theme.isLight ? theme.surface : '#0F172A' }}>{card.takeaway}</div>}
    </div>
  );
};

function BottomLine({ slide, theme }: { slide: SlideContent; theme: ExecutiveDesignTokens }) {
  if (!slide.bottomLine?.text) return null;
  return (
    <div className="relative z-10 flex items-center gap-4 rounded-[24px] px-6 py-4 shadow-[0_16px_34px_rgba(15,23,42,0.18)]" style={{ backgroundColor: theme.isLight ? theme.text : '#FFFFFF', color: theme.isLight ? '#FFFFFF' : '#0F172A', boxShadow: theme.shadow }}>
      <VisualAnchor asset={resolveBottomLineAsset(slide)} iconName={slide.bottomLine.icon || 'target'} accent={theme.accent} surface={theme.isLight ? 'rgba(255,255,255,0.14)' : theme.surfaceAlt} className="h-14 w-14" />
      <p className="text-lg font-bold leading-tight">
        {slide.bottomLine.label && <span className="font-black" style={{ color: theme.accent }}>{slide.bottomLine.label}: </span>}
        <span dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(slide.bottomLine.text) }} />
      </p>
    </div>
  );
}

function Header({ slide, title, theme, density, isVertical }: { slide: SlideContent; title: string; theme: ExecutiveDesignTokens; density: SlideDensity; isVertical?: boolean }) {
  return (
    <div className="relative z-10 flex items-start justify-between gap-8">
      <div className="min-w-0">
        {slide.eyebrow && <div className="mb-3 text-xs font-black uppercase tracking-[0.28em]" style={{ color: theme.mutedText }}>{slide.eyebrow}</div>}
        <h2 className={cn('max-w-5xl font-black leading-[0.98]', isVertical ? 'text-4xl' : density.title)}>{title}</h2>
      </div>
      <div className="shrink-0 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em]" style={{ borderColor: theme.border, color: theme.mutedText }}>Executive Infographic</div>
    </div>
  );
}

function BaseSlide({ props, cardLimit, gridClass, visualSpan = 'col-span-3' }: { props: ExecutiveInfographicSlideProps; cardLimit: number; gridClass: string; visualSpan?: string }) {
  const { slide, deckTitle, slideIndex, totalSlides, isTitleSlide, isVertical } = props;
  const theme = selectExecutiveTheme(slide, { isTitleSlide, slideRole: isTitleSlide ? 'title' : slide.layoutArchetype });
  const cards = getFallbackCards(slide).slice(0, cardLimit);
  const title = isTitleSlide ? deckTitle : slide.title;
  const density = getDensity(slide, title, cards.length, isVertical);

  return (
    <div className={cn('relative flex h-full w-full flex-col overflow-hidden', density.padding)} style={{ background: theme.gradient, color: theme.text }}>
      <ExecutiveMotif theme={theme} />
      <Header slide={slide} title={title} theme={theme} density={density} isVertical={isVertical} />
      <div className="relative z-10 mt-6 space-y-5">
        <FramingCard slide={slide} theme={theme} density={density} />
      </div>
      <div className={cn('relative z-10 mt-6 grid flex-1 gap-5 overflow-hidden', gridClass)}>
        {slide.structuredVisual && <ExecutiveStructuredVisualRenderer visual={slide.structuredVisual} theme={theme} className={cn(visualSpan, 'min-h-0')} />}
        {cards.map((card, index) => <StoryCard key={index} slide={slide} card={card} theme={theme} density={density} compact={Boolean(slide.structuredVisual)} />)}
      </div>
      <div className="relative z-10 mt-5"><BottomLine slide={slide} theme={theme} /></div>
      <SlideFooter deckTitle={deckTitle} slideIndex={slideIndex} totalSlides={totalSlides} theme={theme} />
    </div>
  );
}

function FormalLandscape(props: ExecutiveInfographicSlideProps) {
  const { slide } = props;
  const theme = selectExecutiveTheme(slide, { slideRole: 'formal-landscape' });
  const cards = getFallbackCards(slide).slice(0, 6);
  const density = getDensity(slide, slide.title, cards.length, props.isVertical);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden p-12" style={{ background: theme.gradient, color: theme.text }}>
      <ExecutiveMotif theme={theme} />
      <Header slide={slide} title={slide.title} theme={theme} density={density} isVertical={props.isVertical} />
      {slide.framingStatement && <p className="relative z-10 mt-5 max-w-4xl border-l-4 pl-5 text-xl font-bold leading-snug" style={{ borderColor: theme.accent, color: theme.mutedText }}>{slide.framingStatement}</p>}
      <div className="relative z-10 mt-8 grid flex-1 grid-cols-2 gap-5 overflow-hidden">
        {slide.structuredVisual ? <ExecutiveStructuredVisualRenderer visual={slide.structuredVisual} theme={theme} className="col-span-2 min-h-0" /> : cards.map((card, index) => <StoryCard key={index} slide={slide} card={card} theme={theme} density={density} compact />)}
      </div>
      <SlideFooter deckTitle={props.deckTitle} slideIndex={props.slideIndex} totalSlides={props.totalSlides} theme={theme} />
    </div>
  );
}

const TitlePoster = (props: ExecutiveInfographicSlideProps) => <BaseSlide props={props} cardLimit={1} gridClass="grid-cols-1" visualSpan="col-span-1" />;
const ThreeCardStory = (props: ExecutiveInfographicSlideProps) => <BaseSlide props={props} cardLimit={3} gridClass={props.slide.structuredVisual ? 'grid-cols-5' : 'grid-cols-3'} />;
const TwoColumnComparison = (props: ExecutiveInfographicSlideProps) => <BaseSlide props={props} cardLimit={2} gridClass={props.slide.structuredVisual ? 'grid-cols-5' : 'grid-cols-2'} />;
const MetricDashboard = (props: ExecutiveInfographicSlideProps) => <BaseSlide props={props} cardLimit={4} gridClass={props.slide.structuredVisual ? 'grid-cols-6' : 'grid-cols-4'} visualSpan="col-span-3" />;
const FiveStageModel = (props: ExecutiveInfographicSlideProps) => <BaseSlide props={props} cardLimit={5} gridClass={props.slide.structuredVisual ? 'grid-cols-5' : 'grid-cols-5'} />;
const SummaryDashboard = (props: ExecutiveInfographicSlideProps) => <BaseSlide props={props} cardLimit={4} gridClass={props.slide.structuredVisual ? 'grid-cols-6' : 'grid-cols-4'} visualSpan="col-span-2" />;

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
