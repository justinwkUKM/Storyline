import React from 'react';
import { Coins, Copy, FileText, Loader2, PlayCircle, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { AuthUser, DeckSummary } from '../types';

interface DeckLibraryProps {
  user: AuthUser;
  decks: DeckSummary[];
  isLoading: boolean;
  error?: string | null;
  onNew: () => void;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => void;
  onPresent: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function DeckLibrary({ user, decks, isLoading, error, onNew, onOpen, onDuplicate, onPresent, onDelete, onRefresh }: DeckLibraryProps) {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-lime-950 tracking-tight">Storylines</h1>
          <p className="text-lime-900/70 mt-2 font-semibold">Open a saved deck or shape a new visual story from a PDF.</p>
        </div>
        <div className="flex flex-col sm:items-end gap-3">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur border border-lime-200/80 text-xs font-black text-lime-950 shadow-sm"
            title={`Credits automatically renew on ${new Date(new Date(user.creditsResetAt).setMonth(new Date(user.creditsResetAt).getMonth() + 1)).toLocaleDateString()}`}
          >
            <Coins className="w-3.5 h-3.5 text-lime-700" />
            <span>{user.credits} / 100 credits</span>
            <span className="text-lime-900/50 font-bold hidden sm:inline">
              Renew {new Date(new Date(user.creditsResetAt).setMonth(new Date(user.creditsResetAt).getMonth() + 1)).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              className="px-5 py-2.5 rounded-full border border-lime-200/80 bg-white/80 backdrop-blur hover:bg-white text-lime-950 text-sm font-black flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={onNew}
              className="px-6 py-2.5 rounded-full bg-lime-950 hover:bg-lime-900 text-lime-50 text-sm font-black flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-lime-950/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Storyline
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3.5 text-sm font-medium mb-8">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white/80 backdrop-blur border border-lime-200 rounded-3xl p-16 flex flex-col items-center justify-center text-lime-900/70 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-lime-700" />
          <span className="font-bold">Loading decks...</span>
        </div>
      ) : decks.length === 0 ? (
        <div className="bg-white/90 backdrop-blur border border-lime-200 rounded-3xl p-16 text-center shadow-xl shadow-lime-950/5">
          <FileText className="w-16 h-16 text-lime-400 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-lime-950">No storylines yet</h2>
          <p className="text-lime-900/70 mt-2 font-semibold">Generate your first deck and save it here.</p>
          <button
            onClick={onNew}
            className="mt-6 px-6 py-3.5 rounded-full bg-lime-950 hover:bg-lime-900 text-lime-50 text-sm font-black inline-flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-lime-950/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Storyline
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <div 
              key={deck.id} 
              className="bg-white/90 backdrop-blur border border-lime-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-lime-950/5 group"
            >
              <button onClick={() => onOpen(deck.id)} className="text-left flex-1 cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-lime-300 text-lime-950 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-lime-400">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-black text-lime-950 text-lg leading-snug line-clamp-2 transition-colors group-hover:text-lime-800">{deck.title}</h3>
                <p className="text-xs text-lime-900/50 mt-2.5 font-bold">
                  Updated {new Date(deck.updatedAt).toLocaleString()}
                </p>
              </button>
              <div className="flex items-center justify-between pt-4 border-t border-lime-100">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onOpen(deck.id)} 
                    className="px-4 py-1.5 rounded-full bg-lime-50 text-lime-800 hover:bg-lime-950 hover:text-lime-50 text-xs font-black transition-colors cursor-pointer"
                  >
                    Open Storyline
                  </button>
                  <button
                    onClick={() => onDuplicate(deck.id)}
                    className="p-2 rounded-xl text-lime-700 hover:text-lime-950 hover:bg-lime-50 transition-colors cursor-pointer"
                    title="Duplicate deck"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onPresent(deck.id)}
                    className="p-2 rounded-xl text-lime-700 hover:text-lime-950 hover:bg-lime-50 transition-colors cursor-pointer"
                    title="Play presentation"
                  >
                    <PlayCircle className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => onDelete(deck.id)}
                  className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
