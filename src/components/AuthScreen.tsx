import React, { useState } from 'react';
import { ArrowLeft, FileText, Loader2, LogIn, UserPlus } from 'lucide-react';
import { cn } from '../lib/utils';

interface AuthScreenProps {
  onSubmit: (mode: 'login' | 'register', email: string, password: string) => Promise<void>;
  error?: string | null;
  onBack?: () => void;
}

export function AuthScreen({ onSubmit, error, onBack }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(mode, email, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-lime-50 flex items-center justify-center px-6 py-12 overflow-hidden">
      {/* Premium background decorative blur blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-lime-300/30 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-200/25 blur-3xl -z-10 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-2 text-sm font-black text-lime-900/70 hover:text-lime-950 transition-all hover:translate-x-[-4px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-lime-400 border border-lime-500/40 p-3 rounded-2xl shadow-sm">
            <FileText className="w-8 h-8 text-lime-950" />
          </div>
          <span className="text-2xl font-black text-lime-950">Storyline</span>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur border border-lime-200 rounded-3xl shadow-xl shadow-lime-950/5 p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-black text-lime-950 tracking-tight">
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </h1>
            <p className="text-sm text-lime-900/70 mt-2 font-semibold">
              Save every storyline and keep shaping it later.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3.5 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-black text-lime-950">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-lime-200/70 bg-white px-4 py-3 outline-none transition-all focus:border-lime-500 focus:ring-4 focus:ring-lime-500/10"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-lime-950">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-lime-200/70 bg-white px-4 py-3 outline-none transition-all focus:border-lime-500 focus:ring-4 focus:ring-lime-500/10"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              required
            />
            {mode === 'register' && (
              <p className="text-xs text-lime-900/50 font-bold px-1">Use at least 8 characters.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-lime-950 hover:bg-lime-900 disabled:bg-gray-400 text-lime-50 rounded-full py-3.5 font-black flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-lime-950/10 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>

          <div className="flex items-center justify-center gap-2 text-sm pt-2">
            <span className="text-lime-900/60 font-semibold">
              {mode === 'login' ? 'Need an account?' : 'Already have an account?'}
            </span>
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className={cn("font-black text-lime-800 hover:text-lime-950 hover:underline cursor-pointer")}
            >
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
