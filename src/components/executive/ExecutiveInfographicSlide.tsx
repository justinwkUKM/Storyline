import React from 'react';
import { BarChart3, CheckCircle2, CircleDot, FileText, Layers3, Network, Shield, Sparkles, Target } from 'lucide-react';
import { ExecutiveSlideCard, ExecutiveVisualAsset, PresentationData, SlideContent } from '../../types';
import { EXECUTIVE_ASSET_MAP, getExecutiveAssetUrl } from '../../lib/executiveAssetMap';
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
  if (!key) return undefined;
  return slide.visualAssets?.find((asset) => asset.key === key || asset.id === key);
}

function VisualAnchor({ asset, iconName, accent, className, surface = '#F8FAFC' }: { asset?: ExecutiveVisualAsset; iconName?: string; accent: string; className?: string; surface?: string }) {
  const src = getVisualAssetUrl(asset);
  const Icon = getIcon(iconName || asset?.key);
  if (src) {
    return (
      <div className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-2xl', className || 'h-20 w-20')} style={{ backgroundColor: surface }} data-executive-visual-asset={asset?.key || 'curated'}>
        <img src={src} alt={asset?.alt || `${asset?.key || 'Executive'} visual asset`} className="h-full w-full object-contain p-1" loading="eager" decoding="async" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
      </div>
    );
  }
  return (
    <div className={cn('flex shrink-0 items-center justify-center rounded-2xl', className || 'h-12 w-12')} style={{ color: accent, backgroundColor: surface }} data-executive-lucide-fallback="true">
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

function ExecutiveMotif({ theme }: { theme: ExecutiveDesignTokens }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -bottom-10 -left-10 h-52 w-72 rotate-[-18deg] rounded-[42px] border-[18px]" style={{ borderColor: theme.motif.ring }}
      />
      <div className="absolute bottom-5 left-0 h-px w-full" style={{ backgroundColor: theme.motif.divider }} />
    </div>
  );
}

function FramingCard({ slide, theme }: { slide: SlideContent; theme: ExecutiveDesignTokens }) {
  if (!slide.framingStatement) return null;
  const asset = resolveHeroAsset(slide);
  return (
    <div className="relative z-10 flex items-center gap-5 rounded-[26px] p-5" style={{ backgroundColor: theme.surface, boxShadow: theme.shadow, color: '#0F172A' }}>
      <VisualAnchor asset={slide.heroVisualAsset || slide.visualAssets?.[0]} iconName={slide.bottomLine?.icon || slide.cards?.[0]?.icon} accent={theme.accent} surface={theme.surfaceAlt} className="h-16 w-16" />
      <div className="text-2xl font-black leading-tight" dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(slide.framingStatement) }} />
    </div>
  );
}

const StoryCard: React.FC<{ card: ExecutiveSlideCard; theme: ExecutiveDesignTokens; compact?: boolean }> = ({ card, theme, compact = false }) => {
  const accent = getExecutiveAccentColor(card.accent, theme);
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-[24px] ring-1" style={{ backgroundColor: theme.surface, boxShadow: theme.shadow, borderColor: theme.border, color: '#0F172A' }}>
      <div className="h-2" style={{ backgroundColor: accent }} />
      <div className={cn('flex flex-1 flex-col overflow-hidden', density.cardPadding, compact ? 'gap-1.5' : density.cardInnerGap)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: accent }}>{card.number}</div>
            <h3 className="mt-1 text-xl font-black leading-tight" style={{ color: '#0F172A' }}>{card.heading}</h3>
            {card.subheading && <p className="mt-1 text-xs font-bold uppercase tracking-wide" style={{ color: theme.mutedText }}>{card.subheading}</p>}
          </div>
          <VisualAnchor asset={card.visualAsset} iconName={card.icon || card.illustration || card.heading} accent={accent} surface={theme.surfaceAlt} className={compact ? 'h-14 w-14' : 'h-20 w-20'} />
        </div>
        <ul className="space-y-2 text-sm font-semibold leading-snug" style={{ color: theme.mutedText }}>
          {(card.points || []).slice(0, 4).map((point, index) => (
            <li key={index} className="flex gap-2">
              <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
              <span style={lineClamp(density.pointClamp, 1.4)} dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(point) }} />
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
  const asset = resolveBottomLineAsset(slide);
  return (
    <div className="relative z-10 flex items-center gap-4 rounded-[24px] px-6 py-4 text-white shadow-[0_16px_34px_rgba(15,23,42,0.18)]" style={{ backgroundColor: theme.isLight ? theme.text : '#FFFFFF', color: theme.isLight ? '#FFFFFF' : '#0F172A', boxShadow: theme.shadow }}>
      <VisualAnchor asset={slide.bottomLine.visualAsset} iconName={slide.bottomLine.icon || 'target'} accent={theme.accent} surface={theme.isLight ? 'rgba(255,255,255,0.14)' : theme.surfaceAlt} className="h-14 w-14" />
      <p className="text-lg font-bold leading-tight">
        {slide.bottomLine.label && <span className="font-black" style={{ color: theme.accent }}>{slide.bottomLine.label}: </span>}
        <span dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(slide.bottomLine.text) }} />
      </p>
    </div>
  );
}

