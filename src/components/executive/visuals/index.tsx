import React from 'react';
import { ExecutiveStructuredVisual } from '../../../types';
import { cn } from '../../../lib/utils';

type VisualNode = NonNullable<ExecutiveStructuredVisual['nodes']>[number];
type VisualCard = NonNullable<ExecutiveStructuredVisual['cards']>[number];
type VisualStep = NonNullable<ExecutiveStructuredVisual['steps']>[number];
type DiagramItem = { id: string; label: string; description?: string; value?: string; accent?: string; meta?: string; status?: string };

const palette = ['#20AEEA', '#00CE68', '#0455C9', '#014F36', '#64748B', '#F59E0B', '#EF4444'];
const statusColors: Record<string, string> = { high: '#EF4444', critical: '#B91C1C', medium: '#F59E0B', moderate: '#F59E0B', low: '#00CE68', active: '#20AEEA', complete: '#00CE68', blocked: '#EF4444', watch: '#64748B' };

const asItems = (visual: ExecutiveStructuredVisual): DiagramItem[] => {
  if (visual.nodes?.length) return visual.nodes.map((node) => ({ ...node, id: node.id }));
  if (visual.steps?.length) return visual.steps.map((step, index) => ({ id: `step-${index}`, label: step.label, description: step.description, meta: step.date, value: step.index ? String(step.index) : undefined }));
  if (visual.cards?.length) return visual.cards.map((card, index) => ({ id: `card-${index}`, label: card.title, description: card.body, value: card.value, accent: card.accent }));
  if (visual.metrics?.length) return visual.metrics.map((metric, index) => ({ id: `metric-${index}`, label: metric.label, description: metric.description, value: metric.value, status: metric.status }));
  return [];
};

const cardItems = (cards?: VisualCard[]): DiagramItem[] => (cards || []).map((card, index) => ({ id: `card-${index}`, label: card.title, description: card.body, value: card.value, accent: card.accent }));
const stepItems = (steps?: VisualStep[]): DiagramItem[] => (steps || []).map((step, index) => ({ id: `step-${index}`, label: step.label, description: step.description, meta: step.date, value: String(step.index ?? index + 1) }));
const nodeItems = (nodes?: VisualNode[]): DiagramItem[] => (nodes || []).map((node) => ({ ...node, id: node.id }));

function Shell({ title, visual, children }: { title: string; visual: ExecutiveStructuredVisual; children: React.ReactNode }) {
  return (
    <div className={cn('relative h-full w-full overflow-hidden rounded-[28px] bg-white/95 p-5 text-slate-950 shadow-[0_18px_45px_rgba(15,23,42,.14)] ring-1 ring-black/5', visual.stylePreset?.includes('dark') && 'bg-slate-950 text-white')}>
      <div className="pointer-events-none absolute inset-0 opacity-[.45] [background-image:linear-gradient(rgba(15,23,42,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.06)_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-200/25 blur-3xl" />
      <div className="relative mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0 text-[10px] font-black uppercase tracking-[.22em] text-slate-400">{title}</div>
        <div className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.16em] text-slate-500">{visual.orientation} · {visual.stylePreset || 'boardroom'}</div>
      </div>
      <div className="relative h-[calc(100%-28px)]">{children}</div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="grid h-full place-items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center"><div><div className="mx-auto mb-3 h-2 w-20 rounded-full bg-slate-300"/><div className="text-sm font-black text-slate-700">{label}</div><div className="mt-1 text-xs font-semibold text-slate-500">Add nodes, steps, metrics, cards, or edges to populate this visual.</div></div></div>;
}

function accent(item: DiagramItem, index: number) { return item.accent || statusColors[(item.status || '').toLowerCase()] || palette[index % palette.length]; }
function truncate(text?: string) { return text || ''; }

