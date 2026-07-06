import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  UploadCloud, 
  File as FileIcon,
  FileText,
  Link as LinkIcon,
  Loader2, 
  Settings, 
  LayoutGrid, 
  TrendingUp, 
  Award, 
  Zap, 
  BookOpen, 
  Sparkles,
  Layers,
  Monitor,
  ChevronDown
} from 'lucide-react';
import { ThemeName, CustomizationSettings, AuthUser, GenerationSource } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

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

type SourceMode = GenerationSource['sourceType'];

const THEMES: { id: ThemeName; name: string; description: string; colors: string }[] = [
  { id: 'limefrost', name: 'Limefrost', description: 'Fresh, bold, and signature Storyline', colors: 'bg-lime-400 text-lime-950' },
  { id: 'modern', name: 'Modern', description: 'Clean and professional', colors: 'bg-blue-500 text-white' },
  { id: 'cosmic', name: 'Cosmic', description: 'Dark and elegant', colors: 'bg-slate-900 text-purple-400' },
  { id: 'minimal', name: 'Minimal', description: 'Black and white simplicity', colors: 'bg-white text-black border border-gray-200' },
  { id: 'sunset', name: 'Sunset', description: 'Warm amber, coral, and editorial contrast', colors: 'bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 text-white' },
  { id: 'ocean', name: 'Ocean', description: 'Cool cyan, teal, and deep navy focus', colors: 'bg-gradient-to-br from-cyan-300 via-teal-500 to-blue-950 text-white' },
  { id: 'lavender', name: 'Lavender', description: 'Soft violet surfaces with premium indigo accents', colors: 'bg-gradient-to-br from-violet-100 via-purple-300 to-indigo-500 text-indigo-950' },
  { id: 'rose', name: 'Rose', description: 'Editorial pink, cream, and burgundy tones', colors: 'bg-gradient-to-br from-rose-100 via-pink-300 to-rose-700 text-rose-950' },
  { id: 'custom', name: 'Custom', description: 'Fully personalized', colors: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white' }
];

const DEFAULT_CUSTOM_SETTINGS: CustomizationSettings = {
  fontFamily: 'font-sans',
  primaryColor: '#a3e635',
  backgroundColor: '#f7fee7',
  textColor: '#1a2e05',
  spacing: 'normal',
  alignment: 'left',
};

const GRAPHIC_STYLES = [
  { 
    id: 'modern_infographic', 
    name: 'Modern Infographic', 
    description: 'Timelines, progress gauges, and radial slices. Perfect for high-impact visual comparisons.',
    icon: TrendingUp
  },
  { 
    id: 'bento_minimal', 
    name: 'Bento Grid Layout', 
    description: 'Clean structured modules, bold metric callouts, and key-value boxes. Beautiful & spacious.',
    icon: LayoutGrid
  },
  { 
    id: 'executive_mono', 
    name: 'Executive & Technical Tiers', 
    description: 'Structured multi-layered blocks, process flows, and formal comparison meters.',
    icon: Award
  },
  {
    id: 'editorial_story',
    name: 'Editorial Storyboard',
    description: 'Magazine-like title cards, chapter pacing, pull quotes, and narrative section breaks.',
    icon: BookOpen
  },
  {
    id: 'data_report',
    name: 'Data-Heavy Report',
    description: 'Charts, benchmarks, KPI panels, and evidence-led analytical layouts.',
    icon: Layers
  },
  {
    id: 'workshop_canvas',
    name: 'Workshop Canvas',
    description: 'Facilitation-friendly boards, decision matrices, action plans, and audience prompts.',
    icon: Sparkles
  }
];

const TONES = [
  { 
    id: 'executive', 
    name: 'Executive Summary', 
    description: 'High-level, strategic, and punchy. Tailored for corporate briefings or quick overviews.',
    icon: Zap
  },
  { 
    id: 'academic', 
    name: 'Academic Deep-Dive', 
    description: 'Comprehensive, detailed text blocks, theoretical explanations, and complex quizzes.',
    icon: BookOpen
  },
  { 
    id: 'creative', 
    name: 'Creative Storyteller', 
    description: 'Narrative-driven pacing, custom comparison metaphors, and engaging quiz experiences.',
    icon: Sparkles
  },
  {
    id: 'sales',
    name: 'Sales Pitch',
    description: 'Persuasive, benefits-led, objection-aware language with clear calls to action.',
    icon: TrendingUp
  },
  {
    id: 'training',
    name: 'Training Module',
    description: 'Instructional pacing, learning objectives, checkpoints, and applied examples.',
    icon: BookOpen
  },
  {
    id: 'investor',
    name: 'Investor Narrative',
    description: 'Market-size framing, traction, risks, upside, and crisp financial storytelling.',
    icon: Award
  }
];

const PRESENTATION_TYPES = [
  { id: 'business_brief', name: 'Business Brief', desc: 'Decision-ready summary for stakeholders' },
  { id: 'sales_pitch', name: 'Sales Pitch', desc: 'Problem, value, proof, and next step' },
  { id: 'training_lesson', name: 'Training Lesson', desc: 'Learning objectives, examples, and checks' },
  { id: 'research_report', name: 'Research Report', desc: 'Evidence-first findings and implications' },
  { id: 'investor_update', name: 'Investor Update', desc: 'Performance, traction, risks, and outlook' },
  { id: 'workshop', name: 'Workshop', desc: 'Facilitated discussion and action planning' }
];

const AUDIENCES = [
  { id: 'general', name: 'General', desc: 'Accessible for mixed audiences' },
  { id: 'executives', name: 'Executives', desc: 'Strategy, risks, and decisions' },
  { id: 'technical', name: 'Technical', desc: 'Methods, systems, and tradeoffs' },
  { id: 'students', name: 'Students', desc: 'Explanatory and teachable' },
  { id: 'customers', name: 'Customers', desc: 'Benefits, proof, and clarity' }
];

const NARRATIVE_STYLES = [
  { id: 'balanced', name: 'Balanced', desc: 'Clear summary with supporting detail' },
  { id: 'problem_solution', name: 'Problem → Solution', desc: 'Pain, insight, answer, impact' },
  { id: 'before_after', name: 'Before → After', desc: 'Contrast current state with future state' },
  { id: 'playbook', name: 'Playbook', desc: 'Steps, roles, actions, and checkpoints' },
  { id: 'deep_dive', name: 'Deep Dive', desc: 'More context and evidence per slide' }
];

export function Uploader({ onGenerate, isLoading, user }: UploaderProps) {
  const [sourceMode, setSourceMode] = useState<SourceMode>('pdf');
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
  const hasSource =
    sourceMode === 'pdf'
      ? Boolean(file)
      : sourceMode === 'text'
      ? sourceText.trim().length > 0
      : sourceUrl.trim().length > 0;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isOutOfCredits
  } as any);

  const handleSubmit = () => {
    if (!hasSource || isLoading) return;

    const source: GenerationSource =
      sourceMode === 'pdf'
        ? { sourceType: 'pdf', file: file! }
        : sourceMode === 'text'
        ? { sourceType: 'text', sourceText: sourceText.trim() }
        : { sourceType: 'url', sourceUrl: sourceUrl.trim() };

    onGenerate(source, theme, theme === 'custom' ? customSettings : undefined, graphicStyle, tone, slideCount, orientation, presentationType, audience, narrativeStyle, focusPrompt);
  };

  const updateCustomSetting = <K extends keyof CustomizationSettings>(key: K, value: CustomizationSettings[K]) => {
    setCustomSettings(prev => ({ ...prev, [key]: value }));
  };

  const selectedPresentationType = PRESENTATION_TYPES.find((option) => option.id === presentationType)?.name ?? 'Business Brief';
  const selectedAudience = AUDIENCES.find((option) => option.id === audience)?.name ?? 'General';
  const selectedTheme = THEMES.find((option) => option.id === theme)?.name ?? 'Limefrost';
  const selectedSlideCount = slideCount === 'auto' ? 'Auto length' : `${slideCount} slides`;
  const optionsSummary = `${selectedPresentationType} · ${selectedAudience} audience · ${selectedSlideCount} · ${selectedTheme}`;

  return (
    <div className="max-w-6xl mx-auto px-6 py-4 w-full">
      {isOutOfCredits && (
        <div className="max-w-6xl mx-auto mb-8 bg-red-50 border border-red-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <h3 className="text-red-950 font-black text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-red-600 animate-bounce" />
              Out of Credits
            </h3>
            <p className="text-red-900/70 text-xs font-bold">
              You have used all your 100 credits for this cycle. Your credit allowance will reset to 100 on {new Date(new Date(user.creditsResetAt).setMonth(new Date(user.creditsResetAt).getMonth() + 1)).toLocaleDateString()}.
            </p>
          </div>
          <div className="text-[10px] font-black uppercase bg-red-100 text-red-800 px-3.5 py-2 rounded-full self-start sm:self-auto">
            Renew date: {new Date(new Date(user.creditsResetAt).setMonth(new Date(user.creditsResetAt).getMonth() + 1)).toLocaleDateString()}
          </div>
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-black text-lime-950 mb-4 tracking-tight">
          Turn sources into Storylines
        </h1>
        <p className="text-lg text-lime-900/70 max-w-2xl mx-auto font-semibold">
          Start with a PDF, pasted text, or a public webpage, then shape a bold, editable presentation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Source Input */}
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-xl font-black text-lime-950 flex items-center gap-2">
            1. Add Source
          </h2>
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-lime-200 bg-white/80 p-1.5">
            {[
              { id: 'pdf' as const, label: 'PDF', icon: FileIcon },
              { id: 'text' as const, label: 'Text', icon: FileText },
              { id: 'url' as const, label: 'Web', icon: LinkIcon },
            ].map((mode) => {
              const Icon = mode.icon;
              const isSelected = sourceMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSourceMode(mode.id)}
                  disabled={isOutOfCredits}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-black transition-all",
                    isSelected ? "bg-lime-950 text-lime-50 shadow-sm" : "text-lime-900/65 hover:bg-lime-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {mode.label}
                </button>
              );
            })}
          </div>
          {sourceMode === 'pdf' && (
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center h-72 cursor-pointer transition-all duration-300 shadow-sm",
                isOutOfCredits
                  ? "border-red-200 bg-red-50/15 cursor-not-allowed opacity-60"
                  : isDragActive
                  ? "border-lime-500 bg-lime-50/55"
                  : "border-lime-200 bg-white/70 hover:bg-lime-50/20 hover:border-lime-400",
                file && !isOutOfCredits && "border-emerald-400 bg-emerald-50/20 hover:border-emerald-500 hover:bg-emerald-50/30"
              )}
            >
              <input {...getInputProps()} />
              {isOutOfCredits ? (
                <div className="flex flex-col items-center text-red-900/50 p-4 text-center">
                  <UploadCloud className="w-12 h-12 mb-4 text-red-400/80" />
                  <p className="font-black text-sm text-red-950">Generation Locked</p>
                  <p className="text-xs font-bold mt-2 text-red-900/60">0 credits remaining for this cycle</p>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center text-emerald-800 w-full max-w-full overflow-hidden">
                  <FileIcon className="w-12 h-12 mb-4 text-emerald-600 animate-bounce flex-shrink-0" />
                  <p className="font-black text-center text-sm line-clamp-2 px-4 break-all w-full leading-snug">{file.name}</p>
                  <p className="text-xs font-bold opacity-75 mt-2 flex-shrink-0">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-lime-900/60">
                  <UploadCloud className="w-12 h-12 mb-4 text-lime-600/80" />
                  <p className="font-black text-center text-sm text-lime-950">Drag & drop your PDF here</p>
                  <p className="text-xs font-bold mt-2 text-lime-900/50">or click to browse files</p>
                </div>
              )}
            </div>
          )}
          {sourceMode === 'text' && (
            <div className="h-72 rounded-3xl border border-lime-200 bg-white/80 p-4 shadow-sm">
              <textarea
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
                disabled={isOutOfCredits}
                placeholder="Paste notes, meeting transcripts, article text, research excerpts, or a rough brief."
                className="h-full w-full resize-none rounded-2xl border border-lime-100 bg-lime-50/30 p-4 text-sm font-semibold leading-relaxed text-lime-950 outline-none transition-all placeholder:text-lime-900/35 focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 disabled:opacity-60"
              />
            </div>
          )}
          {sourceMode === 'url' && (
            <div className="h-72 rounded-3xl border border-lime-200 bg-white/80 p-5 shadow-sm flex flex-col justify-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-lime-100 border border-lime-200 flex items-center justify-center">
                <LinkIcon className="h-6 w-6 text-lime-800" />
              </div>
              <div>
                <label htmlFor="source-url" className="text-xs font-black uppercase tracking-wider text-lime-950">
                  Public webpage URL
                </label>
                <input
                  id="source-url"
                  type="url"
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  disabled={isOutOfCredits}
                  placeholder="https://example.com/article"
                  className="mt-2 w-full rounded-2xl border border-lime-200 bg-lime-50/30 px-4 py-3 text-sm font-bold text-lime-950 outline-none transition-all placeholder:text-lime-900/35 focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 disabled:opacity-60"
                />
              </div>
              <p className="text-xs font-semibold leading-relaxed text-lime-900/55">
                Works with public HTML pages. Private, local, login-only, or empty pages will return a clear error.
              </p>
            </div>
          )}
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
