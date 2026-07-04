import React from 'react';
import { BrandLogo } from './BrandLogo';

interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer className={className}>
      <div className="w-full border-t border-lime-200/80 bg-lime-50/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-10 sm:h-11 max-w-[240px]" />
            <div className="text-xs sm:text-sm font-semibold text-lime-900/65">
              Limefrost presentation studio
            </div>
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-lime-900/45">
            Storyline keeps deck JSON editable, saved, and ready to present.
          </div>
        </div>
      </div>
    </footer>
  );
}
