import React, { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  File as FileIcon,
  FileText,
  Link as LinkIcon,
  Loader2,
  Mic,
  Paperclip,
  Plus,
  Send,
  Sparkles,
  X,
  Zap,
  Clock,
} from 'lucide-react';
import { ThemeName, CustomizationSettings, AuthUser, GenerationSource } from '../types';
import { cn } from '../lib/utils';

interface UploaderProps {
  onGenerate: (
    source: GenerationSource,
    theme: ThemeName,
    customSettings?: CustomizationSettings,
    graphicStyle?: string,
    tone?: string,
    slideCount?: string,
    orientation?: string,
    presentationType?: string,
    audience?: string,
    narrativeStyle?: string,
    focusPrompt?: string
  ) => void;
  isLoading: boolean;
  user: AuthUser;
}

type AttachmentMode = 'pdf' | 'url' | 'text';

const DEFAULT_CUSTOM_SETTINGS: CustomizationSettings = {
  fontFamily: 'font-sans',
  primaryColor: '#a3e635',
  backgroundColor: '#f7fee7',
  textColor: '#1a2e05',
  spacing: 'normal',
  alignment: 'left',
};

const SUGGESTIONS = [
  'Summarize this into an executive update',
  'Create a customer-facing product story',
  'Turn research notes into a board-ready deck',
  'Build a training presentation with examples',
];

const RECENT_PRESENTATIONS = [
  { title: 'Q3 GTM Readout', meta: 'Business brief · 8 slides' },
  { title: 'AI Policy Workshop', meta: 'Workshop · Auto slides' },
  { title: 'Customer Insights Snapshot', meta: 'Executive · Horizontal' },
];

