import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { AnimatePresence, motion } from 'motion/react';
import {
  Briefcase,
  ChevronDown,
  FileText,
  Link as LinkIcon,
  Loader2,
  Monitor,
  Paperclip,
  Plus,
  Send,
  Settings,
  Sparkles,
  Upload,
  X,
  Zap,
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

const PRESENTATION_TYPES = [
  { id: 'business_brief', name: 'Business brief', desc: 'Clear decision-ready narrative' },
  { id: 'training', name: 'Training', desc: 'Teach concepts with practical examples' },
  { id: 'executive_update', name: 'Executive update', desc: 'Concise outcomes and risks' },
];

const AUDIENCES = [
  { id: 'general', name: 'General', desc: 'Balanced context and detail' },
  { id: 'executives', name: 'Executives', desc: 'Outcomes, metrics, implications' },
  { id: 'customers', name: 'Customers', desc: 'Benefits and approachable language' },
];

const NARRATIVE_STYLES = [
  { id: 'balanced', name: 'Balanced', desc: 'Informative and polished' },
  { id: 'story', name: 'Story-led', desc: 'Builds a memorable arc' },
  { id: 'action_plan', name: 'Action plan', desc: 'Prioritizes next steps' },
];

const GRAPHIC_STYLES = [
  { id: 'modern_infographic', name: 'Modern infographic', description: 'Data-forward visual cards', icon: Monitor },
  { id: 'clean_business', name: 'Clean business', description: 'Simple professional layouts', icon: Briefcase },
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
  const [graphicStyle, setGraphicStyle] = useState('modern_infographic');
  const [tone, setTone] = useState('executive');
  const [slideCount, setSlideCount] = useState('auto');
  const [orientation, setOrientation] = useState('horizontal');
  const [presentationType, setPresentationType] = useState('business_brief');
  const [audience, setAudience] = useState('general');
  const [narrativeStyle, setNarrativeStyle] = useState('balanced');
  const [focusPrompt, setFocusPrompt] = useState('');
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const isOutOfCredits = user.credits < 1;
  const hasPrompt = presentationRequest.trim().length > 0;
  const hasAttachment = Boolean(file) || sourceText.trim().length > 0 || sourceUrl.trim().length > 0;
  const canGenerate = !isOutOfCredits && !isLoading && (hasPrompt || hasAttachment);

  const clearAttachment = () => {
    setFile(null);
    setSourceText('');
    setSourceUrl('');
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      clearAttachment();
      setFile(acceptedFiles[0]);
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
    if (file) return `${file.name} · ${formatFileSize(file.size)}`;
    if (sourceText.trim()) return `Pasted text · ${formatNumber(sourceText.trim().length)} characters`;
    if (sourceUrl.trim()) return sourceUrl.trim();
    return '';
  }, [file, sourceText, sourceUrl]);

  const resizeTextarea = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 260)}px`;
  };

  const buildSource = (): GenerationSource => {
    const prompt = presentationRequest.trim();
    if (file) return { sourceType: 'pdf', file };
    if (sourceUrl.trim()) return { sourceType: 'url', sourceUrl: sourceUrl.trim() };
    const notes = sourceText.trim();
    const combinedText = [prompt && `Presentation request:\n${prompt}`, notes && `Attached notes:\n${notes}`].filter(Boolean).join('\n\n');
    return { sourceType: 'text', sourceText: combinedText || prompt };
  };

  const updateCustomSetting = <K extends keyof CustomizationSettings>(key: K, value: CustomizationSettings[K]) => {
    setCustomSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
    if (!canGenerate) return;
    onGenerate(buildSource(), theme, theme === 'custom' ? customSettings : undefined, graphicStyle, tone, slideCount, orientation, presentationType, audience, narrativeStyle, presentationRequest.trim());
  };

  const optionsSummary = `${PRESENTATION_TYPES.find((option) => option.id === presentationType)?.name ?? 'Business brief'} · ${AUDIENCES.find((option) => option.id === audience)?.name ?? 'General'} audience · ${slideCount === 'auto' ? 'Auto length' : `${slideCount} slides`} · ${THEMES.find((option) => option.id === theme)?.name ?? 'Lime Frost'}`;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 py-8">
      {isOutOfCredits && (
        <div className="mb-8 w-full rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-base font-black text-red-950"><Zap className="h-5 w-5 text-red-600" />Out of Credits</h3>
          <p className="mt-1 text-xs font-bold text-red-900/70">You have used all your credits for this cycle. Generation will unlock when credits reset.</p>
        </div>
      )}

      <header className="mb-8 max-w-3xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-3xl border border-lime-200 bg-lime-100 shadow-sm"><Sparkles className="h-6 w-6 text-lime-800" /></div>
        <h1 className="text-4xl font-black tracking-tight text-lime-950 sm:text-6xl">What do you want to present?</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base font-semibold text-lime-900/65 sm:text-lg">Start with a prompt, then attach a PDF, link, or notes.</p>
      </header>

      <section className="w-full max-w-4xl space-y-4">
        <div {...getRootProps()} className={cn('rounded-[2rem] border bg-white/90 p-3 shadow-xl shadow-lime-950/5 backdrop-blur transition-all', isDragActive ? 'border-lime-500 ring-4 ring-lime-500/10' : 'border-lime-200/80')}>
          <input {...getInputProps()} />
          <textarea ref={textareaRef} value={presentationRequest} onChange={(event) => { setPresentationRequest(event.target.value); resizeTextarea(event.target); }} disabled={isOutOfCredits} rows={3} placeholder="Describe the presentation you need — audience, goal, tone, and any key points to emphasize." className="max-h-[260px] min-h-36 w-full resize-none rounded-[1.5rem] border-0 bg-lime-50/35 p-5 text-base font-semibold leading-relaxed text-lime-950 outline-none placeholder:text-lime-900/35 disabled:opacity-60 sm:text-lg" />

          {attachmentLabel && (
            <div className="mx-2 mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-lime-200 bg-lime-50 px-3 py-2 text-xs font-black text-lime-950 shadow-sm">
                <Paperclip className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{attachmentLabel}</span>
                <button type="button" onClick={clearAttachment} className="rounded-full p-0.5 text-lime-900/45 hover:bg-lime-200/70 hover:text-lime-950" aria-label="Remove attachment"><X className="h-3.5 w-3.5" /></button>
              </span>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-3 px-1">
            <div className="relative">
              <button type="button" onClick={() => setIsAttachmentMenuOpen((value) => !value)} disabled={isOutOfCredits} className="flex h-12 w-12 items-center justify-center rounded-full border border-lime-200 bg-white text-lime-950 shadow-sm transition hover:bg-lime-50 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Add attachment" aria-expanded={isAttachmentMenuOpen}><Plus className="h-5 w-5" /></button>
              <AnimatePresence>
                {isAttachmentMenuOpen && (
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} className="absolute bottom-[calc(100%+0.75rem)] left-0 z-20 w-64 overflow-hidden rounded-3xl border border-lime-200 bg-white p-2 shadow-2xl shadow-lime-950/15">
                    <button type="button" onClick={() => { open(); setAttachmentMode('pdf'); }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-lime-50"><Upload className="h-4 w-4 text-lime-800" /><span><span className="block text-sm font-black text-lime-950">Upload PDF</span><span className="text-[10px] font-bold uppercase tracking-wider text-lime-900/45">Choose or drop a file</span></span></button>
                    <button type="button" onClick={() => { clearAttachment(); setAttachmentMode('text'); setIsAttachmentMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-lime-50"><FileText className="h-4 w-4 text-lime-800" /><span><span className="block text-sm font-black text-lime-950">Paste text</span><span className="text-[10px] font-bold uppercase tracking-wider text-lime-900/45">Use copied notes</span></span></button>
                    <button type="button" onClick={() => { clearAttachment(); setAttachmentMode('url'); setIsAttachmentMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-lime-50"><LinkIcon className="h-4 w-4 text-lime-800" /><span><span className="block text-sm font-black text-lime-950">Add link</span><span className="text-[10px] font-bold uppercase tracking-wider text-lime-900/45">Coming soon</span></span></button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button type="button" onClick={handleSubmit} disabled={!canGenerate} className={cn('flex h-12 items-center gap-2 rounded-full px-6 text-sm font-black text-lime-50 shadow-lg transition', canGenerate ? 'bg-lime-950 hover:bg-lime-900' : 'cursor-not-allowed bg-gray-400 shadow-none')}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{isLoading ? 'Generating...' : 'Generate'}</button>
          </div>
        </div>

        {attachmentMode === 'text' && !file && (
          <div className="rounded-3xl border border-lime-200/80 bg-white/95 p-4 shadow-sm">
            <label htmlFor="source-text" className="text-xs font-black uppercase tracking-wider text-lime-950">Pasted text</label>
            <textarea id="source-text" value={sourceText} onChange={(event) => { setSourceText(event.target.value); setSourceUrl(''); }} placeholder="Paste source text, notes, transcripts, or research here." className="mt-2 min-h-40 w-full resize-y rounded-2xl border border-lime-200/80 bg-lime-50/25 p-4 text-sm font-semibold text-lime-950 outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20" />
          </div>
        )}

        {attachmentMode === 'url' && !file && (
          <div className="rounded-3xl border border-lime-200/80 bg-white/95 p-4 shadow-sm">
            <label htmlFor="source-url" className="text-xs font-black uppercase tracking-wider text-lime-950">Add link</label>
            <input id="source-url" value={sourceUrl} onChange={(event) => { setSourceUrl(event.target.value); setSourceText(''); }} placeholder="https://example.com/report" disabled className="mt-2 w-full rounded-2xl border border-lime-200/80 bg-lime-50/40 p-4 text-sm font-semibold text-lime-950 outline-none disabled:opacity-70" />
            <p className="mt-2 text-xs font-bold text-lime-900/55">Link attachments are coming soon.</p>
          </div>
        )}

        <div className="rounded-3xl border border-lime-200/80 bg-white/95 p-4 shadow-sm backdrop-blur">
          <button type="button" onClick={() => setIsOptionsOpen((open) => !open)} className="flex w-full items-center justify-between gap-4 rounded-2xl px-2 py-1 text-left transition-colors hover:bg-lime-50/50" aria-expanded={isOptionsOpen}>
            <div className="min-w-0"><div className="flex items-center gap-2"><Settings className="h-5 w-5 text-lime-800" /><h2 className="text-xl font-black text-lime-950">Tune presentation</h2></div><p className="mt-1 truncate text-xs font-black uppercase tracking-wider text-lime-900/50">{optionsSummary}</p></div>
            <ChevronDown className={cn('h-5 w-5 text-lime-950 transition-transform', isOptionsOpen && 'rotate-180')} />
          </button>
          <AnimatePresence initial={false}>
            {isOptionsOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-5 grid gap-5 border-t border-lime-100 pt-5">
                  {[['Presentation type', PRESENTATION_TYPES, presentationType, setPresentationType], ['Audience', AUDIENCES, audience, setAudience], ['Narrative style', NARRATIVE_STYLES, narrativeStyle, setNarrativeStyle]].map(([label, options, value, setter]) => (
                    <section key={label as string} className="space-y-3"><h3 className="text-xs font-black uppercase tracking-wider text-lime-950">{label as string}</h3><div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">{(options as typeof PRESENTATION_TYPES).map((option) => <button key={option.id} type="button" onClick={() => (setter as React.Dispatch<React.SetStateAction<string>>)(option.id)} className={cn('rounded-2xl border p-3 text-left transition-all', value === option.id ? 'border-lime-700 bg-lime-50 text-lime-950 ring-1 ring-lime-500/25' : 'border-lime-100 bg-white text-lime-900/85 hover:border-lime-200')}><span className="block text-xs font-black">{option.name}</span><span className="mt-1 block text-[10px] font-semibold leading-normal text-lime-900/50">{option.desc}</span></button>)}</div></section>
                  ))}
                  <section className="space-y-3"><h3 className="text-xs font-black uppercase tracking-wider text-lime-950">Theme</h3><div className="grid grid-cols-2 gap-3 md:grid-cols-3">{THEMES.map((t) => <button key={t.id} type="button" onClick={() => setTheme(t.id)} className={cn('rounded-3xl border p-3 text-left shadow-sm transition-all', theme === t.id ? 'border-lime-950 bg-white ring-2 ring-lime-950 ring-offset-2' : 'border-lime-200/60 bg-white/70 hover:border-lime-300')}><div className={cn('mb-2 h-14 w-full rounded-2xl shadow-sm', t.colors)} /><h4 className="text-sm font-black text-lime-950">{t.name}</h4><p className="mt-1 text-[10px] font-bold leading-normal text-lime-900/60">{t.desc}</p></button>)}</div></section>
                  {theme === 'custom' && <section className="grid grid-cols-1 gap-4 rounded-3xl border border-lime-200 bg-lime-50/20 p-5 md:grid-cols-2"><select value={customSettings.fontFamily} onChange={(e) => updateCustomSetting('fontFamily', e.target.value)} className="rounded-2xl border border-lime-200 bg-white p-3 text-sm font-semibold"><option value="font-sans">Inter (Sans)</option><option value="font-mono">JetBrains (Mono)</option><option value="font-serif">Georgia (Serif)</option></select><select value={customSettings.alignment} onChange={(e) => updateCustomSetting('alignment', e.target.value as CustomizationSettings['alignment'])} className="rounded-2xl border border-lime-200 bg-white p-3 text-sm font-semibold"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select>{(['primaryColor', 'backgroundColor', 'textColor'] as const).map((key) => <input key={key} type="color" value={customSettings[key]} onChange={(e) => updateCustomSetting(key, e.target.value)} className="h-11 w-full rounded-xl border border-lime-200 bg-white" />)}</section>}
                  <section className="grid grid-cols-1 gap-6 md:grid-cols-2"><div className="space-y-2"><h3 className="text-xs font-black uppercase tracking-wider text-lime-950">Graphic style</h3>{GRAPHIC_STYLES.map((style) => { const Icon = style.icon; return <button key={style.id} type="button" onClick={() => setGraphicStyle(style.id)} className={cn('mb-2 flex w-full items-center gap-3 rounded-2xl border p-3 text-left', graphicStyle === style.id ? 'border-lime-700 bg-lime-50' : 'border-lime-100 bg-white')}><Icon className="h-4 w-4" /><span className="text-xs font-black">{style.name}</span></button>; })}</div><div className="space-y-2"><h3 className="text-xs font-black uppercase tracking-wider text-lime-950">Tone</h3>{TONES.map((toneOption) => { const Icon = toneOption.icon; return <button key={toneOption.id} type="button" onClick={() => setTone(toneOption.id)} className={cn('mb-2 flex w-full items-center gap-3 rounded-2xl border p-3 text-left', tone === toneOption.id ? 'border-lime-700 bg-lime-50' : 'border-lime-100 bg-white')}><Icon className="h-4 w-4" /><span className="text-xs font-black">{toneOption.name}</span></button>; })}</div></section>
                  <section className="grid grid-cols-1 gap-6 md:grid-cols-2"><div><h3 className="mb-2 text-xs font-black uppercase tracking-wider text-lime-950">Slide count</h3><div className="grid grid-cols-3 gap-2">{['auto', '3', '5', '8', '10', '15'].map((count) => <button key={count} type="button" onClick={() => setSlideCount(count)} className={cn('rounded-2xl border p-3 text-xs font-black', slideCount === count ? 'border-lime-700 bg-lime-50' : 'border-lime-100 bg-white')}>{count === 'auto' ? 'Auto' : count}</button>)}</div></div><div><h3 className="mb-2 text-xs font-black uppercase tracking-wider text-lime-950">Orientation</h3><div className="grid grid-cols-2 gap-2">{['horizontal', 'vertical'].map((item) => <button key={item} type="button" onClick={() => setOrientation(item)} className={cn('rounded-2xl border p-3 text-xs font-black capitalize', orientation === item ? 'border-lime-700 bg-lime-50' : 'border-lime-100 bg-white')}>{item}</button>)}</div></div></section>
                  <section className="space-y-2"><label htmlFor="focus-prompt" className="text-xs font-black uppercase tracking-wider text-lime-950">Custom focus prompt</label><textarea id="focus-prompt" value={focusPrompt} onChange={(event) => setFocusPrompt(event.target.value.slice(0, 900))} placeholder="Example: Focus on customer-facing outcomes and avoid technical jargon." className="min-h-24 w-full resize-y rounded-3xl border border-lime-200/80 bg-white p-4 text-sm font-semibold text-lime-950 outline-none" /></section>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-center mt-2.5"><span className="text-[10px] font-black text-lime-900/50 uppercase tracking-wider">Deducts 1 credit • {user.credits} credits remaining</span></div>
      </section>
    </div>
  );
}
