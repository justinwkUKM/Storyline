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
          <h1 className="text-3xl font-extrabold text-gray-900">Saved Decks</h1>
          <p className="text-gray-500 mt-1">Open a saved presentation or generate a new one from a PDF.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-bold flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={onNew}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Presentation
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          Loading decks...
        </div>
      ) : decks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">No saved decks yet</h2>
          <p className="text-gray-500 mt-2">Generate your first presentation and save it here.</p>
          <button
            onClick={onNew}
            className="mt-6 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Deck
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <div key={deck.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <button onClick={() => onOpen(deck.id)} className="text-left flex-1">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 line-clamp-2">{deck.title}</h3>
                <p className="text-xs text-gray-400 mt-2">
                  Updated {new Date(deck.updatedAt).toLocaleString()}
                </p>
              </button>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button onClick={() => onOpen(deck.id)} className="text-sm font-bold text-blue-600 hover:text-blue-700">
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
