/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  AuthUser,
  CustomizationSettings,
  DeckSummary,
  PresentationData,
  SavedDeck,
  ThemeName
} from './types';
import { Uploader } from './components/Uploader';
import { Presentation } from './components/Presentation';
import { SlideEditor } from './components/SlideEditor';
import { AuthScreen } from './components/AuthScreen';
import { DeckLibrary } from './components/DeckLibrary';
import { AnimatePresence, motion } from 'motion/react';
import { FileText, LogOut } from 'lucide-react';

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
  });
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => ({})) : {};

  if (!response.ok) {
    throw new Error(payload.error || `Request failed with status ${response.status}`);
  }
  if (!isJson) {
    throw new Error('Server returned an invalid response format.');
  }
  return payload as T;
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [draftPresentation, setDraftPresentation] = useState<PresentationData | null>(null);
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [theme, setTheme] = useState<ThemeName>('modern');
  const [customSettings, setCustomSettings] = useState<CustomizationSettings | undefined>();
  const [currentDeckId, setCurrentDeckId] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(true);

  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [decksLoading, setDecksLoading] = useState(false);
  const [decksError, setDecksError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshDecks = async () => {
    if (!user) return;
    setDecksLoading(true);
    setDecksError(null);
    try {
      const data = await apiRequest<{ decks: DeckSummary[] }>('/api/decks');
      setDecks(data.decks);
    } catch (err) {
      setDecksError(err instanceof Error ? err.message : 'Failed to load decks');
    } finally {
      setDecksLoading(false);
    }
  };

  useEffect(() => {
    apiRequest<{ user: AuthUser }>('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      refreshDecks();
    }
  }, [user]);

  const handleAuthSubmit = async (mode: 'login' | 'register', email: string, password: string) => {
    setAuthError(null);
    try {
      const data = await apiRequest<{ user: AuthUser }>(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setUser(data.user);
      setShowLibrary(true);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  const handleLogout = async () => {
    await apiRequest<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }).catch(() => ({ ok: true }));
    setUser(null);
    setDraftPresentation(null);
    setPresentation(null);
    setCurrentDeckId(null);
    setDecks([]);
    setShowLibrary(true);
  };

  const handleGenerate = async (
    file: File,
    selectedTheme: ThemeName,
    settings?: CustomizationSettings,
    graphicStyle: string = 'modern_infographic',
    tone: string = 'executive',
    slideCount: string = 'auto',
    orientation: string = 'horizontal'
  ) => {
    setIsLoading(true);
    setError(null);
    setTheme(selectedTheme);
    setCustomSettings(settings);
    setCurrentDeckId(null);

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('graphicStyle', graphicStyle);
    formData.append('tone', tone);
    formData.append('slideCount', slideCount);
    formData.append('orientation', orientation);
    if (settings) {
      formData.append('customSettings', JSON.stringify(settings));
    }

    try {
      const data = await apiRequest<PresentationData>('/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (data && data.slides && data.slides.length > 0) {
        setDraftPresentation(data);
        setShowLibrary(false);
      } else {
        throw new Error('Received invalid presentation structure from server');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const saveDeck = async (
    data: PresentationData,
    selectedTheme: ThemeName,
    settings?: CustomizationSettings,
    saveAsNew = false
  ) => {
    setSaveStatus('Saving...');
    try {
      const endpoint = currentDeckId && !saveAsNew ? `/api/decks/${currentDeckId}` : '/api/decks';
      const method = currentDeckId && !saveAsNew ? 'PUT' : 'POST';
      const result = await apiRequest<{ deck: SavedDeck }>(endpoint, {
        method,
        body: JSON.stringify({
          title: data.title,
          presentationData: data,
          theme: selectedTheme,
          customSettings: settings,
        }),
      });
      setCurrentDeckId(result.deck.id);
      setTheme(result.deck.theme);
      setCustomSettings(result.deck.customSettings);
      setDraftPresentation(data);
      setSaveStatus('Saved');
      await refreshDecks();
      setTimeout(() => setSaveStatus(''), 1600);
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : 'Save failed');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const openDeck = async (id: string) => {
    setDecksError(null);
    try {
      const data = await apiRequest<{ deck: SavedDeck }>(`/api/decks/${id}`);
      setCurrentDeckId(data.deck.id);
      setDraftPresentation(data.deck.presentationData);
      setPresentation(null);
      setTheme(data.deck.theme);
      setCustomSettings(data.deck.customSettings);
      setShowLibrary(false);
    } catch (err) {
      setDecksError(err instanceof Error ? err.message : 'Failed to open deck');
    }
  };

  const deleteDeck = async (id: string) => {
    const shouldDelete = window.confirm('Delete this saved deck? This cannot be undone.');
    if (!shouldDelete) return;
    try {
      await apiRequest<{ ok: boolean }>(`/api/decks/${id}`, { method: 'DELETE' });
      if (currentDeckId === id) {
        setCurrentDeckId(null);
        setDraftPresentation(null);
        setPresentation(null);
      }
      await refreshDecks();
    } catch (err) {
      setDecksError(err instanceof Error ? err.message : 'Failed to delete deck');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onSubmit={handleAuthSubmit} error={authError} />;
  }

  const startNewPresentation = () => {
    setCurrentDeckId(null);
    setDraftPresentation(null);
    setPresentation(null);
    setError(null);
    setShowLibrary(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
      {!presentation && !draftPresentation && (
        <header className="w-full bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button onClick={() => setShowLibrary(true)} className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-sm">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">SlideCraft AI</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">{user.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-bold text-gray-700 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>
      )}

      <AnimatePresence mode="wait">
        {presentation ? (
          <motion.div
            key="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <Presentation
              data={presentation}
              theme={theme}
              customSettings={customSettings}
              onClose={() => {
                setPresentation(null);
                setDraftPresentation(null);
                setShowLibrary(true);
              }}
            />
          </motion.div>
        ) : draftPresentation ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <SlideEditor
              initialData={draftPresentation}
              initialTheme={theme}
              initialCustomSettings={customSettings}
              savedDeckId={currentDeckId}
              saveStatus={saveStatus}
              onSave={saveDeck}
              onFinalise={(finalData, finalTheme, finalSettings) => {
                setTheme(finalTheme);
                setCustomSettings(finalSettings);
                setPresentation(finalData);
              }}
              onCancel={() => {
                setDraftPresentation(null);
                setShowLibrary(true);
              }}
            />
          </motion.div>
        ) : showLibrary ? (
          <motion.div
            key="library"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full flex-1"
          >
            <DeckLibrary
              decks={decks}
              isLoading={decksLoading}
              error={decksError}
              onNew={startNewPresentation}
              onOpen={openDeck}
              onDelete={deleteDeck}
              onRefresh={refreshDecks}
            />
          </motion.div>
        ) : (
          <motion.div
            key="uploader"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col items-center justify-center py-12"
          >
            {error && (
              <div className="max-w-6xl w-full mx-auto px-6 mb-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm">
                  <p className="font-medium">Error generating presentation</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            <Uploader onGenerate={handleGenerate} isLoading={isLoading} />

            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mb-6"
                  />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">Analyzing your PDF...</h3>
                  <p className="text-gray-500">Extracting text and synthesizing slides using Gemini AI</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