export function ExecutiveProcessFlow({ visual }: { visual: ExecutiveStructuredVisual }) {
  const data = (visual.steps?.length ? stepItems(visual.steps) : asItems(visual)).slice(0, 6);
  if (!data.length) return <Shell title="Process flow" visual={visual}><EmptyState label="Process flow ready for steps" /></Shell>;
  const vertical = visual.orientation === 'vertical';
  return <Shell title="Process flow" visual={visual}><div className={cn('flex h-full items-stretch justify-center gap-3', vertical ? 'flex-col' : 'items-center')}>
    {data.map((item, i) => <React.Fragment key={item.id}><div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"><div className="mb-2 flex items-center gap-2"><span className="rounded-full px-2 py-1 text-[10px] font-black text-white" style={{ background: accent(item, i) }}>{item.value || `0${i + 1}`}</span><span className="truncate text-sm font-black">{item.label}</span></div><p className="line-clamp-3 text-xs font-semibold leading-relaxed text-slate-500">{truncate(item.description)}</p></div>{i < data.length - 1 && <div className={cn('grid place-items-center font-black text-slate-300', vertical ? 'h-3 rotate-90 text-xl' : 'w-5 text-2xl')}>→</div>}</React.Fragment>)}
  </div></Shell>;
}

export function ExecutiveTimeline({ visual }: { visual: ExecutiveStructuredVisual }) {
  const data = (visual.steps?.length ? stepItems(visual.steps) : asItems(visual)).slice(0, 6);
  if (!data.length) return <Shell title="Timeline" visual={visual}><EmptyState label="Timeline ready for milestones" /></Shell>;
  return <Shell title="Timeline" visual={visual}><div className="relative flex h-full items-center"><div className="absolute left-4 right-4 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-200" />{data.map((item, i) => <div key={item.id} className="relative flex flex-1 flex-col items-center px-2 text-center"><div className="mb-4 grid h-7 w-7 place-items-center rounded-full text-[10px] font-black text-white ring-4 ring-white" style={{ background: accent(item, i) }}>{i + 1}</div><div className="max-w-[8.5rem] truncate text-sm font-black">{item.label}</div><div className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-400">{item.meta}</div><p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500">{item.description}</p></div>)}</div></Shell>;
}

function RelationshipMap({ visual, title, radial = false }: { visual: ExecutiveStructuredVisual; title: string; radial?: boolean }) {
  const nodes = nodeItems(visual.nodes).slice(0, 8);
  if (!nodes.length) return <Shell title={title} visual={visual}><EmptyState label={`${title} ready for connected nodes`} /></Shell>;
  const positions = nodes.map((node, i) => radial ? { node, x: 50 + Math.cos((Math.PI * 2 * i) / nodes.length) * 34, y: 50 + Math.sin((Math.PI * 2 * i) / nodes.length) * 32 } : { node, x: 14 + (i % 4) * 24, y: 24 + Math.floor(i / 4) * 42 });
  const point = (id: string) => positions.find((p) => p.node.id === id);
  const edges = (visual.edges || []).filter((edge) => point(edge.from) && point(edge.to));
  return <Shell title={title} visual={visual}><div className="relative h-full rounded-3xl bg-slate-50/60 p-2"><svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">{edges.map((edge, i) => { const a = point(edge.from)!; const b = point(edge.to)!; return <g key={`${edge.from}-${edge.to}-${i}`}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={palette[i % palette.length]} strokeWidth=".7" strokeOpacity=".55"/><circle cx={b.x} cy={b.y} r="1.2" fill={palette[i % palette.length]}/>{edge.label && <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 1.5} textAnchor="middle" className="fill-slate-500" fontSize="3">{edge.label.slice(0, 18)}</text>}</g>; })}</svg>{positions.map(({ node, x, y }, i) => <div key={node.id} className="absolute w-32 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white/95 p-3 shadow-sm ring-1 ring-slate-200" style={{ left: `${x}%`, top: `${y}%` }}><div className="mb-1 h-1.5 w-10 rounded-full" style={{ background: accent(node, i) }}/><div className="truncate text-xs font-black">{node.label}</div><p className="line-clamp-2 text-[10px] font-semibold text-slate-500">{node.description}</p></div>)}{!edges.length && <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black text-slate-400 ring-1 ring-slate-200">No edge data yet</div>}</div></Shell>;
}
export function ExecutiveDependencyMap({ visual }: { visual: ExecutiveStructuredVisual }) { return <RelationshipMap visual={visual} title="Dependency map" />; }
export function ExecutiveEcosystemMap({ visual }: { visual: ExecutiveStructuredVisual }) { return <RelationshipMap visual={visual} title="Ecosystem map" radial />; }

export function ExecutiveRiskMatrix({ visual }: { visual: ExecutiveStructuredVisual }) {
  const data = [...cardItems(visual.cards), ...asItems(visual).filter((item) => !item.id.startsWith('card-'))].slice(0, 4);
  const fallback = ['Watch area', 'Reduce exposure', 'Controlled risk', 'Decision required'];
  return <Shell title="Risk matrix" visual={visual}><div className="grid h-full grid-cols-2 grid-rows-2 gap-3">{[0, 1, 2, 3].map((i) => { const item = data[i]; const tone = accent(item || { id: '', label: '', status: i === 3 ? 'high' : 'watch' }, i); return <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-4"><div className="flex items-center justify-between gap-2"><div className="truncate text-[10px] font-black uppercase tracking-wider text-slate-400">{item?.value || item?.status || fallback[i]}</div><span className="h-2.5 w-2.5 rounded-full" style={{ background: tone }}/></div><div className="mt-3 truncate text-sm font-black">{item?.label || 'Unassigned quadrant'}</div><p className="mt-1 line-clamp-3 text-xs font-semibold text-slate-500">{item?.description || 'Define severity, status, and ownership for this risk zone.'}</p></div>; })}</div></Shell>;
}

export function ExecutiveMetricDashboard({ visual }: { visual: ExecutiveStructuredVisual }) { const metrics = visual.metrics?.length ? visual.metrics : asItems(visual).map((n, i) => ({ label: n.label, value: n.value || `${80 - i * 9}%`, description: n.description, status: n.status })); return <Shell title="Metric dashboard" visual={visual}>{metrics.length ? <div className="grid h-full grid-cols-2 gap-3">{metrics.slice(0, 4).map((metric, i) => <div key={i} className="rounded-2xl border border-slate-200 bg-white/90 p-5"><div className="flex items-start justify-between gap-2"><div className="truncate text-3xl font-black" style={{ color: statusColors[(metric.status || '').toLowerCase()] || palette[i % palette.length] }}>{metric.value}</div><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase text-slate-500">{metric.trend || metric.status || 'track'}</span></div><div className="mt-2 truncate text-sm font-black">{metric.label}</div><p className="line-clamp-2 text-xs font-semibold text-slate-500">{metric.description}</p></div>)}</div> : <EmptyState label="Dashboard ready for metrics" />}</Shell>; }

export function ExecutiveHierarchy({ visual }: { visual: ExecutiveStructuredVisual }) { const data = asItems(visual).slice(0, 6); return <Shell title="Hierarchy" visual={visual}>{data.length ? <div className="flex h-full flex-col items-center justify-center gap-3">{data.map((item, i) => <div key={item.id} className="rounded-2xl px-4 py-3 text-center text-sm font-black text-white shadow-sm" style={{ background: accent(item, i), width: `${96 - i * 10}%` }}><div className="truncate">{item.label}</div><div className="truncate text-[10px] font-semibold opacity-80">{item.description}</div></div>)}</div> : <EmptyState label="Hierarchy ready for levels" />}</Shell>; }

export function ExecutiveComparison({ visual }: { visual: ExecutiveStructuredVisual }) { const data = (visual.cards?.length ? cardItems(visual.cards) : asItems(visual)).slice(0, 3); return <Shell title="Comparison" visual={visual}>{data.length ? <div className={cn('grid h-full gap-4', data.length === 1 ? 'grid-cols-1' : data.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>{data.map((item, i) => <div key={item.id} className="rounded-3xl border border-slate-200 bg-white/90 p-5"><div className="mb-3 flex items-center justify-between gap-2"><div className="truncate text-xs font-black uppercase" style={{ color: accent(item, i) }}>{item.value || item.accent || item.label}</div><span className="h-2 w-8 rounded-full" style={{ background: accent(item, i) }}/></div><div className="truncate text-xl font-black">{item.label}</div><p className="mt-2 line-clamp-5 text-sm font-semibold leading-relaxed text-slate-600">{item.description}</p></div>)}</div> : <EmptyState label="Comparison ready for options" />}</Shell>; }

export function ExecutiveStructuredVisualRenderer({ visual, className }: { visual?: ExecutiveStructuredVisual; className?: string }) {
  if (!visual) return null;
  const props = { visual };
  return <div className={className} data-executive-structured-visual={visual.type}>{visual.type === 'timeline' ? <ExecutiveTimeline {...props}/> : visual.type === 'dependency-map' ? <ExecutiveDependencyMap {...props}/> : visual.type === 'risk-matrix' ? <ExecutiveRiskMatrix {...props}/> : visual.type === 'metric-dashboard' ? <ExecutiveMetricDashboard {...props}/> : visual.type === 'hierarchy' ? <ExecutiveHierarchy {...props}/> : visual.type === 'ecosystem-map' ? <ExecutiveEcosystemMap {...props}/> : visual.type === 'comparison' ? <ExecutiveComparison {...props}/> : <ExecutiveProcessFlow {...props}/>}</div>;
}
