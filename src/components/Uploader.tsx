import React, { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Link as LinkIcon, Loader2, Paperclip, Plus, Send, Settings, Sparkles, Type, X } from 'lucide-react';
import { AuthUser, CustomizationSettings, GenerationSource, ThemeName } from '../types';
import { cn } from '../lib/utils';
import { THEMES } from '../lib/themes';
import { AUDIENCES, NARRATIVE_STYLES, PRESENTATION_TYPES, PROMPT_CHIPS, TONES } from '../lib/generationOptions';

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

const GRAPHIC_STYLES = [
  { id: 'modern_infographic', name: 'Modern Infographic' },
  { id: 'clean_strategy', name: 'Clean Strategy' },
  { id: 'bold_editorial', name: 'Bold Editorial' },
];

const SLIDE_COUNTS = [
  { id: 'auto', name: 'Auto' },
  { id: '6', name: '6 slides' },
  { id: '10', name: '10 slides' },
  { id: '15', name: '15 slides' },
];

const ORIENTATIONS = [
  { id: 'horizontal', name: 'Horizontal' },
  { id: 'vertical', name: 'Vertical' },
];

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function Uploader({ onGenerate, isLoading, user }: UploaderProps) {
  const [presentationRequest, setPresentationRequest] = useState('');
  const [attachmentMode, setAttachmentMode] = useState<AttachmentMode>('pdf');
  const [isAttachmentPanelOpen, setIsAttachmentPanelOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
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
    if (file) return `${file.name} (${formatFileSize(file.size)})`;
    if (sourceText.trim()) return `${sourceText.trim().length.toLocaleString()} characters of pasted text`;
    if (sourceUrl.trim()) return sourceUrl.trim();
    return '';
  }, [file, sourceText, sourceUrl]);

  const buildSource = (): GenerationSource => {
    if (file) return { sourceType: 'pdf', file };
    if (sourceText.trim()) return { sourceType: 'text', sourceText: sourceText.trim() };
    if (sourceUrl.trim()) return { sourceType: 'url', sourceUrl: sourceUrl.trim() };
    return { sourceType: 'text', sourceText: presentationRequest.trim() };
  };

  const handleChipClick = (chip: (typeof PROMPT_CHIPS)[number]) => {
    setPresentationRequest((current) => {
      const trimmed = current.trim();
      return trimmed ? `${trimmed}\n\n${chip.prompt}` : chip.prompt;
    });
    if (chip.defaults.presentationType) setPresentationType(chip.defaults.presentationType);
    if (chip.defaults.tone) setTone(chip.defaults.tone);
    if (chip.defaults.audience) setAudience(chip.defaults.audience);
    if (chip.defaults.narrativeStyle) setNarrativeStyle(chip.defaults.narrativeStyle);
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

  const renderOptionButtons = (options: { id: string; name: string; desc?: string }[], value: string, onChange: (id: string) => void) => (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
      {options.map((option) => {
        const isSelected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'rounded-2xl border p-3 text-left transition-all',
              isSelected
                ? 'border-rose-500 bg-rose-50/70 text-rose-950 ring-1 ring-rose-400/25'
                : 'border-lime-100 bg-white text-lime-900/85 hover:border-lime-200 hover:bg-lime-50/40'
            )}
          >
            <span className="block text-xs font-black">{option.name}</span>
            {option.desc && <span className="mt-1 block text-[10px] font-semibold leading-normal text-lime-900/50">{option.desc}</span>}
          </button>
        );
      })}
    </div>
  );

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

          <div className="mt-3 flex flex-wrap gap-2 px-1">
            {PROMPT_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleChipClick(chip)}
                disabled={isOutOfCredits}
                className="rounded-full border border-lime-200 bg-white/85 px-4 py-2 text-xs font-black text-lime-900/75 shadow-sm transition hover:bg-lime-50 hover:text-lime-950 disabled:cursor-not-allowed disabled:opacity-50"
                title={`Sets ${chip.defaults.presentationType ?? 'type'}, ${chip.defaults.tone ?? 'tone'}, ${chip.defaults.audience ?? 'audience'}, and ${chip.defaults.narrativeStyle ?? 'style'} defaults`}
              >
                {chip.label}
              </button>
            ))}
          </div>

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
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setIsAttachmentPanelOpen((value) => !value)} disabled={isOutOfCredits} className="flex h-12 w-12 items-center justify-center rounded-full border border-lime-200 bg-white text-lime-950 shadow-sm transition hover:bg-lime-50 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Add source">
                <Plus className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => setIsOptionsOpen((value) => !value)} className="flex h-12 items-center gap-2 rounded-full border border-lime-200 bg-white px-4 text-xs font-black text-lime-950 shadow-sm transition hover:bg-lime-50">
                <Settings className="h-4 w-4" /> Options
              </button>
            </div>
            <button type="button" onClick={handleSubmit} disabled={!canGenerate} className={cn('flex h-12 items-center gap-2 rounded-full px-5 text-sm font-black shadow-lg transition', canGenerate ? 'bg-lime-950 text-lime-50 shadow-lime-950/15 hover:scale-[1.02] hover:bg-lime-900 active:scale-[0.98]' : 'cursor-not-allowed bg-gray-300 text-gray-500 shadow-none')}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isLoading ? 'Generating' : 'Generate'}
            </button>
          </div>
        </div>

        {isAttachmentPanelOpen && (
          <div className="rounded-3xl border border-lime-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap gap-2">
              {([
                ['pdf', FileText, 'PDF'],
                ['text', Type, 'Text'],
                ['url', LinkIcon, 'URL'],
              ] as const).map(([mode, Icon, label]) => (
                <button key={mode} type="button" onClick={() => setAttachmentMode(mode)} className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-black', attachmentMode === mode ? 'border-lime-800 bg-lime-950 text-lime-50' : 'border-lime-200 bg-lime-50 text-lime-900')}>
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
            {attachmentMode === 'pdf' && <button type="button" onClick={open} className="w-full rounded-2xl border border-dashed border-lime-300 bg-lime-50/50 p-6 text-sm font-black text-lime-950">Choose or drop a PDF</button>}
            {attachmentMode === 'text' && <textarea value={sourceText} onChange={(event) => { setSourceText(event.target.value); setFile(null); setSourceUrl(''); }} placeholder="Paste source text here." className="min-h-36 w-full rounded-2xl border border-lime-200 bg-lime-50/40 p-4 text-sm font-semibold outline-none" />}
            {attachmentMode === 'url' && <input value={sourceUrl} onChange={(event) => { setSourceUrl(event.target.value); setFile(null); setSourceText(''); }} placeholder="https://example.com/source" className="w-full rounded-2xl border border-lime-200 bg-lime-50/40 p-4 text-sm font-semibold outline-none" />}
          </div>
        )}

        {isOptionsOpen && (
          <div className="grid grid-cols-1 gap-6 rounded-3xl border border-lime-200 bg-white p-5 shadow-sm lg:grid-cols-3">
            <div className="space-y-3"><h3 className="text-xs font-black uppercase tracking-wider text-lime-950">Presentation Type</h3>{renderOptionButtons(PRESENTATION_TYPES, presentationType, setPresentationType)}</div>
            <div className="space-y-3"><h3 className="text-xs font-black uppercase tracking-wider text-lime-950">Audience</h3>{renderOptionButtons(AUDIENCES, audience, setAudience)}</div>
            <div className="space-y-3"><h3 className="text-xs font-black uppercase tracking-wider text-lime-950">Narrative Style</h3>{renderOptionButtons(NARRATIVE_STYLES, narrativeStyle, setNarrativeStyle)}</div>
            <div className="space-y-3"><h3 className="text-xs font-black uppercase tracking-wider text-lime-950">Tone</h3>{renderOptionButtons(TONES, tone, setTone)}</div>
            <div className="space-y-3"><h3 className="text-xs font-black uppercase tracking-wider text-lime-950">Theme</h3>{renderOptionButtons(THEMES.map(({ id, name, desc }) => ({ id, name, desc })), theme, (id) => setTheme(id as ThemeName))}</div>
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-lime-950">Format</h3>
              <label className="block text-[10px] font-black uppercase tracking-wider text-lime-900/50">Graphic style</label>
              <select value={graphicStyle} onChange={(event) => setGraphicStyle(event.target.value)} className="w-full rounded-xl border border-lime-200 p-2 text-xs font-bold">
                {GRAPHIC_STYLES.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>
              <label className="block text-[10px] font-black uppercase tracking-wider text-lime-900/50">Slide count</label>
              <select value={slideCount} onChange={(event) => setSlideCount(event.target.value)} className="w-full rounded-xl border border-lime-200 p-2 text-xs font-bold">
                {SLIDE_COUNTS.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>
              <label className="block text-[10px] font-black uppercase tracking-wider text-lime-900/50">Orientation</label>
              <select value={orientation} onChange={(event) => setOrientation(event.target.value)} className="w-full rounded-xl border border-lime-200 p-2 text-xs font-bold">
                {ORIENTATIONS.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="flex justify-center pt-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-lime-900/50">Deducts 1 credit • {user.credits} credits remaining</span>
        </div>
      </section>
    </div>
  );
}
