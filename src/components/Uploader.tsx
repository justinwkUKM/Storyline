import React, { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FileText,
  Link as LinkIcon,
  Loader2,
  Paperclip,
  Plus,
  Send,
  Sparkles,
  Settings,
  Type,
  X,
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

export function Uploader({ onGenerate, isLoading, user }: UploaderProps) {
  const [presentationRequest, setPresentationRequest] = useState('');
  const [attachmentMode, setAttachmentMode] = useState<AttachmentMode>('pdf');
  const [isAttachmentPanelOpen, setIsAttachmentPanelOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sourceText, setSourceText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [theme, setTheme] = useState<ThemeName>('limefrost');
  const [customSettings, setCustomSettings] = useState<CustomizationSettings>(DEFAULT_CUSTOM_SETTINGS);
  const [graphicStyle, setGraphicStyle] = useState('modern_infographic');
  const [tone, setTone] = useState('executive');
  const [slideCount, setSlideCount] = useState('auto');
  const [orientation, setOrientation] = useState('horizontal');
  const [presentationType, setPresentationType] = useState('business_brief');
  const [audience, setAudience] = useState('general');
  const [narrativeStyle, setNarrativeStyle] = useState('balanced');
  const [focusPrompt, setFocusPrompt] = useState('');

  const isOutOfCredits = user.credits < 1;
  const hasSource = Boolean(file) || sourceText.trim().length > 0 || sourceUrl.trim().length > 0 || presentationRequest.trim().length > 0;
  const canGenerate = !isOutOfCredits && !isLoading && hasSource;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const [uploadedFile] = acceptedFiles;
    if (uploadedFile) {
      setFile(uploadedFile);
      setSourceText('');
      setSourceUrl('');
      setAttachmentMode('pdf');
      setIsAttachmentPanelOpen(false);
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
      focusPrompt.trim() || presentationRequest.trim()
    );
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
              ))}
            </div>

            {attachmentMode === 'pdf' && (
              <button type="button" onClick={open} className="w-full rounded-2xl border border-dashed border-lime-300 bg-lime-50/50 p-6 text-sm font-black text-lime-950">
                Choose a PDF or drag it onto the prompt box
              </button>
            )}
            {attachmentMode === 'text' && (
              <textarea
                value={sourceText}
                onChange={(event) => { setSourceText(event.target.value); setFile(null); setSourceUrl(''); }}
                rows={8}
                placeholder="Paste source text here. Storyline will use this text instead of a PDF."
                className="w-full resize-y rounded-2xl border border-lime-200 bg-lime-50/30 p-4 text-sm font-semibold text-lime-950 outline-none focus:border-lime-500"
              />
            )}
            {attachmentMode === 'url' && (
              <input
                value={sourceUrl}
                onChange={(event) => { setSourceUrl(event.target.value); setFile(null); setSourceText(''); }}
                placeholder="https://example.com/article"
                className="w-full rounded-2xl border border-lime-200 bg-lime-50/30 p-4 text-sm font-semibold text-lime-950 outline-none focus:border-lime-500"
              />
            )}
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

          {theme === 'custom' && (
            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-lime-100 pt-4 md:grid-cols-3">
              <input type="color" value={customSettings.primaryColor} onChange={(event) => updateCustomSetting('primaryColor', event.target.value)} aria-label="Primary color" />
              <input type="color" value={customSettings.backgroundColor} onChange={(event) => updateCustomSetting('backgroundColor', event.target.value)} aria-label="Background color" />
              <input type="color" value={customSettings.textColor} onChange={(event) => updateCustomSetting('textColor', event.target.value)} aria-label="Text color" />
            </div>
          )}
        </div>

        <div className="text-center text-[10px] font-black uppercase tracking-wider text-lime-900/50">
          Deducts 1 credit • {user.credits} credits remaining
        </div>
      </section>
    </div>
  );
}
