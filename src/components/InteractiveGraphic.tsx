import React from 'react';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { SlideGraphic } from '../types';
import { cn } from '../lib/utils';

interface InteractiveGraphicProps {
  graphic: SlideGraphic;
  accentClass: string;
  accentStyleObj?: React.CSSProperties;
  isDarkTheme?: boolean;
  isVerticalMode?: boolean;
  exportMode?: boolean;
}

export function InteractiveGraphic({ 
  graphic, 
  accentClass, 
  accentStyleObj, 
  isDarkTheme = false,
  isVerticalMode = false,
  exportMode = false
}: InteractiveGraphicProps) {
  const { type, title, style = '', elements = [] } = graphic;
  const maybeTruncate = exportMode ? 'whitespace-normal break-words' : 'truncate';
  const maybeLineClamp1 = exportMode ? 'whitespace-normal break-words' : 'line-clamp-1';
  const maybeLineClamp2 = exportMode ? 'whitespace-normal break-words' : 'line-clamp-2';
  const maybeTinyText = exportMode ? 'text-xs' : 'text-[9px]';
  const maybeMicroText = exportMode ? 'text-xs' : 'text-[10px]';
  const maybeSmallText = exportMode ? 'text-xs' : 'text-[11px]';
  const maybeStepScroll = exportMode ? 'space-y-3.5' : 'space-y-3 max-h-[260px] overflow-y-auto pr-1';

  // Render a dynamic lucide icon safely
  const renderIcon = (iconName?: string, className = "w-6 h-6") => {
    if (!iconName) return <Icons.Activity className={className} />;
    const IconComponent = (Icons as any)[iconName] || Icons.Activity;
    return <IconComponent className={className} />;
  };

  const isDark = isDarkTheme;

  // 1. PROCESS / TIMELINE LAYOUT CATEGORY (Timeline, Milestones, Chevron-flow, Zigzag, pipeline, workflow etc.)
  if (type === 'process') {
    const isStepByStep = style.includes('step') || style.includes('vertical') || style.includes('zigzag') || isVerticalMode;
    const isSwimlane = style.includes('swimlane') || style.includes('lane');
    const isPipeline = style.includes('pipeline');

    if (isSwimlane) {
      return (
        <div className="flex flex-col h-full justify-center p-3 w-full">
          {title && (
            <h3 className={cn("text-xs font-bold mb-4 uppercase tracking-wider opacity-75", isDark ? "text-slate-400" : "text-gray-500")}>
              {title}
            </h3>
          )}
          <div className="space-y-2.5 w-full">
            {elements.slice(0, 4).map((el, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index, duration: 0.35 }}
                className={cn(
                  "grid grid-cols-[72px_1fr] items-center gap-3 p-2.5 rounded-xl border",
                  isDark ? "bg-slate-900/60 border-slate-800/80 text-white" : "bg-white border-gray-100 text-gray-800"
                )}
              >
                <div className={cn("text-[10px] font-black uppercase tracking-wider", isDark ? "text-slate-400" : "text-gray-500")}>
                  Lane {index + 1}
                </div>
                <div className="space-y-1">
                  <div className="h-2.5 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(35, el.percentage || 60)}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={cn("h-full rounded-full", accentClass)}
                      style={accentStyleObj}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className={cn("font-bold", maybeTruncate)}>{el.label}</span>
                    <span className={cn("opacity-70 shrink-0", isDark ? "text-slate-400" : "text-gray-500")}>{el.value || `${el.percentage || 60}%`}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }

    if (isPipeline) {
      return (
        <div className="flex flex-col h-full justify-center p-3 w-full">
          {title && (
            <h3 className={cn("text-xs font-bold mb-4 uppercase tracking-wider opacity-75", isDark ? "text-slate-400" : "text-gray-500")}>
              {title}
            </h3>
          )}
          <div className="relative flex items-stretch gap-2 w-full">
            <div className="absolute top-1/2 left-3 right-3 h-0.5 bg-gray-200 dark:bg-slate-800 rounded-full -translate-y-1/2" />
            {elements.slice(0, 4).map((el, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.07 * index, duration: 0.35 }}
                className={cn(
                  "relative z-10 flex-1 p-2.5 rounded-xl border shadow-sm min-w-0",
                  isDark ? "bg-slate-900/60 border-slate-800/80 text-white" : "bg-white border-gray-100 text-gray-800"
                )}
              >
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center mb-2", isDark ? "bg-slate-800 text-purple-400" : "bg-lime-50 text-lime-700")}>
                  {el.icon ? renderIcon(el.icon, "w-4 h-4") : index + 1}
                </div>
                <div className={cn("font-black text-xs", maybeTruncate)}>{el.label}</div>
                <p className={cn("mt-0.5 leading-snug", maybeLineClamp2, maybeMicroText, isDark ? "text-slate-400" : "text-gray-500")}>
                  {el.secondaryText}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }

    if (isStepByStep) {
      // High quality vertical sequence template - ideal for vertical orientation
      return (
        <div className="flex flex-col h-full justify-center p-3 w-full">
          {title && (
            <h3 className={cn("text-xs font-bold mb-4 uppercase tracking-wider opacity-75", isDark ? "text-slate-400" : "text-gray-500")}>
              {title}
            </h3>
          )}
          <div className={cn(maybeStepScroll, "w-full")}>
            {elements.map((el, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * index, duration: 0.4 }}
                className={cn(
                  "p-3 rounded-xl border flex items-start gap-3 shadow-sm relative overflow-hidden transition-all hover:scale-[1.01]",
                  isDark 
                    ? "bg-slate-900/60 border-slate-800/80 text-white" 
                    : "bg-white border-gray-100 text-gray-800"
                )}
              >
                {/* Accent strip */}
                <div 
                  className={cn("absolute left-0 top-0 bottom-0 w-1", accentClass)}
                  style={accentStyleObj}
                />
                
                {/* Large Background Number for visual flair */}
                <div className="absolute right-2 bottom-[-10px] text-4xl font-extrabold opacity-5 select-none font-mono">
                  {String(index + 1).padStart(2, '0')}
                </div>

                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold",
                  isDark ? "bg-slate-800 text-purple-400" : "bg-lime-50 text-lime-700"
                )}>
                  {el.icon ? renderIcon(el.icon, "w-4 h-4") : index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className={cn("font-bold text-sm", maybeTruncate)}>{el.label}</h4>
                    {el.value && (
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                        isDark ? "bg-purple-950/40 text-purple-300" : "bg-lime-50 text-lime-800"
                      )}>
                        {el.value}
                      </span>
                    )}
                  </div>
                  {el.secondaryText && (
                    <p className={cn("leading-normal mt-0.5 opacity-80", maybeLineClamp2, maybeSmallText, isDark ? "text-slate-400" : "text-gray-500")}>
                      {el.secondaryText}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }

    // Default Horizontal Process Flow / Timeline
    return (
      <div className="flex flex-col h-full justify-center p-3 w-full">
        {title && (
          <h3 className={cn("text-xs font-bold mb-6 uppercase tracking-wider opacity-75", isDark ? "text-slate-400" : "text-gray-500")}>
            {title}
          </h3>
        )}
        <div className="relative flex flex-row items-stretch justify-between gap-4 w-full">
          {/* Animated Connecting Line */}
          <div className="absolute top-7 left-8 right-8 h-0.5 bg-gray-200 dark:bg-slate-800 overflow-hidden rounded-full z-0">
            <motion.div
              className={cn("h-full", accentClass)}
              style={accentStyleObj}
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />
          </div>

          {elements.map((el, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.4 }}
              className="relative flex-1 flex flex-col items-center text-center z-10 min-w-0"
            >
              {/* Step Circle */}
              <motion.div
                whileHover={{ scale: 1.08 }}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-2 shadow transition-colors mb-2 shrink-0 bg-white",
                  isDark 
                    ? "bg-slate-900 border-slate-800 text-white hover:border-purple-500" 
                    : "bg-white border-gray-100 text-gray-800 hover:border-lime-500"
                )}
              >
                {el.icon ? renderIcon(el.icon, "w-5 h-5 " + (isDark ? "text-purple-400" : "text-lime-500")) : (
                  <span className="font-bold text-sm">{index + 1}</span>
                )}
              </motion.div>

              {el.value && (
                <span className={cn(
                  "text-[9px] font-bold px-1.5 py-0.2 rounded-full mb-1 uppercase tracking-wide shrink-0",
                  isDark ? "bg-purple-950/40 text-purple-300" : "bg-lime-50 text-lime-800"
                )}>
                  {el.value}
                </span>
              )}

              <h4 className={cn("font-bold text-xs truncate w-full", isDark ? "text-white" : "text-gray-900")}>
                {el.label}
              </h4>
              {el.secondaryText && (
                <p className={cn("text-[10px] mt-0.5 leading-snug line-clamp-2 max-w-[120px] opacity-75", isDark ? "text-slate-400" : "text-gray-500")}>
                  {el.secondaryText}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // 2. COMPARISON LAYOUT CATEGORY (Vs-cards, Pro-con, feature-table, side-by-side, bar-chart etc.)
  if (type === 'comparison') {
    const isVsCard = style.includes('vs') || style.includes('pro') || style.includes('side') || elements.length === 2;

    if (isVsCard && elements.length >= 2) {
      // Staggering Split Comparison Panel (Vs Card)
      return (
        <div className="flex flex-col h-full justify-center p-3 w-full">
          {title && (
            <h3 className={cn("text-xs font-bold mb-4 uppercase tracking-wider opacity-75", isDark ? "text-slate-400" : "text-gray-500")}>
              {title}
            </h3>
          )}
          <div className="flex items-stretch gap-4 relative w-full">
            {/* Center VS Badge */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <span className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm border shadow-lg tracking-wider",
                isDark ? "bg-slate-900 border-slate-800 text-purple-400" : "bg-white border-gray-100 text-lime-700"
              )}>
                VS
              </span>
            </div>

            {/* Left comparative card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex-1 p-4 rounded-2xl border text-center relative overflow-hidden flex flex-col justify-between",
                isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-gray-100"
              )}
            >
              <div className="mb-2">
                <span className={cn(
                  "p-2.5 rounded-xl inline-block mb-2",
                  isDark ? "bg-slate-800 text-purple-400" : "bg-lime-50 text-lime-700"
                )}>
                  {renderIcon(elements[0].icon || "Layers", "w-5 h-5")}
                </span>
                <h4 className="font-extrabold text-sm truncate">{elements[0].label}</h4>
              </div>
              <div className="my-2">
                <span className="text-2xl font-extrabold ">
                  {elements[0].percentage !== undefined ? `${elements[0].percentage}%` : (elements[0].value || 'Option A')}
                </span>
              </div>
              <p className="text-[10px] leading-normal opacity-75 line-clamp-2">
                {elements[0].secondaryText || 'Comparative metric indicators'}
              </p>
            </motion.div>

            {/* Right comparative card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex-1 p-4 rounded-2xl border text-center relative overflow-hidden flex flex-col justify-between",
                isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-gray-100"
              )}
            >
              <div className="mb-2">
                <span className={cn(
                  "p-2.5 rounded-xl inline-block mb-2",
                  isDark ? "bg-slate-800 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                )}>
                  {renderIcon(elements[1].icon || "Target", "w-5 h-5")}
                </span>
                <h4 className="font-extrabold text-sm truncate">{elements[1].label}</h4>
              </div>
              <div className="my-2">
                <span className="text-2xl font-extrabold text-emerald-500">
                  {elements[1].percentage !== undefined ? `${elements[1].percentage}%` : (elements[1].value || 'Option B')}
                </span>
              </div>
              <p className="text-[10px] leading-normal opacity-75 line-clamp-2">
                {elements[1].secondaryText || 'Comparative metric indicators'}
              </p>
            </motion.div>
          </div>
        </div>
      );
    }

    // Default Progressive Bar Chart Meters
    return (
      <div className="flex flex-col h-full justify-center p-3 w-full">
        {title && (
          <h3 className={cn("text-xs font-bold mb-4 uppercase tracking-wider opacity-75", isDark ? "text-slate-400" : "text-gray-500")}>
            {title}
          </h3>
        )}
        <div className="space-y-3.5 w-full">
          {elements.map((el, index) => {
            const percentage = el.percentage !== undefined ? el.percentage : 50;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * index, duration: 0.4 }}
                className="space-y-1 w-full"
              >
                <div className="flex justify-between items-end text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {el.icon && renderIcon(el.icon, "w-4 h-4 text-gray-400 shrink-0")}
                    <span className={cn("font-bold truncate", isDark ? "text-white" : "text-gray-900")}>
                      {el.label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 shrink-0 font-mono">
                    {el.value && <span className="opacity-60">{el.value}</span>}
                    <span className={cn("font-extrabold", isDark ? "text-purple-400" : "text-lime-700")}>
                      {percentage}%
                    </span>
                  </div>
                </div>

                {/* Meter track */}
                <div className="h-3 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-black/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: 0.15 + (index * 0.05), duration: 0.6, ease: "easeOut" }}
                    className={cn("h-full rounded-full shadow-inner", accentClass)}
                    style={accentStyleObj}
                  />
                </div>

                {el.secondaryText && (
                  <p className={cn("text-[10px] leading-normal opacity-80", isDark ? "text-slate-400" : "text-gray-500")}>
                    {el.secondaryText}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. METRICS / STATS LAYOUT CATEGORY (Bento-grid, Stat-cards, KPI-Dashboard, Scoreboard, counter-grid etc.)
  if (type === 'metrics') {
    const isKpiDash = style.includes('dashboard') || style.includes('kpi') || style.includes('scoreboard');
    const isTrendSnapshot = style.includes('trend');
    const isCompactGrid = style.includes('compact') || style.includes('tile');
    const isBenchmarkPanel = style.includes('benchmark');

    if (isTrendSnapshot && elements.length > 0) {
      const heroEl = elements[0];
      return (
        <div className="flex flex-col h-full justify-center p-3 w-full">
          {title && (
            <h3 className={cn("text-xs font-bold mb-4 uppercase tracking-wider opacity-75", isDark ? "text-slate-400" : "text-gray-500")}>
              {title}
            </h3>
          )}
          <div className="grid grid-cols-[1.25fr_0.75fr] gap-3 items-stretch">
            <div className={cn("p-4 rounded-2xl border shadow-sm relative overflow-hidden", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100")}>
              <div className="absolute inset-x-3 bottom-3 h-10 flex items-end gap-1 opacity-80">
                {[22, 30, 18, 38, 26, 46].map((bar, idx) => (
                  <div key={idx} className="flex-1 rounded-t-lg bg-lime-500/80" style={{ height: `${bar}px`, opacity: 0.55 + idx * 0.07 }} />
                ))}
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("p-1.5 rounded-lg", isDark ? "bg-slate-800 text-purple-400" : "bg-lime-50 text-lime-700")}>
                    {renderIcon(heroEl.icon || "TrendingUp", "w-4 h-4")}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Trend line</span>
                </div>
                <h4 className="text-3xl font-black leading-none" style={{ color: accentStyleObj?.backgroundColor }}>
                  {heroEl.value || "—"}
                </h4>
                <div className="font-extrabold text-sm mt-1 truncate">{heroEl.label}</div>
                <p className={cn("text-[11px] leading-normal opacity-85 mt-1", isDark ? "text-slate-400" : "text-gray-500")}>
                  {heroEl.secondaryText || 'Directional change across the selected period'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {elements.slice(1, 4).map((el, index) => (
                <div key={index} className={cn("p-2.5 rounded-xl border shadow-sm", isDark ? "bg-slate-950/40 border-slate-850" : "bg-gray-50 border-gray-100")}>
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-60 truncate">{el.label}</div>
                  <div className="flex items-end justify-between gap-2 mt-1">
                    <div className="text-sm font-extrabold truncate">{el.value || "—"}</div>
                    <div className={cn("text-[10px] font-black px-1.5 py-0.5 rounded", isDark ? "bg-slate-800 text-purple-400" : "bg-lime-50 text-lime-800")}>
                      {el.percentage ?? 0}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (isCompactGrid) {
      return (
        <div className="flex flex-col h-full justify-center p-3 w-full">
          {title && (
            <h3 className={cn("text-xs font-bold mb-4 uppercase tracking-wider opacity-75", isDark ? "text-slate-400" : "text-gray-500")}>
              {title}
            </h3>
          )}
          <div className="grid gap-2.5 w-full grid-cols-2">
            {elements.slice(0, 4).map((el, index) => (
              <div key={index} className={cn("p-2.5 rounded-xl border shadow-sm", isDark ? "bg-slate-900/60 border-slate-800/85" : "bg-white border-gray-100")}>
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("text-[10px] font-bold uppercase truncate", isDark ? "text-slate-400" : "text-gray-500")}>{el.label}</span>
                  <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded", isDark ? "bg-slate-800 text-purple-400" : "bg-lime-50 text-lime-800")}>{el.percentage ?? 0}%</span>
                </div>
                <div className={cn("text-lg font-black leading-tight mt-1", isDark ? "text-white" : "text-gray-900")}>{el.value || '—'}</div>
                {el.secondaryText && <p className={cn("text-[10px] mt-0.5 line-clamp-1", isDark ? "text-slate-400" : "text-gray-500")}>{el.secondaryText}</p>}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (isBenchmarkPanel) {
      const heroEl = elements[0];
      const supportEls = elements.slice(1, 4);
      return (
        <div className="flex flex-col h-full justify-center p-3 w-full">
          {title && (
            <h3 className={cn("text-xs font-bold mb-4 uppercase tracking-wider opacity-75", isDark ? "text-slate-400" : "text-gray-500")}>
              {title}
            </h3>
          )}
          <div className={cn("grid gap-3 w-full", isVerticalMode ? "grid-cols-1" : "grid-cols-3")}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "p-4 rounded-2xl border shadow-md flex flex-col justify-between relative overflow-hidden",
                isVerticalMode ? "col-span-1" : "col-span-2",
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"
              )}
            >
              <div className="absolute right-[-20px] top-[-20px] w-16 h-16 rounded-full opacity-10 bg-current" style={{ color: accentStyleObj?.backgroundColor }} />
              <div className="flex items-center gap-2 mb-2">
                <span className={cn("p-1.5 rounded-lg text-xs", isDark ? "bg-slate-800 text-purple-400" : "bg-lime-50 text-lime-700")}>
                  {renderIcon(heroEl.icon || "Target", "w-4 h-4")}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider opacity-70 truncate">{heroEl.label}</span>
              </div>
              <div className="my-2">
                <h4 className="text-3xl font-black leading-none" style={{ color: accentStyleObj?.backgroundColor }}>
                  {heroEl.value || "—"}
                </h4>
                <div className="font-extrabold text-sm mt-1 truncate">{heroEl.secondaryText || 'Benchmark status'}</div>
              </div>
            </motion.div>
            <div className="flex flex-col gap-2.5">
              {supportEls.map((el, index) => (
                <div key={index} className={cn("p-2.5 rounded-xl border flex items-center justify-between shadow-sm", isDark ? "bg-slate-950/40 border-slate-850" : "bg-gray-50 border-gray-100")}>
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="text-[10px] uppercase font-bold tracking-wider opacity-60 truncate">{el.label}</div>
                    <div className="text-sm font-extrabold mt-0.5 truncate">{el.value || "—"}</div>
                  </div>
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", isDark ? "bg-slate-800 text-purple-400" : "bg-lime-50 text-lime-800")}>{el.percentage ?? 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (isKpiDash && elements.length > 0) {
      // KPI Dashboard with single hero metric and smaller supporting stats
      const heroEl = elements[0];
      const supportEls = elements.slice(1, 4);

      return (
        <div className="flex flex-col h-full justify-center p-3 w-full">
          {title && (
            <h3 className={cn("text-xs font-bold mb-4 uppercase tracking-wider opacity-75", isDark ? "text-slate-400" : "text-gray-500")}>
              {title}
            </h3>
          )}
          <div className={cn("grid gap-3 w-full", isVerticalMode ? "grid-cols-1" : "grid-cols-3")}>
            {/* Hero stat card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "p-4 rounded-2xl border shadow-md flex flex-col justify-between relative overflow-hidden",
                isVerticalMode ? "col-span-1" : "col-span-2",
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"
              )}
            >
              {/* Highlight background accent */}
              <div className="absolute right-[-20px] top-[-20px] w-16 h-16 rounded-full opacity-10 bg-current" style={{ color: accentStyleObj?.backgroundColor }} />

              <div className="flex items-center gap-2 mb-2">
                <span className={cn("p-1.5 rounded-lg text-xs", isDark ? "bg-slate-800 text-purple-400" : "bg-lime-50 text-lime-700")}>
                  {renderIcon(heroEl.icon || "TrendingUp", "w-4 h-4")}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider opacity-70">Core Metric Indicator</span>
              </div>
              <div className="my-2">
                <h4 className="text-3xl font-black leading-none" style={{ color: accentStyleObj?.backgroundColor }}>
                  {heroEl.value || "—"}
                </h4>
                <div className="font-extrabold text-sm mt-1 truncate">{heroEl.label}</div>
              </div>
              <p className={cn("text-[11px] leading-normal opacity-85 mt-1", isDark ? "text-slate-400" : "text-gray-500")}>
                {heroEl.secondaryText || 'Leading highlight measurement'}
              </p>
            </motion.div>

            {/* Stack of supporting stats */}
            <div className="flex flex-col gap-2.5">
              {supportEls.map((el, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className={cn(
                    "p-2.5 rounded-xl border flex items-center justify-between shadow-sm",
                    isDark ? "bg-slate-950/40 border-slate-850" : "bg-gray-50 border-gray-100"
                  )}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="text-[10px] uppercase font-bold tracking-wider opacity-60 truncate">{el.label}</div>
                    <div className="text-sm font-extrabold mt-0.5 truncate">{el.value || "—"}</div>
                  </div>
                  {el.percentage !== undefined && (
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded",
                      el.percentage >= 50 
                        ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300" 
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                    )}>
                      {el.percentage}%
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Default Bento Grid Cards
    return (
      <div className="flex flex-col h-full justify-center p-3 w-full">
        {title && (
          <h3 className={cn("text-xs font-bold mb-4 uppercase tracking-wider opacity-75", isDark ? "text-slate-400" : "text-gray-500")}>
            {title}
          </h3>
        )}
        <div className={cn("grid gap-3 w-full", isVerticalMode ? "grid-cols-1" : "grid-cols-2")}>
          {elements.slice(0, 4).map((el, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -2 }}
              transition={{ delay: 0.06 * index, duration: 0.3 }}
              className={cn(
                "p-3 rounded-2xl flex flex-col justify-between border shadow-sm transition-all relative overflow-hidden",
                isDark 
                  ? "bg-slate-900/60 border-slate-800/85 hover:border-purple-500/40" 
                  : "bg-white border-gray-100 hover:border-lime-500/40"
              )}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className={cn(
                  "p-1.5 rounded-lg shrink-0", 
                  isDark ? "bg-slate-800 text-purple-400" : "bg-gray-50 text-lime-700"
                )}>
                  {renderIcon(el.icon || "Activity", "w-4 h-4")}
                </span>
                {el.percentage !== undefined && (
                  <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                    el.percentage >= 50 
                      ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300" 
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                  )}>
                    {el.percentage}%
                  </span>
                )}
              </div>

              <div>
                <div className={cn("text-xl font-black leading-tight", isDark ? "text-white" : "text-gray-900")}>
                  {el.value || "—"}
                </div>
                <div className={cn("text-xs font-bold mt-0.5 truncate", isDark ? "text-slate-300" : "text-gray-800")}>
                  {el.label}
                </div>
                {el.secondaryText && (
                  <p className={cn("text-[10px] leading-normal opacity-80 mt-0.5 line-clamp-1", isDark ? "text-slate-400" : "text-gray-500")}>
                    {el.secondaryText}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // 4. HIERARCHY / STRUCTURE LAYOUT CATEGORY (Pyramid, Org-tree, nested-boxes, layered-stack, architecture-layers etc.)
  if (type === 'hierarchy') {
    const isPyramid = style.includes('pyramid') || style.includes('triangular') || style.includes('funnel');
    const isTree = style.includes('tree') || style.includes('branch') || style.includes('org');
    const isStack = style.includes('stack') || style.includes('layer') || style.includes('architecture');

    if (isTree) {
      return (
        <div className="flex flex-col h-full justify-center p-3 w-full">
          {title && (
            <h3 className={cn("text-xs font-bold mb-4 uppercase tracking-wider opacity-75", isDark ? "text-slate-400" : "text-gray-500")}>
              {title}
            </h3>
          )}
          <div className="space-y-2.5 w-full">
            {elements.slice(0, 4).map((el, index) => (
              <div key={index} className={cn("flex items-center gap-2", index === 0 ? "justify-center" : "")}>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", isDark ? "bg-slate-800 text-purple-400" : "bg-lime-50 text-lime-700")}>
                  {el.icon ? renderIcon(el.icon, "w-4 h-4") : index + 1}
                </div>
                <div className={cn("flex-1 p-2.5 rounded-xl border", isDark ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-gray-100")}>
                  <div className="font-black text-xs truncate">{el.label}</div>
                  {el.secondaryText && <div className={cn("text-[10px] mt-0.5 line-clamp-1", isDark ? "text-slate-400" : "text-gray-500")}>{el.secondaryText}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (isStack) {
      return (
        <div className="flex flex-col h-full justify-center p-3 w-full">
          {title && (
            <h3 className={cn("text-xs font-bold mb-4 uppercase tracking-wider opacity-75", isDark ? "text-slate-400" : "text-gray-500")}>
              {title}
            </h3>
          )}
          <div className="flex flex-col gap-2.5 w-full">
            {elements.slice(0, 4).map((el, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * index, duration: 0.35 }}
                className={cn("p-3 rounded-xl border flex items-center justify-between shadow-sm", isDark ? "bg-slate-900 border-slate-800/80" : "bg-white border-gray-100")}
                style={{ transform: `translateX(${index * 4}px)` }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn("p-1.5 rounded-lg shrink-0", isDark ? "bg-slate-800 text-purple-400" : "bg-gray-50 text-lime-700")}>
                    {renderIcon(el.icon || "Layers", "w-4 h-4")}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs truncate">{el.label}</div>
                    {el.secondaryText && <div className={cn("text-[10px] mt-0.5 truncate", isDark ? "text-slate-400" : "text-gray-500")}>{el.secondaryText}</div>}
                  </div>
                </div>
                {el.value && <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", isDark ? "bg-slate-800 text-purple-400" : "bg-gray-100 text-lime-700")}>{el.value}</span>}
              </motion.div>
            ))}
          </div>
        </div>
      );
    }

    if (isPyramid && elements.length > 0) {
      // Literal Glowing Pyramid Layout Block
      return (
        <div className="flex flex-col h-full justify-center p-3 w-full">
          {title && (
            <h3 className={cn("text-xs font-bold mb-4 uppercase tracking-wider opacity-75", isDark ? "text-slate-400" : "text-gray-500")}>
              {title}
            </h3>
          )}
          <div className="flex flex-col items-center gap-2.5 w-full max-w-[320px] mx-auto">
            {elements.slice(0, 4).map((el, index, arr) => {
              const widthPerc = 100 - (index * 15); // Top is smallest, base is widest
              const scaleOffset = 1;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.08 * index, duration: 0.4 }}
                  style={{ width: `${widthPerc}%`, scale: scaleOffset }}
                  className={cn(
                    "p-2 rounded-xl border flex items-center justify-between shadow-md relative overflow-hidden transition-all hover:scale-[1.02]",
                    isDark 
                      ? "bg-slate-900 border-slate-800 text-white hover:border-purple-500" 
                      : "bg-white border-gray-100 text-gray-800 hover:border-lime-500"
                  )}
                >
                  <div 
                    className={cn("absolute left-0 top-0 bottom-0 w-1", accentClass)}
                    style={accentStyleObj}
                  />

                  <div className="flex items-center gap-2 pl-1.5 min-w-0">
                    <span className="text-[10px] font-black opacity-30 select-none shrink-0">L{arr.length - index}</span>
                    <h4 className="font-extrabold text-xs truncate">{el.label}</h4>
                  </div>

                  {el.value && (
                    <span className={cn(
                      "text-[9px] font-black px-1.5 py-0.5 rounded shrink-0",
                      isDark ? "bg-slate-800 text-purple-400" : "bg-gray-100 text-lime-700"
                    )}>
                      {el.value}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      );
    }

    // Default Layered Stack Cards
    return (
      <div className="flex flex-col h-full justify-center p-3 w-full">
        {title && (
          <h3 className={cn("text-xs font-bold mb-4 uppercase tracking-wider opacity-75", isDark ? "text-slate-400" : "text-gray-500")}>
            {title}
          </h3>
        )}
        <div className="flex flex-col gap-2.5 w-full">
          {elements.slice(0, 4).map((el, index) => {
            const scaleOffset = 1 - (index * 0.04);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index, duration: 0.4 }}
                style={{ scale: scaleOffset }}
                className={cn(
                  "p-3 rounded-xl border flex items-center justify-between shadow-sm transition-all relative overflow-hidden group",
                  isDark 
                    ? "bg-slate-900 border-slate-800/80 text-white hover:border-purple-500" 
                    : "bg-white border-gray-100 text-gray-800 hover:border-lime-500"
                )}
              >
                {/* Visual Level indicator strip */}
                <div 
                  className={cn("absolute left-0 top-0 bottom-0 w-1", accentClass)}
                  style={accentStyleObj}
                />

                <div className="flex items-center gap-3 pl-1.5 min-w-0">
                  <div className={cn("p-1.5 rounded-lg bg-black/5 text-gray-400 group-hover:text-current shrink-0")}>
                    {renderIcon(el.icon || "Layers", "w-4 h-4")}
                  </div>
                  <div className="min-w-0">
                    <h4 className={cn("font-bold text-xs truncate", isDark ? "text-white" : "text-gray-900")}>
                      {el.label}
                    </h4>
                    {el.secondaryText && (
                      <p className={cn("text-[10px] leading-normal opacity-75 truncate max-w-[200px]", isDark ? "text-slate-400" : "text-gray-500")}>
                        {el.secondaryText}
                      </p>
                    )}
                  </div>
                </div>

                {el.value && (
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                    isDark ? "bg-slate-800 text-purple-400" : "bg-gray-100 text-lime-700"
                  )}>
                    {el.value}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // 5. PIE / DONUT LAYOUT CATEGORY (Donut, Semi-circle, Apple-watch radial rings, legend highlights, segment-cards etc.)
  if (type === 'pie') {
    const isRadialRings = style.includes('radial') || style.includes('ring') || style.includes('concentric');
    const isFunnel = style.includes('funnel');
    const isCircularNetwork = style.includes('network') || style.includes('circle');

    if (isFunnel) {
      return (
        <div className="flex flex-col h-full justify-center p-3 w-full">
          {title && (
            <h3 className={cn("text-xs font-bold mb-3 uppercase tracking-wider opacity-75", isDark ? "text-slate-400" : "text-gray-500")}>
              {title}
            </h3>
          )}
          <div className="space-y-2.5 w-full">
            {elements.slice(0, 4).map((el, idx, arr) => {
              const width = 100 - (idx * 18);
              return (
                <div
                  key={idx}
                  className={cn("mx-auto rounded-xl border overflow-hidden", isDark ? "border-slate-800 bg-slate-900/60" : "border-gray-100 bg-white")}
                  style={{ width: `${width}%` }}
                >
                  <div className={cn("h-10 flex items-center justify-between px-3", idx === arr.length - 1 ? "bg-lime-500/80 text-white" : idx === 0 ? "bg-lime-100 text-lime-900" : "bg-lime-200/70 text-lime-900")}>
                    <span className="font-bold text-xs truncate">{el.label}</span>
                    <span className="text-[10px] font-black">{el.percentage !== undefined ? `${el.percentage}%` : el.value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (isCircularNetwork) {
      return (
        <div className="flex flex-col h-full justify-center p-3 w-full">
          {title && (
            <h3 className={cn("text-xs font-bold mb-3 uppercase tracking-wider opacity-75", isDark ? "text-slate-400" : "text-gray-500")}>
              {title}
            </h3>
          )}
          <div className="flex items-center gap-4 w-full">
            <div className="relative w-32 h-32 shrink-0">
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-gray-200 dark:border-slate-800" />
              <div className="absolute inset-3 rounded-full border-4 border-lime-300" />
              <div className="absolute inset-6 rounded-full border-4 border-lime-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-black text-xs", isDark ? "bg-slate-900 text-purple-400" : "bg-white text-lime-800")}>
                  Core
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {elements.slice(0, 3).map((el, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-lime-500" />
                  <span className="font-extrabold truncate flex-1">{el.label}</span>
                  <span className="opacity-70 font-mono font-bold shrink-0">{el.percentage !== undefined ? `${el.percentage}%` : (el.value || '')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (isRadialRings) {
      // Concentric progress rings layout (inspired by Apple Watch fitness loops)
      return (
        <div className="flex flex-col h-full justify-center p-3 w-full">
          {title && (
            <h3 className={cn("text-xs font-bold mb-3 uppercase tracking-wider opacity-75", isDark ? "text-slate-400" : "text-gray-500")}>
              {title}
            </h3>
          )}
          <div className={cn("flex items-center gap-5 w-full", isVerticalMode ? "flex-col" : "flex-row")}>
            <div className="relative w-32 h-32 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {elements.slice(0, 3).map((el, idx) => {
                  const percentage = el.percentage !== undefined ? el.percentage : 60;
                  const radius = 40 - (idx * 11);
                  const circumference = 2 * Math.PI * radius;
                  const strokeDashOffset = circumference - (percentage / 100) * circumference;

                  const colors = [
                    accentStyleObj?.backgroundColor || '#8b5cf6',
                    '#10b981', '#3b82f6'
                  ];
                  const sliceColor = colors[idx % colors.length];

                  return (
                    <React.Fragment key={idx}>
                      {/* Base ring track */}
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        className="stroke-gray-100 dark:stroke-slate-800/80"
                        strokeWidth="8"
                      />
                      {/* Active ring loop */}
                      <motion.circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke={sliceColor}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: strokeDashOffset }}
                        transition={{ delay: 0.1 * idx, duration: 1.0, ease: "easeOut" }}
                        strokeLinecap="round"
                      />
                    </React.Fragment>
                  );
                })}
              </svg>
            </div>

            <div className="flex-1 space-y-2 w-full min-w-0">
              {elements.slice(0, 3).map((el, idx) => {
                const colors = [
                  accentStyleObj?.backgroundColor || '#8b5cf6',
                  '#10b981', '#3b82f6'
                ];
                return (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
                    <span className="font-extrabold truncate flex-1">{el.label}</span>
                    <span className="opacity-70 font-mono font-bold shrink-0">{el.percentage !== undefined ? `${el.percentage}%` : (el.value || '')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // Default Semi-Concentric Donut SVG Chart
    return (
      <div className="flex flex-col h-full justify-center p-3 w-full">
        {title && (
          <h3 className={cn("text-xs font-bold mb-3 uppercase tracking-wider opacity-75", isDark ? "text-slate-400" : "text-gray-500")}>
            {title}
          </h3>
        )}
        <div className={cn("flex items-center gap-5 w-full", isVerticalMode ? "flex-col" : "flex-row")}>
          {/* Pie Donut SVG */}
          <div className="relative w-32 h-32 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                className="stroke-gray-100 dark:stroke-slate-800/80"
                strokeWidth="10"
              />
              {elements.slice(0, 4).map((el, idx) => {
                const percentage = el.percentage !== undefined ? el.percentage : 25;
                let offset = 0;
                for (let i = 0; i < idx; i++) {
                  offset += elements[i].percentage !== undefined ? (elements[i].percentage || 0) : 25;
                }
                const strokeDash = `${percentage} ${100 - percentage}`;
                const strokeDashOffset = 100 - offset;
                
                // Color mapping
                const colors = [
                  accentStyleObj?.backgroundColor || '#8b5cf6',
                  '#10b981', '#f59e0b', '#3b82f6'
                ];
                const sliceColor = colors[idx % colors.length];

                return (
                  <motion.circle
                    key={idx}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={sliceColor}
                    strokeWidth="10"
                    strokeDasharray="0 100"
                    animate={{ strokeDasharray: strokeDash }}
                    transition={{ delay: 0.15 + (idx * 0.05), duration: 0.7, ease: "easeOut" }}
                    strokeDashoffset={strokeDashOffset}
                    strokeLinecap="round"
                    className="cursor-pointer transition-all hover:stroke-[11]"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={cn("text-[9px] font-bold uppercase tracking-wider opacity-50", isDark ? "text-slate-400" : "text-gray-500")}>
                Metrics
              </span>
              <span className={cn("text-lg font-black leading-none", isDark ? "text-white" : "text-gray-900")}>
                100%
              </span>
            </div>
          </div>

          {/* Details Legend */}
          <div className="flex-1 space-y-2 w-full min-w-0">
            {elements.slice(0, 4).map((el, idx) => {
              const colors = [
                accentStyleObj?.backgroundColor || '#8b5cf6',
                '#10b981', '#f59e0b', '#3b82f6'
              ];
              const sliceColor = colors[idx % colors.length];
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * idx }}
                  className="flex items-start gap-2 text-xs min-w-0"
                >
                  <span 
                    className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" 
                    style={{ backgroundColor: sliceColor }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className={cn("font-bold truncate", isDark ? "text-white" : "text-gray-900")}>
                        {el.label}
                      </span>
                      {el.percentage !== undefined && (
                        <span className="text-[10px] font-mono font-bold shrink-0 opacity-60">
                          ({el.percentage}%)
                        </span>
                      )}
                    </div>
                    {el.value && (
                      <div className="text-[10px] font-bold opacity-75 truncate">{el.value}</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
