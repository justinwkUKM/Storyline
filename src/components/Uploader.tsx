import React, { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { AnimatePresence, motion } from 'motion/react';
import {
  FileText,
  Link as LinkIcon,
  Loader2,
  Paperclip,
  Plus,
  Send,
  Settings,
  Sparkles,
  Settings,
  Type,
  X,
} from 'lucide-react';
import { AuthUser, CustomizationSettings, GenerationSource, ThemeName } from '../types';
import { cn } from '../lib/utils';
import { THEMES } from '../lib/themes';

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

type AttachmentMode = 'pdf' | 'text' | 'url';

const DEFAULT_CUSTOM_SETTINGS: CustomizationSettings = {
  fontFamily: 'font-sans',
  primaryColor: '#a3e635',
  backgroundColor: '#f7fee7',
  textColor: '#1a2e05',
  spacing: 'normal',
  alignment: 'left',
};

const THEMES: { id: ThemeName; name: string }[] = [
  { id: 'limefrost', name: 'Limefrost' },
  { id: 'modern', name: 'Modern' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'cosmic', name: 'Cosmic' },
  { id: 'sunset', name: 'Sunset' },
  { id: 'ocean', name: 'Ocean' },
  { id: 'lavender', name: 'Lavender' },
  { id: 'rose', name: 'Rose' },
  { id: 'custom', name: 'Custom' },
];

const PRESENTATION_TYPES = [
  { id: 'business_brief', name: 'Business Brief' },
  { id: 'sales_pitch', name: 'Sales Pitch' },
  { id: 'training_lesson', name: 'Training Lesson' },
  { id: 'research_report', name: 'Research Report' },
  { id: 'investor_update', name: 'Investor Update' },
  { id: 'workshop', name: 'Workshop' },
];

const AUDIENCES = [
  { id: 'general', name: 'General' },
  { id: 'executives', name: 'Executives' },
  { id: 'technical', name: 'Technical' },
  { id: 'students', name: 'Students' },
  { id: 'customers', name: 'Customers' },
];

const NARRATIVE_STYLES = [
  { id: 'balanced', name: 'Balanced' },
  { id: 'problem_solution', name: 'Problem/Solution' },
  { id: 'before_after', name: 'Before/After' },
  { id: 'playbook', name: 'Playbook' },
  { id: 'deep_dive', name: 'Deep Dive' },
];

const TONES = [
  { id: 'executive', name: 'Executive', description: 'Confident, concise, board-ready', icon: Briefcase },
  { id: 'friendly', name: 'Friendly', description: 'Warm and accessible', icon: Sparkles },
];

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

export function Uploader({ onGenerate, isLoading, user }: UploaderProps) {
  const [presentationRequest, setPresentationRequest] = useState('');
  const [attachmentMode, setAttachmentMode] = useState<AttachmentMode>('pdf');
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sourceText, setSourceText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [theme, setTheme] = useState<ThemeName>('limefrost');
  const [customSettings, setCustomSettings] = useState<CustomizationSettings>(DEFAULT_CUSTOM_SETTINGS);
  const [graphicStyle, setGraphicStyle] = useState<string>('modern_infographic');
  const [tone, setTone] = useState<string>('executive');
  const [slideCount, setSlideCount] = useState<string>('auto');
  const [orientation, setOrientation] = useState<string>('horizontal');
  const [presentationType, setPresentationType] = useState<string>('business_brief');
  const [audience, setAudience] = useState<string>('general');
  const [narrativeStyle, setNarrativeStyle] = useState<string>('balanced');

  const isOutOfCredits = user.credits < 1;
  const hasSource = Boolean(file) || sourceText.trim().length > 0 || sourceUrl.trim().length > 0 || presentationRequest.trim().length > 0;
  const canGenerate = !isOutOfCredits && !isLoading && hasSource;

  const clearAttachment = () => {
    setFile(null);
    setSourceText('');
    setSourceUrl('');
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const [uploadedFile] = acceptedFiles;
    if (uploadedFile) {
      setFile(uploadedFile);
      setSourceText('');
      setSourceUrl('');
      setAttachmentMode('pdf');
      setIsAttachmentMenuOpen(false);
    }
  }, []);

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
    disabled: isOutOfCredits,
  } as any);

  const attachmentLabel = useMemo(() => {
    if (file) return file.name;
    if (sourceText.trim()) return `${sourceText.trim().length.toLocaleString()} characters of pasted text`;
    if (sourceUrl.trim()) return sourceUrl.trim();
    return '';
  }, [file, sourceText, sourceUrl]);

  const clearAttachment = () => {
    setFile(null);
    setSourceText('');
    setSourceUrl('');
  };

  const buildSource = (): GenerationSource => {
    if (file) return { sourceType: 'pdf', file };
    if (sourceText.trim()) return { sourceType: 'text', sourceText: sourceText.trim() };
    if (sourceUrl.trim()) return { sourceType: 'url', sourceUrl: sourceUrl.trim() };
    return { sourceType: 'text', sourceText: presentationRequest.trim() };
  };

    const primaryPrompt = sourceMode === 'text' ? sourceText.trim() : '';

    onGenerate(source, theme, theme === 'custom' ? customSettings : undefined, graphicStyle, tone, slideCount, orientation, presentationType, audience, narrativeStyle, primaryPrompt);
  };

  const updateCustomSetting = <K extends keyof CustomizationSettings>(key: K, value: CustomizationSettings[K]) => {
    setCustomSettings((settings) => ({ ...settings, [key]: value }));
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 py-8">
      <header className="mb-8 max-w-3xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-3xl border border-lime-200 bg-lime-100 shadow-sm">
          <Sparkles className="h-6 w-6 text-lime-800" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-lime-950 sm:text-6xl">What do you want to present?</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base font-semibold text-lime-900/65 sm:text-lg">
          Start with a prompt, then attach a PDF, link, or pasted text.
        </p>
      </header>

      {isOutOfCredits && (
        <div className="mb-8 w-full rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-900 shadow-sm">
          You have used all your credits for this cycle. Generation will unlock when credits reset.
        </div>
      )}

      <section className="w-full max-w-4xl space-y-4">
        <div
          {...getRootProps()}
          className={cn(
            'rounded-[2rem] border bg-white/90 p-3 shadow-xl shadow-lime-950/5 backdrop-blur transition-all',
            isDragActive ? 'border-lime-500 ring-4 ring-lime-500/10' : 'border-lime-200/80'
          )}
        >
          <input {...getInputProps()} />
          <textarea
            value={presentationRequest}
            onChange={(event) => setPresentationRequest(event.target.value)}
            disabled={isOutOfCredits}
            rows={4}
            placeholder="Describe the presentation you need — audience, goal, tone, and any key points to emphasize."
            className="min-h-36 w-full resize-y rounded-[1.5rem] border-0 bg-lime-50/35 p-5 text-base font-semibold leading-relaxed text-lime-950 outline-none placeholder:text-lime-900/35 disabled:opacity-60 sm:text-lg"
          />

          {attachmentLabel && (
            <div className="mx-2 mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-lime-200 bg-lime-50 px-3 py-2 text-xs font-black text-lime-950 shadow-sm">
                <Paperclip className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{attachmentLabel}</span>
                <button type="button" onClick={clearAttachment} className="rounded-full p-0.5 text-lime-900/45 hover:bg-lime-200/70 hover:text-lime-950" aria-label="Remove attachment">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1">
            <button
              type="button"
              onClick={() => setIsAttachmentPanelOpen((value) => !value)}
              disabled={isOutOfCredits}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-lime-200 bg-white text-lime-950 shadow-sm transition hover:bg-lime-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Add source"
            >
              <Plus className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canGenerate}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black text-lime-50 shadow-lg transition',
                canGenerate ? 'bg-lime-950 hover:bg-lime-900' : 'cursor-not-allowed bg-gray-400 shadow-none'
              )}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isLoading ? 'Generating...' : 'Generate Presentation'}
            </button>
          </div>
        </div>

        {isAttachmentPanelOpen && (
          <div className="rounded-3xl border border-lime-200 bg-white p-4 shadow-sm">
            <div className="mb-4 grid grid-cols-3 gap-2">
              {([
                { id: 'pdf', label: 'PDF', icon: FileText },
                { id: 'text', label: 'Text', icon: Type },
                { id: 'url', label: 'URL', icon: LinkIcon },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAttachmentMode(id)}
                  className={cn('flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black', attachmentMode === id ? 'border-lime-800 bg-lime-50 text-lime-950' : 'border-lime-100 text-lime-900/65')}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Presentation Type, Audience, and Narrative Variation */}
      <div className="space-y-6 p-6 bg-white/95 backdrop-blur rounded-3xl border border-lime-200/80 shadow-sm mb-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-rose-600" />
              <h2 className="text-xl font-black text-lime-950">7. Presentation Focus</h2>
            </div>
            <p className="text-xs text-lime-900/60 font-semibold leading-relaxed max-w-3xl">
              Shape what Gemini emphasizes before it creates the deck. Pick a presentation type, audience, and narrative variation.
            </p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full">
            Optional direction
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="text-xs font-black text-lime-950 uppercase tracking-wider">Presentation Type</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              {PRESENTATION_TYPES.map((option) => {
                const isSelected = presentationType === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPresentationType(option.id)}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all cursor-pointer",
                      isSelected
                        ? "border-rose-500 bg-rose-50/70 ring-1 ring-rose-400/25 text-rose-950"
                        : "border-lime-100 bg-white hover:bg-lime-50/20 hover:border-lime-200 text-lime-900/85"
                    )}
                  >
                    <span className="block text-xs font-black">{option.name}</span>
                    <span className="block text-[10px] text-lime-900/50 mt-1 font-semibold leading-normal">{option.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-lime-200/80 bg-white/95 p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-lime-950">
            <Settings className="h-5 w-5" />
            <h2 className="text-lg font-black">Tune presentation</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="text-xs font-black uppercase text-lime-950">Type
              <select value={presentationType} onChange={(event) => setPresentationType(event.target.value)} className="mt-1 w-full rounded-2xl border border-lime-200 p-3 text-sm normal-case">
                {PRESENTATION_TYPES.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-black uppercase text-lime-950">Audience
              <select value={audience} onChange={(event) => setAudience(event.target.value)} className="mt-1 w-full rounded-2xl border border-lime-200 p-3 text-sm normal-case">
                {AUDIENCES.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-black uppercase text-lime-950">Theme
              <select value={theme} onChange={(event) => setTheme(event.target.value as ThemeName)} className="mt-1 w-full rounded-2xl border border-lime-200 p-3 text-sm normal-case">
                {THEMES.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-black uppercase text-lime-950">Tone
              <select value={tone} onChange={(event) => setTone(event.target.value)} className="mt-1 w-full rounded-2xl border border-lime-200 p-3 text-sm normal-case">
                {['executive', 'academic', 'creative', 'sales', 'training', 'investor'].map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="text-xs font-black uppercase text-lime-950">Slides
              <select value={slideCount} onChange={(event) => setSlideCount(event.target.value)} className="mt-1 w-full rounded-2xl border border-lime-200 p-3 text-sm normal-case">
                {['auto', '3', '5', '8', '10', '15'].map((option) => <option key={option} value={option}>{option === 'auto' ? 'Auto' : option}</option>)}
              </select>
            </label>
            <label className="text-xs font-black uppercase text-lime-950">Orientation
              <select value={orientation} onChange={(event) => setOrientation(event.target.value)} className="mt-1 w-full rounded-2xl border border-lime-200 p-3 text-sm normal-case">
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
              </select>
            </label>
            <label className="text-xs font-black uppercase text-lime-950 md:col-span-3">Narrative style
              <select value={narrativeStyle} onChange={(event) => setNarrativeStyle(event.target.value)} className="mt-1 w-full rounded-2xl border border-lime-200 p-3 text-sm normal-case">
                {NARRATIVE_STYLES.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-black uppercase text-lime-950 md:col-span-3">Custom focus prompt
              <textarea value={focusPrompt} onChange={(event) => setFocusPrompt(event.target.value.slice(0, 900))} className="mt-1 min-h-20 w-full rounded-2xl border border-lime-200 p-3 text-sm normal-case" />
            </label>
          </div>

      </div>

        <div className="text-center text-[10px] font-black uppercase tracking-wider text-lime-900/50">
          Deducts 1 credit • {user.credits} credits remaining
        </div>
      </section>
    </div>
  );
}
