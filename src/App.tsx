/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  AuthUser,
  CustomizationSettings,
  DeckSummary,
  PresentationData,
  ShareLinkInfo,
  SavedDeck,
  ThemeName
} from './types';
import { Uploader } from './components/Uploader';
import { Presentation } from './components/Presentation';
import { SlideEditor } from './components/SlideEditor';
import { AuthScreen } from './components/AuthScreen';
import { DeckLibrary } from './components/DeckLibrary';
import { LandingPage } from './components/LandingPage';
import { BrandLogo } from './components/BrandLogo';
import { SiteFooter } from './components/SiteFooter';
import { ShareLinkDialog } from './components/ShareLinkDialog';
import { apiRequest } from './lib/api';
import { AnimatePresence, motion } from 'motion/react';
import { LogOut, Zap } from 'lucide-react';

export default function App() {
  const shareToken = typeof window !== 'undefined'
    ? window.location.pathname.match(/^\/share\/([^/?#]+)/)?.[1] || null
    : null;

  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  const [draftPresentation, setDraftPresentation] = useState<PresentationData | null>(null);
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [theme, setTheme] = useState<ThemeName>('limefrost');
  const [customSettings, setCustomSettings] = useState<CustomizationSettings | undefined>();
  const [currentDeckId, setCurrentDeckId] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(true);

  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [decksLoading, setDecksLoading] = useState(false);
  const [decksError, setDecksError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState('');
  const currentDeckIdRef = useRef<string | null>(null);
  const saveQueueRef = useRef(Promise.resolve());
  const saveStatusTimerRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharedPresentation, setSharedPresentation] = useState<PresentationData | null>(null);
  const [sharedTheme, setSharedTheme] = useState<ThemeName>('limefrost');
  const [sharedCustomSettings, setSharedCustomSettings] = useState<CustomizationSettings | undefined>();
  const [shareLoading, setShareLoading] = useState(Boolean(shareToken));
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareDialogDeck, setShareDialogDeck] = useState<{ id: string; title: string } | null>(null);
  const [shareDialogLoading, setShareDialogLoading] = useState(false);
  const [shareDialogShare, setShareDialogShare] = useState<ShareLinkInfo | null>(null);
  const [shareDialogError, setShareDialogError] = useState<string | null>(null);
  const [shareDialogStatus, setShareDialogStatus] = useState<string | null>(null);

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
    if (shareToken) {
      setAuthLoading(false);
      return;
    }

    apiRequest<{ user: AuthUser }>('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, [shareToken]);

  useEffect(() => {
    if (!shareToken) return;

    const loadSharedDeck = async () => {
      setShareLoading(true);
      setShareError(null);
      try {
        const data = await apiRequest<{ deck: SavedDeck }>(`/api/share/${shareToken}`);
        setSharedPresentation(data.deck.presentationData);
        setSharedTheme(data.deck.theme);
        setSharedCustomSettings(data.deck.customSettings);
      } catch (err) {
        setShareError(err instanceof Error ? err.message : 'Shared presentation unavailable.');
      } finally {
        setShareLoading(false);
      }
    };

    void loadSharedDeck();
  }, [shareToken]);

  useEffect(() => {
    if (!shareToken) return;

    const robots = document.querySelector('meta[name="robots"]') || document.createElement('meta');
    if (!robots.parentElement) {
      robots.setAttribute('name', 'robots');
      document.head.appendChild(robots);
    }
    const previousContent = robots.getAttribute('content');
    robots.setAttribute('content', 'noindex,nofollow');
    const previousTitle = document.title;
    if (sharedPresentation?.title) {
      document.title = `${sharedPresentation.title} - Storyline`;
    } else {
      document.title = 'Shared presentation - Storyline';
    }

    return () => {
      if (previousContent !== null) {
        robots.setAttribute('content', previousContent);
      }
      document.title = previousTitle;
    };
  }, [shareToken, sharedPresentation?.title]);

  useEffect(() => {
    if (user) {
      refreshDecks();
    }
  }, [user]);

  useEffect(() => {
    currentDeckIdRef.current = currentDeckId;
  }, [currentDeckId]);

  useEffect(() => {
    return () => {
      if (saveStatusTimerRef.current) {
        window.clearTimeout(saveStatusTimerRef.current);
      }
    };
  }, []);

  const handleAuthSubmit = async (mode: 'login' | 'register', email: string, password: string) => {
    setAuthError(null);
    try {
      const data = await apiRequest<{ user: AuthUser }>(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setUser(data.user);
      setShowLibrary(true);
      setShowAuth(false);
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
    orientation: string = 'horizontal',
    presentationType: string = 'business_brief',
    audience: string = 'general',
    narrativeStyle: string = 'balanced',
    focusPrompt: string = ''
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
    formData.append('presentationType', presentationType);
    formData.append('audience', audience);
    formData.append('narrativeStyle', narrativeStyle);
    if (focusPrompt.trim()) {
      formData.append('focusPrompt', focusPrompt.trim());
    }
    if (settings) {
      formData.append('customSettings', JSON.stringify(settings));
    }

    try {
      const data = await apiRequest<PresentationData & { creditsRemaining?: number }>('/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (data && data.slides && data.slides.length > 0) {
        setDraftPresentation(data);
        setShowLibrary(false);
        if (typeof data.creditsRemaining === 'number' && user) {
          setUser({ ...user, credits: data.creditsRemaining });
        }
        void saveDeck(data, selectedTheme, settings).catch(() => undefined);
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
    const performSave = async () => {
      if (saveStatusTimerRef.current) {
        window.clearTimeout(saveStatusTimerRef.current);
      }
      setSaveStatus('Saving...');

      try {
        const deckId = currentDeckIdRef.current;
        const endpoint = deckId && !saveAsNew ? `/api/decks/${deckId}` : '/api/decks';
        const method = deckId && !saveAsNew ? 'PUT' : 'POST';
        const result = await apiRequest<{ deck: SavedDeck }>(endpoint, {
          method,
          body: JSON.stringify({
            title: data.title,
            presentationData: data,
            theme: selectedTheme,
            customSettings: settings,
          }),
        });
        currentDeckIdRef.current = result.deck.id;
        setCurrentDeckId(result.deck.id);
        setTheme(result.deck.theme);
        setCustomSettings(result.deck.customSettings);
        setDraftPresentation(data);
        setSaveStatus('Saved');
        setDecks((currentDecks) => {
          const nextDecks = currentDecks.filter((deck) => deck.id !== result.deck.id);
          nextDecks.unshift(result.deck);
          return nextDecks;
        });
        saveStatusTimerRef.current = window.setTimeout(() => setSaveStatus(''), 1600);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Save failed';
        setSaveStatus(message);
        saveStatusTimerRef.current = window.setTimeout(() => setSaveStatus(''), 3000);
        throw err;
      }
    };

    const queuedSave = saveQueueRef.current.then(performSave, performSave);
    saveQueueRef.current = queuedSave.then(
      () => undefined,
      () => undefined
    );
    return queuedSave;
  };

  const duplicateDeck = async (id: string) => {
    try {
      const data = await apiRequest<{ deck: SavedDeck }>(`/api/decks/${id}`);
      const duplicatedPresentation: PresentationData = {
        ...data.deck.presentationData,
        title: data.deck.presentationData.title ? `${data.deck.presentationData.title} Copy` : 'Copy of Storyline',
        slides: data.deck.presentationData.slides.map((slide) => ({
          ...slide,
          id: `${slide.id}-copy-${Date.now()}`
        }))
      };

      setCurrentDeckId(null);
      currentDeckIdRef.current = null;
      setDraftPresentation(duplicatedPresentation);
      setPresentation(null);
      setTheme(data.deck.theme);
      setCustomSettings(data.deck.customSettings);
      setShowLibrary(false);
      setError(null);
    } catch (err) {
      setDecksError(err instanceof Error ? err.message : 'Failed to duplicate deck');
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

  const presentDeck = async (id: string) => {
    setDecksError(null);
    try {
      const data = await apiRequest<{ deck: SavedDeck }>(`/api/decks/${id}`);
      setCurrentDeckId(data.deck.id);
      setDraftPresentation(null);
      setPresentation(data.deck.presentationData);
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

  const copyTextToClipboard = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  };

  const closeShareDialog = () => {
    setShareDialogDeck(null);
    setShareDialogShare(null);
    setShareDialogError(null);
    setShareDialogStatus(null);
    setShareDialogLoading(false);
  };

  const openShareDialog = async (deckId: string, title: string) => {
    setShareDialogDeck({ id: deckId, title });
    setShareDialogShare(null);
    setShareDialogError(null);
    setShareDialogStatus(null);
    setShareDialogLoading(true);

    try {
      const data = await apiRequest<{ share: ShareLinkInfo | null }>(`/api/decks/${deckId}/share`);
      setShareDialogShare(data.share);
    } catch (err) {
      setShareDialogError(err instanceof Error ? err.message : 'Failed to load share link.');
    } finally {
      setShareDialogLoading(false);
    }
  };

  const handleSharePrimaryAction = async () => {
    if (!shareDialogDeck || shareDialogLoading) return;

    setShareDialogError(null);
    setShareDialogStatus(null);
    setShareDialogLoading(true);

    try {
      const share = shareDialogShare
        ? shareDialogShare
        : (await apiRequest<{ share: ShareLinkInfo }>(`/api/decks/${shareDialogDeck.id}/share`, { method: 'POST' })).share;

      setShareDialogShare(share);
      await copyTextToClipboard(share.url);
      setShareDialogStatus('Share link copied to clipboard.');
      void refreshDecks();
    } catch (err) {
      setShareDialogError(err instanceof Error ? err.message : 'Failed to create or copy the share link.');
    } finally {
      setShareDialogLoading(false);
    }
  };

  const handleShareRevoke = async () => {
    if (!shareDialogDeck || shareDialogLoading || !shareDialogShare) return;

    setShareDialogError(null);
    setShareDialogStatus(null);
    setShareDialogLoading(true);

    try {
      await apiRequest<{ ok: boolean }>(`/api/decks/${shareDialogDeck.id}/share`, { method: 'DELETE' });
      setShareDialogShare(null);
      setShareDialogStatus('Share link revoked.');
      void refreshDecks();
    } catch (err) {
      setShareDialogError(err instanceof Error ? err.message : 'Failed to revoke the share link.');
    } finally {
      setShareDialogLoading(false);
    }
  };

  if (shareToken) {
    if (shareLoading) {
      return (
        <div className="min-h-screen bg-lime-50 flex items-center justify-center text-lime-900/70 font-semibold">
          Loading shared presentation...
        </div>
      );
    }

    if (shareError || !sharedPresentation) {
      return (
        <div className="min-h-screen bg-lime-50 flex items-center justify-center px-6">
          <div className="w-full max-w-md rounded-3xl border border-lime-200 bg-white/95 backdrop-blur p-8 shadow-xl shadow-lime-950/5 text-center">
            <BrandLogo className="h-14 mx-auto max-w-[280px]" />
            <h1 className="mt-6 text-3xl font-black text-lime-950">Shared presentation unavailable</h1>
            <p className="mt-3 text-lime-900/70 font-medium">
              {shareError || 'This share link is invalid or has been revoked.'}
            </p>
            <button
              onClick={() => window.location.assign('/')}
              className="mt-6 px-6 py-3 rounded-full bg-lime-950 text-lime-50 font-black hover:bg-lime-900 transition-colors"
            >
              Go home
            </button>
          </div>
        </div>
      );
    }

    return (
      <Presentation
        data={sharedPresentation}
        theme={sharedTheme}
        customSettings={sharedCustomSettings}
        readOnly
        onClose={() => window.location.assign('/')}
      />
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    if (!showAuth) {
      return <LandingPage onGetStarted={() => setShowAuth(true)} />;
    }

    return <AuthScreen onSubmit={handleAuthSubmit} error={authError} onBack={() => setShowAuth(false)} />;
  }

  const startNewPresentation = () => {
    setCurrentDeckId(null);
    setDraftPresentation(null);
    setPresentation(null);
    setError(null);
    setShowLibrary(false);
  };

  return (
    <div className="min-h-screen bg-lime-50 flex flex-col font-sans">
      {!presentation && !draftPresentation && (
        <header className="w-full bg-lime-50/90 backdrop-blur border-b border-lime-200 px-6 py-4 flex items-center justify-between">
          <button onClick={() => setShowLibrary(true)} className="flex items-center gap-3">
            <BrandLogo className="h-16 max-w-[320px] drop-shadow-[0_2px_10px_rgba(10,20,8,0.12)]" />
          </button>
          <div className="flex items-center gap-4">
            {/* Premium Credit Badge */}
            <div 
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-lime-100/60 border border-lime-200/60 rounded-full text-xs font-black text-lime-950 shadow-sm relative group cursor-pointer"
              title={`Credits automatically renew on ${new Date(new Date(user.creditsResetAt).setMonth(new Date(user.creditsResetAt).getMonth() + 1)).toLocaleDateString()}`}
            >
              <Zap className="w-3.5 h-3.5 text-lime-700 animate-pulse" />
              <span>{user.credits} / 100 Credits</span>
              
              {/* Tooltip */}
              <div className="absolute right-0 top-full mt-2 hidden group-hover:block bg-lime-950 text-lime-100 text-[10px] p-2.5 rounded-xl shadow-lg font-bold w-48 text-center z-50">
                Resets to 100 on {new Date(new Date(user.creditsResetAt).setMonth(new Date(user.creditsResetAt).getMonth() + 1)).toLocaleDateString()}
              </div>
            </div>

            <span className="text-sm text-lime-900/70 hidden sm:block">{user.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full border border-lime-200 bg-white/70 hover:bg-white text-sm font-bold text-lime-950 flex items-center gap-2"
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
              onEdit={() => {
                setDraftPresentation(presentation);
                setPresentation(null);
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
              onShareDeck={currentDeckId ? () => void openShareDialog(currentDeckId, draftPresentation?.title || 'Shared Deck') : undefined}
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
              user={user}
              decks={decks}
              isLoading={decksLoading}
              error={decksError}
              onNew={startNewPresentation}
              onOpen={openDeck}
              onDuplicate={duplicateDeck}
              onPresent={presentDeck}
              onShare={(id) => {
                const deck = decks.find((item) => item.id === id);
                void openShareDialog(id, deck?.title || 'Shared Deck');
              }}
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

            <Uploader onGenerate={handleGenerate} isLoading={isLoading} user={user} />

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
                    className="w-16 h-16 border-4 border-lime-200 border-t-lime-700 rounded-full mb-6"
                  />
                  <h3 className="text-2xl font-black text-lime-950 mb-2">Building your storyline...</h3>
                  <p className="text-lime-900/70">Extracting text and shaping a deck with Gemini AI</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <ShareLinkDialog
        open={Boolean(shareDialogDeck)}
        deckTitle={shareDialogDeck?.title || 'Shared Deck'}
        share={shareDialogShare}
        loading={shareDialogLoading}
        status={shareDialogStatus}
        error={shareDialogError}
        onPrimaryAction={handleSharePrimaryAction}
        onRevoke={handleShareRevoke}
        onClose={closeShareDialog}
      />

      <SiteFooter className="mt-auto w-full" />
    </div>
  );
}
