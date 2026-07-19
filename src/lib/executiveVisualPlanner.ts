import { ExecutiveStructuredVisual, SlideContent } from '../types';

const VISUAL_TYPES: ExecutiveStructuredVisual['type'][] = [
  'timeline', 'process-flow', 'risk-matrix', 'comparison', 'dependency-map', 'ecosystem-map', 'metric-dashboard', 'hierarchy'
];

function textFor(slide: Pick<SlideContent, 'title' | 'content' | 'cards' | 'bottomLine'>) {
  return [
    slide.title,
    ...(slide.content || []),
    ...(slide.cards || []).flatMap((card) => [card.heading, card.subheading, ...(card.points || []), card.takeaway]),
    slide.bottomLine?.text,
  ].filter(Boolean).join(' ').toLowerCase();
}

function chooseTypes(text: string): ExecutiveStructuredVisual['type'][] {
  if (/roadmap|timeline|milestone|phase|quarter|q[1-4]|launch|sequence|journey/.test(text)) return ['timeline', 'process-flow', 'metric-dashboard'];
  if (/risk|tradeoff|threat|gap|mitigation|severity|likelihood|compliance|control/.test(text)) return ['risk-matrix', 'comparison', 'dependency-map'];
  if (/ecosystem|dependency|stakeholder|partner|vendor|integration|architecture|network/.test(text)) return ['dependency-map', 'ecosystem-map', 'process-flow'];
  if (/kpi|metric|dashboard|revenue|cost|growth|score|percent|%|finding|evidence/.test(text)) return ['metric-dashboard', 'comparison', 'risk-matrix'];
  if (/strategy|principle|operating model|governance|priority|pillar|capability/.test(text)) return ['hierarchy', 'process-flow', 'comparison'];
  return ['process-flow', 'comparison', 'metric-dashboard'];
}

export function planExecutiveVisual(slide: SlideContent): { recommended: ExecutiveStructuredVisual; alternatives: ExecutiveStructuredVisual[] } {
  const text = textFor(slide);
  const [primary, ...alts] = chooseTypes(text);
  const cards = (slide.cards || []).slice(0, 5);
  const nodes = cards.length > 0
    ? cards.map((card, index) => ({ id: `node-${index + 1}`, label: card.heading, description: card.takeaway || card.points?.[0], accent: card.accent }))
    : (slide.content || []).slice(0, 5).map((point, index) => ({ id: `node-${index + 1}`, label: index === 0 ? slide.title : `Point ${index + 1}`, description: point }));
  const visual = (type: ExecutiveStructuredVisual['type'], index = 0): ExecutiveStructuredVisual => ({
    type,
    orientation: type === 'risk-matrix' || type === 'metric-dashboard' ? 'grid' : 'horizontal',
    stylePreset: index === 0 ? 'boardroom-clay' : 'napkin-alternative',
    nodes,
    edges: nodes.slice(1).map((node, edgeIndex) => ({ from: nodes[edgeIndex].id, to: node.id, label: 'enables' })),
    steps: nodes.map((node, stepIndex) => ({ label: node.label, description: node.description, index: stepIndex + 1 })),
    metrics: nodes.slice(0, 4).map((node, metricIndex) => ({ label: node.label, value: `${Math.max(25, 92 - metricIndex * 13)}%`, description: node.description })),
    cards: nodes.map((node) => ({ title: node.label, body: node.description, accent: (node as { accent?: string }).accent })),
  });
  const unique = [primary, ...alts, ...VISUAL_TYPES].filter((type, index, arr) => arr.indexOf(type) === index).slice(0, 3);
  return { recommended: visual(unique[0], 0), alternatives: unique.slice(1, 3).map((type, index) => visual(type, index + 1)) };
}