function FormalLandscape({ slide, deckTitle, slideIndex, totalSlides }: ExecutiveInfographicSlideProps) {
  const theme = selectExecutiveTheme(slide);
  const cards = getFallbackCards(slide).slice(0, 6);
  const density = computeDensity(slide, slide.title, cards, isVertical);
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden p-12" style={{ background: theme.gradient, color: theme.text }}>
      <ExecutiveMotif theme={theme} />
      <div className="relative z-10">
        {slide.eyebrow && <div className="mb-3 text-xs font-black uppercase tracking-[0.28em]" style={{ color: theme.mutedText }}>{slide.eyebrow}</div>}
        <h2 className="max-w-5xl text-5xl font-black leading-[1.02]">{slide.title}</h2>
        {slide.framingStatement && <p className="mt-5 max-w-4xl border-l-4 pl-5 text-xl font-bold leading-snug" style={{ borderColor: theme.accent, color: theme.mutedText }}>{slide.framingStatement}</p>}
      </div>
      <div className="relative z-10 mt-8 grid flex-1 grid-cols-2 gap-5 overflow-hidden">
        {slide.structuredVisual ? <ExecutiveStructuredVisualRenderer visual={slide.structuredVisual} theme={theme} className="col-span-2 min-h-0" /> : cards.map((card, index) => <StoryCard key={index} card={card} theme={theme} compact />)}
      </div>
      <div className="relative z-10 mt-5 flex items-center justify-between border-t pt-4 text-xs font-bold uppercase tracking-widest" style={{ borderColor: theme.border, color: theme.mutedText }}>
        <span>{deckTitle}</span><span>{slideIndex + 1} / {totalSlides}</span>
      </div>
      <SlideFooter deckTitle={deckTitle} slideIndex={slideIndex} totalSlides={totalSlides} light />
    </div>
  );
}

function ThreeCardStory(props: ExecutiveInfographicSlideProps) {
  const { slide, deckTitle, slideIndex, totalSlides, isTitleSlide, isVertical } = props;
  const explicitReport = slide.executiveMode === 'executive-report' || slide.layoutArchetype === 'formal-landscape';
  if (explicitReport) return <FormalLandscape {...props} />;

  const theme = selectExecutiveTheme(slide, { isTitleSlide, slideRole: isTitleSlide ? 'title' : slide.layoutArchetype });
  const cards = getFallbackCards(slide).slice(0, slide.layoutArchetype === 'five-stage-model' ? 5 : slide.layoutArchetype === 'two-column-comparison' ? 2 : 3);
  const title = isTitleSlide ? deckTitle : slide.title;
  const density = computeDensity(slide, title, cards, isVertical);

function TwoColumnComparison(props: ExecutiveInfographicSlideProps) {
  const { slide, deckTitle, slideIndex, totalSlides, isTitleSlide, isVertical } = props;
  const color = COLOR_MAP[slide.dominantColor || 'deep-blue'] || COLOR_MAP['deep-blue'];
  const cards = getFallbackCards(slide).slice(0, 2);
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden p-10 text-white" style={{ background: theme.gradient, color: theme.text }}>
      <ExecutiveMotif theme={theme} />
      <div className="relative z-10 flex items-start justify-between gap-8">
        <div>
          {slide.eyebrow && <div className="mb-3 text-xs font-black uppercase tracking-[0.28em]" style={{ color: theme.mutedText }}>{slide.eyebrow}</div>}
          <h2 className={cn('max-w-5xl font-black leading-[0.98]', isVertical ? 'text-4xl' : 'text-6xl')}>{title}</h2>
        </div>
        <div className="rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em]" style={{ borderColor: theme.border, color: theme.mutedText }}>Executive Infographic</div>
      </div>
      <div className="relative z-10 mt-5"><BottomLine slide={slide} dark={color.dark} /></div>
      <SlideFooter deckTitle={deckTitle} slideIndex={slideIndex} totalSlides={totalSlides} />
    </div>
  );
}

      <div className="relative z-10 mt-6 space-y-5">
        <FramingCard slide={slide} theme={theme} />
      </div>
      <SlideFooter deckTitle={deckTitle} slideIndex={slideIndex} totalSlides={totalSlides} />
    </div>
  );
}

      <div className={cn('relative z-10 mt-6 grid flex-1 gap-5 overflow-hidden', slide.structuredVisual ? 'grid-cols-5' : cards.length === 2 ? 'grid-cols-2' : cards.length >= 5 ? 'grid-cols-5' : 'grid-cols-3')}>
        {slide.structuredVisual && <ExecutiveStructuredVisualRenderer visual={slide.structuredVisual} theme={theme} className="col-span-3 min-h-0" />}
        {cards.map((card, index) => <StoryCard key={index} card={card} theme={theme} compact={Boolean(slide.structuredVisual)} />)}
      </div>
      <div className="relative z-10 mt-5"><BottomLine slide={slide} dark={color.dark} /></div>
      <SlideFooter deckTitle={deckTitle} slideIndex={slideIndex} totalSlides={totalSlides} />
    </div>
  );
}

      <div className="relative z-10 mt-5">
        <BottomLine slide={slide} theme={theme} />
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
