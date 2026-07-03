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
    <div className="min-h-screen bg-lime-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-lime-900/70 hover:text-lime-950"
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

        <form onSubmit={handleSubmit} className="bg-white/80 border border-lime-200 rounded-3xl shadow-xl shadow-lime-950/5 p-6 space-y-5">
          <div>
            <h1 className="text-3xl font-black text-lime-950">
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </h1>
            <p className="text-sm text-lime-900/70 mt-1 font-medium">
              Save every storyline and keep shaping it later.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-lime-950">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-lime-200 bg-lime-50/50 px-4 py-3 outline-none focus:border-lime-500"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-lime-950">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-lime-200 bg-lime-50/50 px-4 py-3 outline-none focus:border-lime-500"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              required
            />
            {mode === 'register' && (
              <p className="text-xs text-lime-900/50">Use at least 8 characters.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-lime-950 hover:bg-lime-900 disabled:bg-gray-400 text-lime-50 rounded-full py-3 font-black flex items-center justify-center gap-2 transition-colors"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>

          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-lime-900/60">
              {mode === 'login' ? 'Need an account?' : 'Already have an account?'}
            </span>
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className={cn("font-black text-lime-800 hover:text-lime-950")}
            >
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
