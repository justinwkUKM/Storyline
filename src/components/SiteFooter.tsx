import React from 'react';

interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer className={className}>
      <div className="w-full px-4 py-4 text-center text-[11px] sm:text-xs font-semibold text-lime-900/65">
        <div>Copyright waqasobeidy.com</div>
        <div className="mt-1">Built with love in Kuala Lumpur</div>
      </div>
    </footer>
  );
}
