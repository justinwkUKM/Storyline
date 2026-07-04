import React from 'react';
import { Copy, Link2, Loader2, RefreshCw, X } from 'lucide-react';
import { ShareLinkInfo } from '../types';

interface ShareLinkDialogProps {
  open: boolean;
  deckTitle: string;
  share: ShareLinkInfo | null;
  loading: boolean;
  status?: string | null;
  error?: string | null;
  onPrimaryAction: () => void;
  onRevoke: () => void;
  onClose: () => void;
}

export function ShareLinkDialog({
  open,
  deckTitle,
  share,
  loading,
  status,
  error,
  onPrimaryAction,
  onRevoke,
  onClose,
}: ShareLinkDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center px-4 py-6" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-3xl border border-lime-200 bg-white/95 shadow-2xl shadow-lime-950/15 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-lime-100 bg-lime-50/70">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-lime-700">Share presentation</p>
            <h2 id="share-dialog-title" className="text-xl font-black text-lime-950 mt-1 truncate">{deckTitle}</h2>
            <p className="text-sm text-lime-900/65 font-medium mt-1">
              Anyone with the link can view it. They cannot edit, save, or export your deck.
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-full border border-lime-200 bg-white hover:bg-lime-50 text-lime-900 flex items-center justify-center transition-colors"
            title="Close"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-lime-200 bg-lime-50 px-4 py-4 text-lime-900">
              <Loader2 className="w-4 h-4 animate-spin text-lime-700" />
              <span className="text-sm font-semibold">Loading link status...</span>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-lime-200 bg-white px-4 py-4">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-lime-700">Share URL</label>
                <div className="mt-2 flex items-center gap-3">
                  <div className="min-w-0 flex-1 rounded-xl border border-lime-200 bg-lime-50/70 px-4 py-3 text-sm font-semibold text-lime-950 truncate">
                    {share?.url || 'Create a link to get a shareable URL.'}
                  </div>
                  <button
                    type="button"
                    onClick={onPrimaryAction}
                    className="shrink-0 inline-flex items-center gap-2 rounded-full bg-lime-950 px-4 py-3 text-xs font-black text-lime-50 hover:bg-lime-900 transition-colors"
                  >
                    {share ? <Copy className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                    {share ? 'Copy link' : 'Create link'}
                  </button>
                </div>
                {share && (
                  <p className="mt-3 text-xs font-semibold text-lime-900/55">
                    Created {new Date(share.createdAt).toLocaleString()}.
                  </p>
                )}
              </div>

              {status && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                  {status}
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={onPrimaryAction}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-lime-200 bg-white px-4 py-3 text-xs font-black text-lime-950 hover:bg-lime-50 transition-colors"
                >
                  {share ? <RefreshCw className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                  {share ? 'Copy link again' : 'Create link'}
                </button>

                <button
                  type="button"
                  onClick={onRevoke}
                  disabled={!share}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-4 py-3 text-xs font-black text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Revoke link
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
