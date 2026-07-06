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
  Layers,
  Monitor,
  ChevronDown
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
  const [theme, setTheme] = useState<ThemeName>('limefrost');
  const [customSettings, setCustomSettings] = useState<CustomizationSettings>(DEFAULT_CUSTOM_SETTINGS);
  const [graphicStyle, setGraphicStyle] = useState<string>('modern_infographic');
  const [tone, setTone] = useState<string>('executive');
  const [slideCount, setSlideCount] = useState<string>('auto');
  const [orientation, setOrientation] = useState<string>('horizontal');
  const [presentationType, setPresentationType] = useState<string>('business_brief');
  const [audience, setAudience] = useState<string>('general');
  const [narrativeStyle, setNarrativeStyle] = useState<string>('balanced');
  const [focusPrompt, setFocusPrompt] = useState('');
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

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

  const selectedPresentationType = PRESENTATION_TYPES.find((option) => option.id === presentationType)?.name ?? 'Business Brief';
  const selectedAudience = AUDIENCES.find((option) => option.id === audience)?.name ?? 'General';
  const selectedTheme = THEMES.find((option) => option.id === theme)?.name ?? 'Limefrost';
  const selectedSlideCount = slideCount === 'auto' ? 'Auto length' : `${slideCount} slides`;
  const optionsSummary = `${selectedPresentationType} · ${selectedAudience} audience · ${selectedSlideCount} · ${selectedTheme}`;

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

        {/* Presentation Options Drawer */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-3xl border border-lime-200/80 bg-white/95 p-4 shadow-sm backdrop-blur">
            <button
              type="button"
              onClick={() => setIsOptionsOpen((open) => !open)}
              className="flex w-full items-center justify-between gap-4 rounded-2xl px-2 py-1 text-left transition-colors hover:bg-lime-50/50"
              aria-expanded={isOptionsOpen}
              aria-controls="presentation-options-drawer"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-lime-800" />
                  <h2 className="text-xl font-black text-lime-950">Tune presentation</h2>
                </div>
                <p className="mt-1 truncate text-xs font-black uppercase tracking-wider text-lime-900/50">
                  {optionsSummary}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 rounded-full border border-lime-200 bg-lime-50 px-3 py-2 text-xs font-black text-lime-950">
                Options
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOptionsOpen && "rotate-180")} />
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isOptionsOpen && (
                <motion.div
                  id="presentation-options-drawer"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-5 space-y-6 border-t border-lime-100 pt-5">
                    <section className="space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-lime-950">Presentation type</h3>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                        {PRESENTATION_TYPES.map((option) => {
                          const isSelected = presentationType === option.id;
                          return (
                            <button key={option.id} type="button" onClick={() => setPresentationType(option.id)} className={cn("rounded-2xl border p-3 text-left transition-all", isSelected ? "border-rose-500 bg-rose-50/70 text-rose-950 ring-1 ring-rose-400/25" : "border-lime-100 bg-white text-lime-900/85 hover:border-lime-200 hover:bg-lime-50/20")}>
                              <span className="block text-xs font-black">{option.name}</span>
                              <span className="mt-1 block text-[10px] font-semibold leading-normal text-lime-900/50">{option.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-lime-950">Audience</h3>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                        {AUDIENCES.map((option) => {
                          const isSelected = audience === option.id;
                          return (
                            <button key={option.id} type="button" onClick={() => setAudience(option.id)} className={cn("rounded-2xl border p-3 text-left transition-all", isSelected ? "border-cyan-600 bg-cyan-50/70 text-cyan-950 ring-1 ring-cyan-400/25" : "border-lime-100 bg-white text-lime-900/85 hover:border-lime-200 hover:bg-lime-50/20")}>
                              <span className="block text-xs font-black">{option.name}</span>
                              <span className="mt-1 block text-[10px] font-semibold leading-normal text-lime-900/50">{option.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-lime-950">Narrative style</h3>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                        {NARRATIVE_STYLES.map((option) => {
                          const isSelected = narrativeStyle === option.id;
                          return (
                            <button key={option.id} type="button" onClick={() => setNarrativeStyle(option.id)} className={cn("rounded-2xl border p-3 text-left transition-all", isSelected ? "border-violet-600 bg-violet-50/70 text-violet-950 ring-1 ring-violet-400/25" : "border-lime-100 bg-white text-lime-900/85 hover:border-lime-200 hover:bg-lime-50/20")}>
                              <span className="block text-xs font-black">{option.name}</span>
                              <span className="mt-1 block text-[10px] font-semibold leading-normal text-lime-900/50">{option.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-lime-950">Theme</h3>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        {THEMES.map((t) => (
                          <button key={t.id} type="button" onClick={() => setTheme(t.id)} className={cn("rounded-3xl border p-3 text-left shadow-sm transition-all", theme === t.id ? "border-lime-950 bg-white ring-2 ring-lime-950 ring-offset-2" : "border-lime-200/60 bg-white/70 hover:border-lime-300 hover:bg-white")}>
                            <div className={cn("mb-2 h-14 w-full rounded-2xl shadow-sm", t.colors)} />
                            <h4 className="text-sm font-black text-lime-950">{t.name}</h4>
                            <p className="mt-1 text-[10px] font-bold leading-normal text-lime-900/60">{t.description}</p>
                          </button>
                        ))}
                      </div>
                    </section>

                    <AnimatePresence>
                      {theme === 'custom' && (
                        <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="rounded-3xl border border-lime-200 bg-lime-50/20 p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                              <Settings className="h-5 w-5 text-lime-800" />
                              <h3 className="text-lg font-black text-lime-950">Custom theme settings</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div className="space-y-1.5"><label className="text-xs font-black uppercase tracking-wider text-lime-950">Font Family</label><select value={customSettings.fontFamily} onChange={(e) => updateCustomSetting('fontFamily', e.target.value)} className="w-full rounded-2xl border border-lime-200/80 bg-white p-3 text-sm font-semibold outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/25"><option value="font-sans">Inter (Sans)</option><option value="font-mono">JetBrains (Mono)</option><option value="font-serif">Georgia (Serif)</option></select></div>
                              <div className="space-y-1.5"><label className="text-xs font-black uppercase tracking-wider text-lime-950">Alignment</label><select value={customSettings.alignment} onChange={(e) => updateCustomSetting('alignment', e.target.value as any)} className="w-full rounded-2xl border border-lime-200/80 bg-white p-3 text-sm font-semibold outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/25"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></div>
                              {([['primaryColor', 'Primary Color (Accent)'], ['backgroundColor', 'Background Color'], ['textColor', 'Text Color']] as const).map(([key, label]) => (
                                <div key={key} className="space-y-1.5"><label className="text-xs font-black uppercase tracking-wider text-lime-950">{label}</label><div className="flex gap-2"><input type="color" value={customSettings[key]} onChange={(e) => updateCustomSetting(key, e.target.value)} className="h-11 w-12 cursor-pointer rounded-xl border border-lime-200/80 bg-white" /><input type="text" value={customSettings[key]} onChange={(e) => updateCustomSetting(key, e.target.value)} className="flex-1 rounded-2xl border border-lime-200/80 bg-white px-4 py-2 text-sm font-bold outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/25" /></div></div>
                              ))}
                              <div className="space-y-1.5"><label className="text-xs font-black uppercase tracking-wider text-lime-950">Spacing</label><div className="flex gap-1.5 rounded-2xl border border-lime-200/60 bg-white p-1">{['compact', 'normal', 'relaxed'].map(space => (<button key={space} type="button" onClick={() => updateCustomSetting('spacing', space as any)} className={cn("flex-1 rounded-xl px-2 py-1.5 text-xs font-bold capitalize transition-all", customSettings.spacing === space ? "border border-lime-200/30 bg-lime-50 text-lime-950 shadow-sm" : "text-lime-900/60 hover:bg-lime-50/50 hover:text-lime-950")}>{space}</button>))}</div></div>
                            </div>
                          </div>
                        </motion.section>
                      )}
                    </AnimatePresence>

                    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                      <div className="space-y-3"><h3 className="text-xs font-black uppercase tracking-wider text-lime-950">Graphic style</h3><div className="space-y-2.5">{GRAPHIC_STYLES.map((style) => { const Icon = style.icon; const isSelected = graphicStyle === style.id; return (<button key={style.id} type="button" onClick={() => setGraphicStyle(style.id)} className={cn("flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all", isSelected ? "border-lime-700 bg-lime-50/50 ring-1 ring-lime-500/20" : "border-lime-100 bg-white hover:border-lime-200 hover:bg-lime-50/20")}><div className={cn("shrink-0 rounded-xl border p-2 transition-colors", isSelected ? "border-lime-700 bg-lime-950 text-lime-50" : "border-lime-100 bg-lime-50 text-lime-700")}><Icon className="h-4 w-4" /></div><div><h4 className="text-xs font-black leading-snug text-lime-950">{style.name}</h4><p className="mt-1 text-[10px] font-semibold leading-normal text-lime-900/60">{style.description}</p></div></button>); })}</div></div>
                      <div className="space-y-3"><h3 className="text-xs font-black uppercase tracking-wider text-lime-950">Tone</h3><div className="space-y-2.5">{TONES.map((t) => { const Icon = t.icon; const isSelected = tone === t.id; return (<button key={t.id} type="button" onClick={() => setTone(t.id)} className={cn("flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all", isSelected ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500/20" : "border-lime-100 bg-white hover:border-lime-200 hover:bg-lime-50/20")}><div className={cn("shrink-0 rounded-xl border p-2 transition-colors", isSelected ? "border-indigo-700 bg-indigo-950 text-indigo-100" : "border-indigo-100/60 bg-indigo-50 text-indigo-700")}><Icon className="h-4 w-4" /></div><div><h4 className="text-xs font-black leading-snug text-lime-950">{t.name}</h4><p className="mt-1 text-[10px] font-semibold leading-normal text-lime-900/60">{t.description}</p></div></button>); })}</div></div>
                    </section>

                    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                      <div className="space-y-3"><h3 className="text-xs font-black uppercase tracking-wider text-lime-950">Slide count</h3><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[{ id: 'auto', name: 'Auto-Detect', desc: 'Optimal summaries' },{ id: '3', name: '3 Slides', desc: 'Ultra-condensed' },{ id: '5', name: '5 Slides', desc: 'Express brief' },{ id: '8', name: '8 Slides', desc: 'Standard deck' },{ id: '10', name: '10 Slides', desc: 'Comprehensive' },{ id: '15', name: '15 Slides', desc: 'In-depth analysis' }].map((option) => { const isSelected = slideCount === option.id; return (<button key={option.id} type="button" onClick={() => setSlideCount(option.id)} className={cn("rounded-2xl border p-3.5 text-center transition-all", isSelected ? "border-emerald-600 bg-emerald-50/40 font-black text-emerald-950 ring-1 ring-emerald-500/20" : "border-lime-100 bg-white text-lime-900/80 hover:border-lime-200 hover:bg-lime-50/20")}><span className="block text-xs font-black">{option.name}</span><span className="mt-1 block text-[9px] font-bold leading-none text-lime-900/40">{option.desc}</span></button>); })}</div></div>
                      <div className="space-y-3"><h3 className="text-xs font-black uppercase tracking-wider text-lime-950">Orientation</h3><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{[{ id: 'horizontal', name: 'Horizontal (Landscape)', desc: 'Standard 16:9 widescreen presentation layout' },{ id: 'vertical', name: 'Vertical (Portrait)', desc: 'Mobile-first 3:4 vertical stacked layout' }].map((option) => { const isSelected = orientation === option.id; return (<button key={option.id} type="button" onClick={() => setOrientation(option.id)} className={cn("rounded-2xl border p-4 text-left transition-all", isSelected ? "border-lime-700 bg-lime-50/50 font-black text-lime-950 ring-1 ring-lime-500/25" : "border-lime-100 bg-white text-lime-900/85 hover:border-lime-200 hover:bg-lime-50/20")}><span className="block text-sm font-black">{option.name}</span><span className="mt-1.5 block text-[10px] font-semibold leading-normal text-lime-900/50">{option.desc}</span></button>); })}</div></div>
                    </section>

                    <section className="space-y-2">
                      <label htmlFor="focus-prompt" className="text-xs font-black uppercase tracking-wider text-lime-950">
                        Custom focus prompt
                      </label>
                      <textarea
                        id="focus-prompt"
                        value={focusPrompt}
                        onChange={(event) => setFocusPrompt(event.target.value.slice(0, 900))}
                        placeholder="Example: Focus on customer-facing outcomes, include a practical implementation roadmap, and avoid overly technical jargon."
                        className="min-h-24 w-full resize-y rounded-3xl border border-lime-200/80 bg-white p-4 text-sm font-semibold text-lime-950 outline-none transition-all focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
                      />
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-lime-900/45">
                        <span>Used as extra generation guidance</span>
                        <span>{focusPrompt.length}/900</span>
                      </div>
                    </section>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="mx-auto mb-6 flex max-w-3xl items-center justify-center rounded-full border border-lime-200 bg-white/80 px-4 py-2 text-center text-xs font-black uppercase tracking-wider text-lime-900/55 shadow-sm">
        {optionsSummary}
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
