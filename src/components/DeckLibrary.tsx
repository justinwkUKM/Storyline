import React from 'react';
import { FileText, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { DeckSummary } from '../types';

interface DeckLibraryProps {
  decks: DeckSummary[];
  isLoading: boolean;
  error?: string | null;
  onNew: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function DeckLibrary({ decks, isLoading, error, onNew, onOpen, onDelete, onRefresh }: DeckLibraryProps) {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black text-lime-950">Storylines</h1>
          <p className="text-lime-900/70 mt-1 font-medium">Open a saved deck or shape a new visual story from a PDF.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="px-4 py-2 rounded-full border border-lime-200 bg-white/70 hover:bg-white text-lime-950 text-sm font-bold flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={onNew}
            className="px-5 py-2 rounded-full bg-lime-950 hover:bg-lime-900 text-lime-50 text-sm font-black flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Storyline
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white/80 border border-lime-200 rounded-3xl p-12 flex flex-col items-center justify-center text-lime-900/70">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          Loading decks...
        </div>
      ) : decks.length === 0 ? (
        <div className="bg-white/80 border border-lime-200 rounded-3xl p-12 text-center shadow-xl shadow-lime-950/5">
          <FileText className="w-12 h-12 text-lime-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-lime-950">No storylines yet</h2>
          <p className="text-lime-900/70 mt-2 font-medium">Generate your first deck and save it here.</p>
          <button
            onClick={onNew}
            className="mt-6 px-5 py-3 rounded-full bg-lime-950 hover:bg-lime-900 text-lime-50 text-sm font-black inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Storyline
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <div key={deck.id} className="bg-white/85 border border-lime-200 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
              <button onClick={() => onOpen(deck.id)} className="text-left flex-1">
                <div className="w-10 h-10 rounded-2xl bg-lime-300 text-lime-950 flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lime-950 line-clamp-2">{deck.title}</h3>
                <p className="text-xs text-lime-900/50 mt-2 font-medium">
                  Updated {new Date(deck.updatedAt).toLocaleString()}
                </p>
              </button>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button onClick={() => onOpen(deck.id)} className="text-sm font-black text-lime-800 hover:text-lime-950">
                  Open
                </button>
                <button
                  onClick={() => onDelete(deck.id)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                  title="Delete deck"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