export function Uploader({ onGenerate, isLoading, user }: UploaderProps) {
  const [presentationRequest, setPresentationRequest] = useState('');
  const [attachmentMode, setAttachmentMode] = useState<AttachmentMode>('pdf');
  const [isAttachmentPanelOpen, setIsAttachmentPanelOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sourceText, setSourceText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Preserve existing generation defaults.
  const [theme] = useState<ThemeName>('limefrost');
  const [customSettings] = useState<CustomizationSettings>(DEFAULT_CUSTOM_SETTINGS);
  const [graphicStyle] = useState<string>('modern_infographic');
  const [tone] = useState<string>('executive');
  const [slideCount] = useState<string>('auto');
  const [orientation] = useState<string>('horizontal');
  const [presentationType] = useState<string>('business_brief');
  const [audience] = useState<string>('general');
  const [narrativeStyle] = useState<string>('balanced');

  const isOutOfCredits = user.credits < 1;
  const hasPrompt = presentationRequest.trim().length > 0;
  const hasAttachment = Boolean(file) || sourceText.trim().length > 0 || sourceUrl.trim().length > 0;
  const canGenerate = !isOutOfCredits && !isLoading && (hasPrompt || hasAttachment);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setAttachmentMode('pdf');
      setIsAttachmentPanelOpen(false);
    }
  }, []);

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
    disabled: isOutOfCredits,
  } as any);

  const resizeTextarea = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 260)}px`;
  };

  const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPresentationRequest(event.target.value);
    resizeTextarea(event.target);
  };

  const buildSource = (): GenerationSource => {
    const prompt = presentationRequest.trim();

    if (file) {
      return { sourceType: 'pdf', file };
    }

    if (sourceUrl.trim()) {
      return { sourceType: 'url', sourceUrl: sourceUrl.trim() };
    }

    const notes = sourceText.trim();
    const combinedText = [
      prompt && `Presentation request:\n${prompt}`,
      notes && `Attached notes:\n${notes}`,
    ].filter(Boolean).join('\n\n');

    return { sourceType: 'text', sourceText: combinedText || prompt };
  };

  const handleSubmit = () => {
    if (!canGenerate) return;

    onGenerate(
      buildSource(),
      theme,
      theme === 'custom' ? customSettings : undefined,
      graphicStyle,
      tone,
      slideCount,
      orientation,
      presentationType,
      audience,
      narrativeStyle,
      presentationRequest.trim()
    );
  };

  const attachmentLabel = file
    ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`
    : sourceUrl.trim()
      ? sourceUrl.trim()
      : sourceText.trim()
        ? `${sourceText.trim().slice(0, 56)}${sourceText.trim().length > 56 ? '…' : ''}`
        : '';

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 py-8">
      {isOutOfCredits && (
        <div className="mb-8 w-full rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base font-black text-red-950">
                <Zap className="h-5 w-5 text-red-600" />
                Out of Credits
              </h3>
              <p className="mt-1 text-xs font-bold text-red-900/70">
                You have used all your credits for this cycle. Generation will unlock when credits reset.
              </p>
            </div>
            <span className="self-start rounded-full bg-red-100 px-3.5 py-2 text-[10px] font-black uppercase text-red-800 sm:self-auto">
              0 credits remaining
            </span>
          </div>
        </div>
      )}

      <header className="mb-8 max-w-3xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-3xl border border-lime-200 bg-lime-100 shadow-sm">
          <Sparkles className="h-6 w-6 text-lime-800" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-lime-950 sm:text-6xl">
          What do you want to present?
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base font-semibold text-lime-900/65 sm:text-lg">
          Start with a prompt, then attach a PDF, link, or notes.
        </p>
      </header>

      <section className="w-full max-w-4xl">
        <div
          {...getRootProps()}
          className={cn(
            'rounded-[2rem] border bg-white/90 p-3 shadow-xl shadow-lime-950/5 backdrop-blur transition-all',
            isDragActive ? 'border-lime-500 ring-4 ring-lime-500/10' : 'border-lime-200/80'
          )}
        >
          <input {...getInputProps()} />
          <textarea
            ref={textareaRef}
            value={presentationRequest}
            onChange={handlePromptChange}
            disabled={isOutOfCredits}
            rows={3}
            placeholder="Describe the presentation you need — audience, goal, tone, and any key points to emphasize."
            className="max-h-[260px] min-h-36 w-full resize-none rounded-[1.5rem] border-0 bg-lime-50/35 p-5 text-base font-semibold leading-relaxed text-lime-950 outline-none placeholder:text-lime-900/35 disabled:opacity-60 sm:text-lg"
          />

          {attachmentLabel && (
            <div className="mx-2 mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-lime-200 bg-lime-50 px-3 py-2 text-xs font-black text-lime-950 shadow-sm">
                <Paperclip className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{attachmentLabel}</span>
                <button
                  type="button"
                  onClick={() => { setFile(null); setSourceText(''); setSourceUrl(''); }}
                  className="rounded-full p-0.5 text-lime-900/45 hover:bg-lime-200/70 hover:text-lime-950"
                  aria-label="Remove attachment"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-3 px-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAttachmentPanelOpen((value) => !value)}
                disabled={isOutOfCredits}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-lime-200 bg-white text-lime-950 shadow-sm transition hover:bg-lime-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Add attachment"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled
                className="flex h-12 items-center gap-2 rounded-full border border-lime-100 bg-lime-50/70 px-4 text-xs font-black text-lime-900/35"
                title="Microphone input coming soon"
              >
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">Coming soon</span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canGenerate}
                className={cn(
                  'flex h-12 items-center gap-2 rounded-full px-5 text-sm font-black shadow-lg transition',
                  canGenerate
                    ? 'bg-lime-950 text-lime-50 shadow-lime-950/15 hover:bg-lime-900 hover:scale-[1.02] active:scale-[0.98]'
                    : 'cursor-not-allowed bg-gray-300 text-gray-500 shadow-none'
                )}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isLoading ? 'Generating' : 'Generate'}
              </button>
            </div>
            <p className="text-xs text-lime-900/60 font-semibold leading-relaxed max-w-3xl">
              Start with a primary prompt for the deck, then refine it with presentation type, audience, and narrative variation.
            </p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full">
            Primary prompt
          </span>
        </div>

        <div className="space-y-2">
          <label htmlFor="focus-prompt" className="text-xs font-black text-lime-950 uppercase tracking-wider">
            What should this Storyline focus on?
          </label>
          <textarea
            id="focus-prompt"
            value={focusPrompt}
            onChange={(event) => setFocusPrompt(event.target.value.slice(0, 900))}
            placeholder="Example: Focus on customer-facing outcomes, include a practical implementation roadmap, and avoid overly technical jargon."
            className="w-full min-h-40 p-4 border border-lime-200/80 rounded-3xl bg-lime-50/20 text-sm font-semibold text-lime-950 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 transition-all resize-y"
          />
          <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-lime-900/45">
            <span>Sent as the generation focus prompt</span>
            <span>{focusPrompt.length}/900</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="text-xs font-black text-lime-950 uppercase tracking-wider">Presentation Type</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              {PRESENTATION_TYPES.map((option) => {
                const isSelected = presentationType === option.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setAttachmentMode(mode.id)}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-black transition',
                      attachmentMode === mode.id ? 'bg-lime-950 text-lime-50' : 'bg-lime-50 text-lime-900/70 hover:bg-lime-100'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {mode.label}
                  </button>
                );
              })}
            </div>

            {attachmentMode === 'pdf' && (
              <button
                type="button"
                onClick={open}
                className="w-full rounded-2xl border border-dashed border-lime-300 bg-lime-50/40 p-5 text-center text-sm font-black text-lime-950 hover:bg-lime-50"
              >
                Click to attach a PDF or drop it onto the composer
              </button>
            )}
            {attachmentMode === 'url' && (
              <input
                type="url"
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="https://example.com/article"
                className="w-full rounded-2xl border border-lime-200 bg-lime-50/30 px-4 py-3 text-sm font-bold text-lime-950 outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20"
              />
            )}
            {attachmentMode === 'text' && (
              <textarea
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
                placeholder="Paste notes, transcript snippets, requirements, or source material."
                className="min-h-28 w-full resize-y rounded-2xl border border-lime-200 bg-lime-50/30 px-4 py-3 text-sm font-semibold text-lime-950 outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20"
              />
            )}
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setPresentationRequest(suggestion);
                window.requestAnimationFrame(() => textareaRef.current && resizeTextarea(textareaRef.current));
              }}
              className="rounded-full border border-lime-200 bg-white/80 px-4 py-2 text-xs font-black text-lime-900/75 shadow-sm hover:bg-lime-50 hover:text-lime-950"
            >
              {suggestion}
            </button>
          ))}
        </div>

      </div>

      <div className="flex justify-center mt-6">
        <button
          onClick={handleSubmit}
          disabled={!hasSource || isLoading || isOutOfCredits}
          className={cn(
            "px-10 py-4 rounded-full font-black text-lg text-lime-50 shadow-xl transition-all flex items-center justify-center min-w-[240px] cursor-pointer",
            !hasSource || isLoading || isOutOfCredits
              ? "bg-gray-400 cursor-not-allowed shadow-none" 
              : "bg-lime-950 hover:bg-lime-900 hover:scale-[1.02] active:scale-[0.98] shadow-lime-950/15"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Presentation'
          )}
        </button>
      </div>
      <div className="flex justify-center mt-2.5">
        <span className="text-[10px] font-black text-lime-900/50 uppercase tracking-wider">
          Deducts 1 credit • {user.credits} credits remaining
        </span>
      </div>
    </div>
  );
}
