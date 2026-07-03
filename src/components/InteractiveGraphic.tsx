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
}

export function InteractiveGraphic({ graphic, accentClass, accentStyleObj, isDarkTheme = false }: InteractiveGraphicProps) {
  const { type, title, elements = [] } = graphic;

  // Render a dynamic lucide icon safely
  const renderIcon = (iconName?: string, className = "w-6 h-6") => {
    if (!iconName) return <Icons.Activity className={className} />;
    const IconComponent = (Icons as any)[iconName] || Icons.Activity;
    return <IconComponent className={className} />;
  };

  // 1. Process / Timeline Layout
  if (type === 'process') {
    return (
      <div className="flex flex-col h-full justify-center p-4">
        {title && (
          <h3 className={cn("text-lg font-semibold mb-6 uppercase tracking-wider opacity-80", isDarkTheme ? "text-slate-300" : "text-gray-600")}>
            {title}
          </h3>
        )}
        <div className="relative flex flex-col md:flex-row items-stretch justify-between gap-6 md:gap-4">
          {/* Animated Connecting Line */}
          <div className="absolute top-1/2 left-4 right-4 h-1 bg-gray-200 dark:bg-slate-800 -translate-y-1/2 hidden md:block overflow-hidden rounded-full">
            <motion.div
              className={cn("h-full", accentClass)}
              style={accentStyleObj}
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </div>

          {elements.map((el, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              className="relative flex-1 flex flex-col items-center text-center z-10"
            >
              {/* Step Circle */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center border-4 shadow-lg transition-colors mb-3",
                  isDarkTheme 
                    ? "bg-slate-900 border-slate-800 text-white hover:border-purple-500" 
                    : "bg-white border-gray-100 text-gray-800 hover:border-blue-500"
                )}
              >
                {el.icon ? renderIcon(el.icon, "w-6 h-6 " + (isDarkTheme ? "text-purple-400" : "text-blue-500")) : (
                  <span className="font-bold text-lg">{index + 1}</span>
                )}
              </motion.div>

              {/* Tag/Badge for stage / step indicator */}
              {el.value && (
                <span className={cn(
                  "text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 uppercase tracking-wide",
                  isDarkTheme ? "bg-purple-950/40 text-purple-300" : "bg-blue-50 text-blue-700"
                )}>
                  {el.value}
                </span>
              )}

              <h4 className={cn("font-bold text-base", isDarkTheme ? "text-white" : "text-gray-900")}>
                {el.label}
              </h4>
              {el.secondaryText && (
                <p className={cn("text-xs mt-1 max-w-[150px] leading-relaxed", isDarkTheme ? "text-slate-400" : "text-gray-500")}>
                  {el.secondaryText}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Comparison Layout (Bar meters)
  if (type === 'comparison') {
    return (
      <div className="flex flex-col h-full justify-center p-4">
        {title && (
          <h3 className={cn("text-lg font-semibold mb-6 uppercase tracking-wider opacity-80", isDarkTheme ? "text-slate-300" : "text-gray-600")}>
            {title}
          </h3>
        )}
        <div className="space-y-6">
          {elements.map((el, index) => {
            const percentage = el.percentage !== undefined ? el.percentage : 50;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                className="space-y-2"
              >
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    {el.icon && renderIcon(el.icon, "w-5 h-5 text-gray-400")}
                    <span className={cn("font-bold text-base", isDarkTheme ? "text-white" : "text-gray-900")}>
                      {el.label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    {el.value && (
                      <span className={cn("text-sm font-semibold opacity-75", isDarkTheme ? "text-slate-300" : "text-gray-500")}>
                        {el.value}
                      </span>
                    )}
                    <span className={cn("text-lg font-extrabold", isDarkTheme ? "text-purple-400" : "text-blue-600")}>
                      {percentage}%
                    </span>
                  </div>
                </div>

                {/* Meter container */}
                <div className="h-4 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-black/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: 0.2 + (index * 0.1), duration: 0.8, ease: "easeOut" }}
                    className={cn("h-full rounded-full shadow-inner", accentClass)}
                    style={accentStyleObj}
                  />
                </div>

                {el.secondaryText && (
                  <p className={cn("text-xs leading-normal", isDarkTheme ? "text-slate-400" : "text-gray-500")}>
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

  // 3. Bento Metrics Layout
  if (type === 'metrics') {
    return (
      <div className="flex flex-col h-full justify-center p-4">
        {title && (
          <h3 className={cn("text-lg font-semibold mb-6 uppercase tracking-wider opacity-80", isDarkTheme ? "text-slate-300" : "text-gray-600")}>
            {title}
          </h3>
        )}
        <div className="grid grid-cols-2 gap-4">
          {elements.map((el, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ delay: 0.08 * index, duration: 0.4 }}
              className={cn(
                "p-5 rounded-2xl flex flex-col justify-between border shadow-sm transition-all",
                isDarkTheme 
                  ? "bg-slate-900/60 border-slate-800 text-white hover:border-purple-500/50" 
                  : "bg-white border-gray-100 text-gray-800 hover:border-blue-500/50"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <span className={cn(
                  "p-2.5 rounded-xl", 
                  isDarkTheme ? "bg-slate-800 text-purple-400" : "bg-gray-50 text-blue-600"
                )}>
                  {renderIcon(el.icon || "TrendingUp", "w-5 h-5")}
                </span>
                {el.percentage !== undefined && (
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                    el.percentage >= 50 
                      ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300" 
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                  )}>
                    {el.percentage}%
                  </span>
                )}
              </div>

              <div>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + (index * 0.05) }}
                  className={cn("text-3xl font-extrabold tracking-tight mb-1", isDarkTheme ? "text-white" : "text-gray-900")}
                >
                  {el.value || "—"}
                </motion.div>
                <div className={cn("text-sm font-bold truncate", isDarkTheme ? "text-slate-200" : "text-gray-800")}>
                  {el.label}
                </div>
                {el.secondaryText && (
                  <p className={cn("text-xs mt-1 leading-normal line-clamp-2", isDarkTheme ? "text-slate-400" : "text-gray-500")}>
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

  // 4. Hierarchy / Layers Layout
  if (type === 'hierarchy') {
    return (
      <div className="flex flex-col h-full justify-center p-4">
        {title && (
          <h3 className={cn("text-lg font-semibold mb-6 uppercase tracking-wider opacity-80", isDarkTheme ? "text-slate-300" : "text-gray-600")}>
            {title}
          </h3>
        )}
        <div className="flex flex-col gap-4">
          {elements.map((el, index) => {
            const scaleOffset = 1 - (index * 0.06);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, rotateX: 15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                style={{ scale: scaleOffset }}
                className={cn(
                  "p-4 rounded-xl border flex items-center justify-between shadow-md transition-all relative overflow-hidden group",
                  isDarkTheme 
                    ? "bg-slate-900 border-slate-800/80 text-white hover:border-purple-500" 
                    : "bg-white border-gray-100 text-gray-800 hover:border-blue-500"
                )}
              >
                {/* Visual Level indicator strip */}
                <div 
                  className={cn("absolute left-0 top-0 bottom-0 w-1.5", accentClass)}
                  style={accentStyleObj}
                />

                <div className="flex items-center gap-4 pl-2">
                  <div className={cn("p-2 rounded-lg bg-black/5 text-gray-500 group-hover:text-current transition-colors")}>
                    {renderIcon(el.icon || "Layers", "w-5 h-5")}
                  </div>
                  <div>
                    <h4 className={cn("font-bold text-base", isDarkTheme ? "text-white" : "text-gray-900")}>
                      {el.label}
                    </h4>
                    {el.secondaryText && (
                      <p className={cn("text-xs leading-normal mt-0.5", isDarkTheme ? "text-slate-400" : "text-gray-500")}>
                        {el.secondaryText}
                      </p>
                    )}
                  </div>
                </div>

                {el.value && (
                  <span className={cn(
                    "text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                    isDarkTheme ? "bg-slate-800 text-purple-400" : "bg-gray-100 text-blue-600"
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

  // 5. Dynamic Pie/Donut Visualizer
  if (type === 'pie') {
    // Generate simple concentric or radial pie-slices layout with animated SVGs
    return (
      <div className="flex flex-col h-full justify-center p-4">
        {title && (
          <h3 className={cn("text-lg font-semibold mb-6 uppercase tracking-wider opacity-80", isDarkTheme ? "text-slate-300" : "text-gray-600")}>
            {title}
          </h3>
        )}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Pie Donut SVG */}
          <div className="relative w-44 h-44 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                className="stroke-gray-100 dark:stroke-slate-800"
                strokeWidth="12"
              />
              {elements.map((el, idx) => {
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
                  '#10b981', '#f59e0b', '#3b82f6', '#ec4899'
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
                    strokeWidth="12"
                    strokeDasharray="0 100"
                    animate={{ strokeDasharray: strokeDash }}
                    transition={{ delay: 0.2 + (idx * 0.1), duration: 0.8, ease: "easeOut" }}
                    strokeDashoffset={strokeDashOffset}
                    strokeLinecap="round"
                    className="cursor-pointer transition-all hover:stroke-[14]"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={cn("text-sm font-semibold opacity-60", isDarkTheme ? "text-slate-400" : "text-gray-500")}>
                Total
              </span>
              <span className={cn("text-2xl font-extrabold", isDarkTheme ? "text-white" : "text-gray-900")}>
                100%
              </span>
            </div>
          </div>

          {/* Details Legend */}
          <div className="flex-1 space-y-3 w-full">
            {elements.map((el, idx) => {
              const colors = [
                accentStyleObj?.backgroundColor || '#8b5cf6',
                '#10b981', '#f59e0b', '#3b82f6', '#ec4899'
              ];
              const sliceColor = colors[idx % colors.length];
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="flex items-start gap-3"
                >
                  <span 
                    className="w-3.5 h-3.5 rounded-full mt-1.5 flex-shrink-0" 
                    style={{ backgroundColor: sliceColor }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-bold text-sm", isDarkTheme ? "text-white" : "text-gray-900")}>
                        {el.label}
                      </span>
                      {el.percentage !== undefined && (
                        <span className="text-xs font-semibold opacity-70">
                          ({el.percentage}%)
                        </span>
                      )}
                    </div>
                    {el.value && (
                      <div className="text-xs font-bold opacity-80 mt-0.5">{el.value}</div>
                    )}
                    {el.secondaryText && (
                      <p className={cn("text-xs leading-normal", isDarkTheme ? "text-slate-400" : "text-gray-500")}>
                        {el.secondaryText}
                      </p>
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
