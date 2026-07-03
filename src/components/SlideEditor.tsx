import React, { useState } from 'react';
import { PresentationData, ThemeName, CustomizationSettings, SlideContent, SlideGraphic, InteractiveQuiz, InteractiveLink } from '../types';
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Settings, 
  Sparkles, 
  Copy, 
  Check, 
  BookOpen, 
  HelpCircle, 
  Video, 
  Link as LinkIcon, 
  FileText, 
  LayoutGrid, 
  TrendingUp, 
  Award, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  Sliders,
  Type as FontIcon,
  Palette,
  Eye,
  PlusCircle,
  X,
  ListPlus,
  Save
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { HtmlBulletEditor } from './HtmlBulletEditor';
import { InteractiveGraphic } from './InteractiveGraphic';

interface SlideEditorProps {
  initialData: PresentationData;
  initialTheme?: ThemeName;
  initialCustomSettings?: CustomizationSettings;
  savedDeckId?: string | null;
  saveStatus?: string;
  onSave?: (data: PresentationData, theme: ThemeName, customSettings?: CustomizationSettings, saveAsNew?: boolean) => Promise<void>;
  onFinalise: (finalData: PresentationData, theme: ThemeName, customSettings?: CustomizationSettings) => void;
  onCancel: () => void;
}

const FONTS = [
  { id: 'font-sans', name: 'Inter (Sans)' },
  { id: 'font-mono', name: 'JetBrains Mono' },
  { id: 'font-serif', name: 'Lora (Editorial Serif)' },
  { id: 'font-display', name: 'Space Grotesk' }
];

const THEMES: { id: ThemeName; name: string; desc: string; colors: string }[] = [
  { id: 'limefrost', name: 'Lime Frost', desc: 'Fresh minty lime and dark green tones', colors: 'bg-lime-500 text-lime-900' },
  { id: 'modern', name: 'Modern Corporate', desc: 'Clean professional blue & slate theme', colors: 'bg-blue-600 text-slate-800' },
  { id: 'cosmic', name: 'Cosmic Slate', desc: 'Ambient futuristic dark mode styling', colors: 'bg-purple-600 text-slate-200 dark' },
  { id: 'minimal', name: 'High-Contrast Mono', desc: 'Swiss minimalist absolute dark & white', colors: 'bg-black text-black' },
  { id: 'custom', name: 'Custom Theme Builder', desc: 'Tailor colors, spacing, and layouts', colors: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' }
];

type GraphicType = 'process' | 'comparison' | 'metrics' | 'hierarchy' | 'pie';

const GRAPHIC_OPTIONS: Array<{
  id: GraphicType | 'none';
  name: string;
  desc: string;
  preview: SlideGraphic | null;
}> = [
  {
    id: 'none',
    name: 'Text Only',
    desc: 'Keep this slide focused on bullets and speaker notes.',
    preview: null
  },
  {
    id: 'metrics',
    name: 'Bento Stats Grid',
    desc: 'Key metrics in modular cards with a dashboard feel.',
    preview: {
      type: 'metrics',
      title: 'Performance Snapshot',
      style: 'dashboard',
      elements: [
        { label: 'Reach', value: '92%', percentage: 92, secondaryText: 'Audience coverage', icon: 'TrendingUp' },
        { label: 'Adoption', value: '78%', percentage: 78, secondaryText: 'Feature uptake', icon: 'Zap' },
        { label: 'Velocity', value: '3.2x', percentage: 68, secondaryText: 'Faster delivery', icon: 'Award' }
      ]
    }
  },
  {
    id: 'process',
    name: 'Timeline / Process Steps',
    desc: 'Sequential stages that explain a workflow or journey.',
    preview: {
      type: 'process',
      title: 'Delivery Flow',
      style: 'timeline',
      elements: [
        { label: 'Discover', value: '01', secondaryText: 'Read the source PDF', icon: 'BookOpen' },
        { label: 'Structure', value: '02', secondaryText: 'Build the deck outline', icon: 'LayoutGrid' },
        { label: 'Refine', value: '03', secondaryText: 'Edit the storyline', icon: 'Sliders' },
        { label: 'Present', value: '04', secondaryText: 'Play the final deck', icon: 'Presentation' }
      ]
    }
  },
  {
    id: 'comparison',
    name: 'Meters / Comparisons',
    desc: 'Side-by-side visual comparisons or tradeoffs.',
    preview: {
      type: 'comparison',
      title: 'Option Tradeoff',
      style: 'vs-card',
      elements: [
        { label: 'Current state', value: '42%', percentage: 42, secondaryText: 'Manual workflow' },
        { label: 'Storyline', value: '88%', percentage: 88, secondaryText: 'Automated deck generation' }
      ]
    }
  },
  {
    id: 'hierarchy',
    name: 'Structural Tiers',
    desc: 'Stacked or layered information architecture.',
    preview: {
      type: 'hierarchy',
      title: 'Operating Model',
      style: 'pyramid',
      elements: [
        { label: 'Strategy', value: 'North Star', secondaryText: 'Top-level direction' },
        { label: 'Workflow', value: 'Decks + Slides', secondaryText: 'Main operating layer' },
        { label: 'Detail', value: 'Bullet Points', secondaryText: 'Supporting evidence' }
      ]
    }
  },
  {
    id: 'pie',
    name: 'Proportional Slices',
    desc: 'Circular ratios for mix, share, or allocation.',
    preview: {
      type: 'pie',
      title: 'Allocation Mix',
      style: 'radial',
      elements: [
        { label: 'Research', value: '40%', percentage: 40, secondaryText: 'Source analysis' },
        { label: 'Writing', value: '35%', percentage: 35, secondaryText: 'AI draft shaping' },
        { label: 'Present', value: '25%', percentage: 25, secondaryText: 'Delivery polish' }
      ]
    }
  }
];

const GRAPHIC_TYPES = GRAPHIC_OPTIONS.filter((opt): opt is Extract<typeof opt, { id: GraphicType }> => opt.id !== 'none');

function cloneGraphic(graphic: SlideGraphic): SlideGraphic {
  return {
    ...graphic,
    elements: graphic.elements.map((el) => ({ ...el }))
  };
}

function getGraphicPreset(type: GraphicType) {
  return GRAPHIC_OPTIONS.find((option) => option.id === type) || GRAPHIC_OPTIONS[0];
}

function createGraphicForType(type: GraphicType, existing?: SlideGraphic): SlideGraphic {
  const preset = getGraphicPreset(type);
  if (!preset.preview) {
    return {
      type,
      title: existing?.title || 'Visual Graphic',
      elements: existing?.elements?.length
        ? existing.elements.map((el) => ({ ...el }))
        : [{ label: 'Key Point', value: '100%', secondaryText: 'Add supporting context', percentage: 100, icon: 'LayoutGrid' }]
    };
  }

  if (existing?.type === type) {
    return cloneGraphic(existing);
  }

  return cloneGraphic({
    ...preset.preview,
    title: existing?.title || preset.preview.title
  });
}

export function SlideEditor({
  initialData,
  initialTheme = 'limefrost',
  initialCustomSettings,
  savedDeckId,
  saveStatus,
  onSave,
  onFinalise,
  onCancel
}: SlideEditorProps) {
  const [data, setData] = useState<PresentationData>({
    ...initialData,
    slides: [...initialData.slides]
  });

  const [theme, setTheme] = useState<ThemeName>(initialTheme);
  const [customSettings, setCustomSettings] = useState<CustomizationSettings>(initialCustomSettings || {
    fontFamily: 'font-sans',
    primaryColor: '#a3e635',
    backgroundColor: '#f7fee7',
    textColor: '#1a2e05',
    spacing: 'normal',
    alignment: 'left'
  });

  const [copiedRawText, setCopiedRawText] = useState(false);
  const [expandedSlideIndex, setExpandedSlideIndex] = useState<number | null>(0);
  const [showRawTextPanel, setShowRawTextPanel] = useState(true);

  // Copy raw parsed text helper
  const handleCopyRawText = () => {
    if (data.rawParsedText) {
      navigator.clipboard.writeText(data.rawParsedText);
      setCopiedRawText(true);
      setTimeout(() => setCopiedRawText(false), 2000);
    }
  };

  // Slide management functions
  const updateSlideField = (index: number, field: keyof SlideContent, value: any) => {
    const updatedSlides = [...data.slides];
    updatedSlides[index] = {
      ...updatedSlides[index],
      [field]: value
    };
    setData({ ...data, slides: updatedSlides });
  };

  const handleAddSlide = () => {
    const newSlide: SlideContent = {
      id: `slide-custom-${Date.now()}`,
      title: 'New Key Concept',
      content: ['Introduce a major point here', 'Support it with concise data and statistics'],
      speakerNotes: 'Brief notes guiding the presenter through this point.',
      graphic: {
        type: 'metrics',
        title: 'Core Stat Grid',
        elements: [
          { label: 'Key Performance', value: '100%', secondaryText: 'Operational accuracy', percentage: 100, icon: 'Target' }
        ]
      }
    };
    const updatedSlides = [...data.slides, newSlide];
    setData({ ...data, slides: updatedSlides });
    setExpandedSlideIndex(updatedSlides.length - 1);
  };

  const handleRemoveSlide = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.slides.length <= 1) {
      alert("Your presentation must contain at least one slide.");
      return;
    }
    const updatedSlides = data.slides.filter((_, idx) => idx !== index);
    setData({ ...data, slides: updatedSlides });
    
    // Adjust currently expanded slide index
    if (expandedSlideIndex === index) {
      setExpandedSlideIndex(Math.max(0, index - 1));
    } else if (expandedSlideIndex !== null && expandedSlideIndex > index) {
      setExpandedSlideIndex(expandedSlideIndex - 1);
    }
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === data.slides.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updatedSlides = [...data.slides];
    const temp = updatedSlides[index];
    updatedSlides[index] = updatedSlides[targetIdx];
    updatedSlides[targetIdx] = temp;

    setData({ ...data, slides: updatedSlides });
    if (expandedSlideIndex === index) {
      setExpandedSlideIndex(targetIdx);
    } else if (expandedSlideIndex === targetIdx) {
      setExpandedSlideIndex(index);
    }
  };

  // Slide content helpers
  const handleUpdateBullet = (slideIdx: number, bulletIdx: number, value: string) => {
    const slide = data.slides[slideIdx];
    const updatedBullets = [...slide.content];
    updatedBullets[bulletIdx] = value;
    updateSlideField(slideIdx, 'content', updatedBullets);
  };

  const handleAddBullet = (slideIdx: number) => {
    const slide = data.slides[slideIdx];
    const updatedBullets = [...slide.content, 'New bullet point details'];
    updateSlideField(slideIdx, 'content', updatedBullets);
  };

  const handleRemoveBullet = (slideIdx: number, bulletIdx: number) => {
    const slide = data.slides[slideIdx];
    if (slide.content.length <= 1) return;
    const updatedBullets = slide.content.filter((_, idx) => idx !== bulletIdx);
    updateSlideField(slideIdx, 'content', updatedBullets);
  };

  // Graphic element helpers
  const handleUpdateGraphicField = (slideIdx: number, field: keyof SlideGraphic, value: any) => {
    const slide = data.slides[slideIdx];
    if (!slide.graphic) return;
    const updatedGraphic = {
      ...slide.graphic,
      [field]: value
    };
    updateSlideField(slideIdx, 'graphic', updatedGraphic);
  };

  const handleUpdateGraphicElement = (slideIdx: number, elIdx: number, key: string, val: any) => {
    const slide = data.slides[slideIdx];
    if (!slide.graphic) return;
    const updatedElements = [...slide.graphic.elements];
    updatedElements[elIdx] = {
      ...updatedElements[elIdx],
      [key]: val
    };
    handleUpdateGraphicField(slideIdx, 'elements', updatedElements);
  };

  const handleAddGraphicElement = (slideIdx: number) => {
    const slide = data.slides[slideIdx];
    if (!slide.graphic) return;
    const newElement = { label: 'New Element', value: '50%', secondaryText: 'Supporting metric', percentage: 50, icon: 'Cpu' };
    const updatedElements = [...slide.graphic.elements, newElement];
    handleUpdateGraphicField(slideIdx, 'elements', updatedElements);
  };

  const renderGraphicThumbnail = (type: GraphicType | 'none') => {
    if (type === 'none') {
      return (
        <div className="h-20 rounded-2xl border border-dashed border-lime-200 bg-white/70 p-3 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="h-2 rounded-full bg-lime-100 w-3/4" />
            <div className="h-2 rounded-full bg-lime-100 w-1/2" />
          </div>
          <div className="h-2 rounded-full bg-lime-100 w-2/3" />
        </div>
      );
    }

    if (type === 'process') {
      return (
        <div className="h-20 rounded-2xl border border-lime-200 bg-white/80 p-3 flex items-end gap-2">
          {[18, 28, 38, 24].map((height, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full rounded-full bg-lime-100 overflow-hidden" style={{ height: `${height}px` }}>
                <div className="h-full w-full bg-lime-500/90" />
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-lime-400" />
            </div>
          ))}
        </div>
      );
    }

    if (type === 'comparison') {
      return (
        <div className="h-20 rounded-2xl border border-lime-200 bg-white/80 p-3 flex items-center gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-2 rounded-full bg-lime-100 w-2/3" />
            <div className="h-5 rounded-full bg-lime-500/80 w-4/5" />
          </div>
          <div className="w-8 h-8 rounded-full border-2 border-lime-500 text-lime-700 flex items-center justify-center text-[10px] font-black">
            VS
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-2 rounded-full bg-lime-100 w-1/2 ml-auto" />
            <div className="h-5 rounded-full bg-lime-300 w-full" />
          </div>
        </div>
      );
    }

    if (type === 'hierarchy') {
      return (
        <div className="h-20 rounded-2xl border border-lime-200 bg-white/80 p-3 flex flex-col justify-end gap-1">
          <div className="h-3 rounded-xl bg-lime-100 w-full" />
          <div className="h-3 rounded-xl bg-lime-300 w-4/5 mx-auto" />
          <div className="h-3 rounded-xl bg-lime-500 w-2/3 mx-auto" />
        </div>
      );
    }

    return (
      <div className="h-20 rounded-2xl border border-lime-200 bg-white/80 p-3 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border-4 border-lime-100 border-t-lime-500" />
      </div>
    );
  };

  const handleRemoveGraphicElement = (slideIdx: number, elIdx: number) => {
    const slide = data.slides[slideIdx];
    if (!slide.graphic || slide.graphic.elements.length <= 1) return;
    const updatedElements = slide.graphic.elements.filter((_, idx) => idx !== elIdx);
    handleUpdateGraphicField(slideIdx, 'elements', updatedElements);
  };

  // Quiz helpers
  const handleUpdateQuizField = (slideIdx: number, field: keyof InteractiveQuiz, value: any) => {
    const slide = data.slides[slideIdx];
    const updatedQuiz = {
      ...(slide.quiz || { question: 'Key Question?', options: ['Option A', 'Option B'], correctAnswerIndex: 0 }),
      [field]: value
    };
    updateSlideField(slideIdx, 'quiz', updatedQuiz);
  };

  const handleUpdateQuizOption = (slideIdx: number, oIdx: number, value: string) => {
    const slide = data.slides[slideIdx];
    if (!slide.quiz) return;
    const updatedOptions = [...slide.quiz.options];
    updatedOptions[oIdx] = value;
    handleUpdateQuizField(slideIdx, 'options', updatedOptions);
  };

  const handleAddQuizOption = (slideIdx: number) => {
    const slide = data.slides[slideIdx];
    if (!slide.quiz) return;
    const updatedOptions = [...slide.quiz.options, `New Option`];
    handleUpdateQuizField(slideIdx, 'options', updatedOptions);
  };

  const handleRemoveQuizOption = (slideIdx: number, oIdx: number) => {
    const slide = data.slides[slideIdx];
    if (!slide.quiz || slide.quiz.options.length <= 2) return;
    const updatedOptions = slide.quiz.options.filter((_, idx) => idx !== oIdx);
    
    // Adjust correct answer index if needed
    let correctIdx = slide.quiz.correctAnswerIndex;
    if (correctIdx >= updatedOptions.length) {
      correctIdx = updatedOptions.length - 1;
    }
    
    const updatedQuiz = {
      ...slide.quiz,
      options: updatedOptions,
      correctAnswerIndex: correctIdx
    };
    updateSlideField(slideIdx, 'quiz', updatedQuiz);
  };

  const handleRemoveQuizEntirely = (slideIdx: number) => {
    updateSlideField(slideIdx, 'quiz', undefined);
  };

  const handleAddQuizEntirely = (slideIdx: number) => {
    const defaultQuiz: InteractiveQuiz = {
      question: 'Verify the audience understanding:',
      options: ['Correct Answer Option', 'Alternative Option B', 'Alternative Option C'],
      correctAnswerIndex: 0
    };
    updateSlideField(slideIdx, 'quiz', defaultQuiz);
  };

  // Links helpers
  const handleUpdateLink = (slideIdx: number, lIdx: number, key: keyof InteractiveLink, value: string) => {
    const slide = data.slides[slideIdx];
    if (!slide.links) return;
    const updatedLinks = [...slide.links];
    updatedLinks[lIdx] = {
      ...updatedLinks[lIdx],
      [key]: value
    };
    updateSlideField(slideIdx, 'links', updatedLinks);
  };

  const handleAddLink = (slideIdx: number) => {
    const slide = data.slides[slideIdx];
    const newLink = { title: 'Reference Article', url: 'https://example.com' };
    const updatedLinks = slide.links ? [...slide.links, newLink] : [newLink];
    updateSlideField(slideIdx, 'links', updatedLinks);
  };

  const handleRemoveLink = (slideIdx: number, lIdx: number) => {
    const slide = data.slides[slideIdx];
    if (!slide.links) return;
    const updatedLinks = slide.links.filter((_, idx) => idx !== lIdx);
    updateSlideField(slideIdx, 'links', updatedLinks.length > 0 ? updatedLinks : undefined);
  };

  // Form submit finalize
  const handleFinaliseClick = () => {
    // Basic verification
    if (!data.title || data.title.trim() === '') {
      alert("Please specify an overall presentation title.");
      return;
    }
    
    // Proceed
    onFinalise(data, theme, theme === 'custom' ? customSettings : undefined);
  };

  const handleSaveClick = async (saveAsNew = false) => {
    if (!onSave) return;
    if (!data.title || data.title.trim() === '') {
      alert("Please specify an overall presentation title.");
      return;
    }
    await onSave(data, theme, theme === 'custom' ? customSettings : undefined, saveAsNew);
  };

  return (
    <div className="w-full min-h-screen bg-lime-50/30 flex flex-col">
      {/* 1. Sticky Header Bar */}
      <header className="sticky top-0 bg-white/95 backdrop-blur border-b border-lime-200/80 shadow-sm px-6 py-4.5 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-lime-400 border border-lime-500/40 p-2.5 rounded-xl text-lime-950">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-lime-950 leading-tight tracking-tight">Storyline Blueprint Editor</h1>
            <p className="text-xs text-lime-900/60 font-semibold">Refine, structure, and customize your parsed deck before rendering the slideshow</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowRawTextPanel(!showRawTextPanel)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 border transition-all cursor-pointer",
              showRawTextPanel 
                ? "bg-lime-950 border-lime-950 text-lime-50 shadow-sm" 
                : "bg-white hover:bg-lime-50/30 border-lime-200/80 text-lime-950"
            )}
          >
            <FileText className="w-4 h-4" />
            {showRawTextPanel ? 'Hide Source Text' : 'View Source Text'}
          </button>

          <button
            onClick={onCancel}
            className="px-4 py-2 border border-lime-200/80 hover:bg-lime-50/30 rounded-full text-xs font-black text-lime-950 cursor-pointer transition-all"
          >
            Cancel
          </button>

          {onSave && (
            <>
              <button
                onClick={() => handleSaveClick(false)}
                className="px-4 py-2 border border-lime-200 bg-lime-50 hover:bg-lime-100 rounded-full text-xs font-black text-lime-900 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4 text-lime-700" />
                {savedDeckId ? 'Save' : 'Save Draft'}
              </button>
              {savedDeckId && (
                <button
                  onClick={() => handleSaveClick(true)}
                  className="px-4 py-2 border border-lime-200/80 hover:bg-lime-50/30 rounded-full text-xs font-black text-lime-950 cursor-pointer transition-all"
                >
                  Save As New
                </button>
              )}
            </>
          )}

          <button
            onClick={handleFinaliseClick}
            className="px-5 py-2.5 bg-lime-950 hover:bg-lime-900 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] text-lime-50 rounded-full text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-lime-950/10"
          >
            <Sparkles className="w-4 h-4 text-lime-300" />
            Finalise & Present
          </button>
        </div>
      </header>

      {saveStatus && (
        <div className="fixed top-[78px] right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg">
          {saveStatus}
        </div>
      )}

      {/* 2. Workspace Content Panels */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
        {/* PANEL A: Raw Output Extracted Text (Slideable Left Panel) */}
        <AnimatePresence initial={false}>
          {showRawTextPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '28%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="border-r border-lime-200 bg-white/40 backdrop-blur-sm flex flex-col h-[calc(100vh-73px)] min-w-[320px] max-w-[420px]"
            >
              <div className="p-4 border-b border-lime-150 bg-white/70 backdrop-blur flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-lime-700" />
                  <span className="font-black text-sm text-lime-950">Raw Extracted PDF Content</span>
                </div>
                {data.rawParsedText && (
                  <button
                    onClick={handleCopyRawText}
                    className="p-1.5 rounded-xl border border-lime-200 bg-white hover:bg-lime-50 text-lime-800 transition-colors cursor-pointer"
                    title="Copy source text to clipboard"
                  >
                    {copiedRawText ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-5 font-mono text-xs text-lime-900/80 leading-relaxed whitespace-pre-wrap select-text">
                {data.rawParsedText ? (
                  data.rawParsedText
                ) : (
                  <p className="text-lime-900/50 italic text-center py-12 font-sans">No parsed text returned from this file.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PANEL B: Active Multi-slide Editor (Center Workspace) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 h-[calc(100vh-73px)]">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* 1. Global Presentation Title Card */}
            <div className="p-6 bg-white rounded-3xl border border-lime-200 shadow-sm space-y-4">
              <label className="block text-xs font-black uppercase tracking-wider text-lime-800/80">
                Overall Deck Title
              </label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                placeholder="E.g. Fiscal Analysis Q2 2026"
                className="w-full text-2xl font-black text-lime-950 bg-lime-50/20 border border-lime-200/80 hover:border-lime-300 focus:border-lime-500 focus:bg-white rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-lime-500/10 transition-all"
              />
            </div>

            {/* 2. Slide Cards List */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-lime-800/80 px-1">
                Presentation Slides ({data.slides.length})</h3>

              {data.slides.map((slide, sIdx) => {
                const isExpanded = expandedSlideIndex === sIdx;
                const bulletCount = slide.content.length;

                return (
                  <div 
                    key={slide.id} 
                    className={cn(
                      "bg-white rounded-3xl border transition-all overflow-hidden shadow-sm",
                      isExpanded 
                        ? "border-lime-400 shadow-md ring-4 ring-lime-500/5" 
                        : "border-lime-200/80 hover:border-lime-300"
                    )}
                  >
                    {/* Slide Header (Summary Bar) */}
                    <div 
                      onClick={() => setExpandedSlideIndex(isExpanded ? null : sIdx)}
                      className="flex items-center justify-between px-6 py-4.5 cursor-pointer select-none bg-white hover:bg-lime-50/20 transition-colors"
                    >
                      <div className="flex items-center gap-4 truncate pr-4">
                        <span className="w-8 h-8 rounded-full bg-lime-50 border border-lime-100/80 flex items-center justify-center font-black text-xs text-lime-700 flex-shrink-0">
                          {sIdx + 1}
                        </span>
                        <div className="truncate">
                          <h4 className="font-black text-lime-950 text-sm leading-snug">{slide.title || '(Untitled Slide)'}</h4>
                          <p className="text-xs text-lime-900/60 mt-0.5 font-bold">
                            {bulletCount} point{bulletCount !== 1 && 's'} 
                            {slide.graphic ? ` • Interactive ${slide.graphic.type} graphic` : ''}
                            {slide.quiz ? ' • Interactive Quiz' : ''}
                          </p>
                        </div>
                      </div>

                      {/* Controls Area */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Order adjustment button */}
                        <button
                          onClick={(e) => handleMoveSlide(sIdx, 'up', e)}
                          disabled={sIdx === 0}
                          className="p-1.5 rounded-xl border border-lime-100 bg-white text-lime-900 disabled:opacity-20 transition-all cursor-pointer hover:bg-lime-50"
                          title="Move Slide Up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleMoveSlide(sIdx, 'down', e)}
                          disabled={sIdx === data.slides.length - 1}
                          className="p-1.5 rounded-xl border border-lime-100 bg-white text-lime-900 disabled:opacity-20 transition-all cursor-pointer hover:bg-lime-50"
                          title="Move Slide Down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>

                        <div className="w-px h-4 bg-lime-100 mx-1" />

                        {/* Remove button */}
                        <button
                          onClick={(e) => handleRemoveSlide(sIdx, e)}
                          className="p-1.5 rounded-xl border border-transparent hover:border-red-200 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all cursor-pointer"
                          title="Remove Slide"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="w-px h-4 bg-lime-100 mx-1" />

                        {isExpanded ? <ChevronUp className="w-4 h-4 text-lime-700" /> : <ChevronDown className="w-4 h-4 text-lime-700" />}
                      </div>
                    </div>

                    {/* Slide Body (Forms & Editables) */}
                    {isExpanded && (
                      <div className="px-8 pb-8 pt-6 border-t border-lime-100 bg-lime-50/10 space-y-6">
                        
                        {/* Slide Title Input */}
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-lime-800 uppercase tracking-wider">Slide Title</label>
                          <input
                            type="text"
                            value={slide.title}
                            onChange={(e) => updateSlideField(sIdx, 'title', e.target.value)}
                            placeholder="Slide Title"
                            className="w-full text-base font-bold text-lime-950 bg-white border border-lime-200/80 hover:border-lime-300 focus:border-lime-500 focus:ring-4 focus:ring-lime-500/10 rounded-2xl px-4 py-3 outline-none transition-all"
                          />
                        </div>

                        {/* Slide Bullet points */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-black text-lime-800 uppercase tracking-wider">Bullet Points</label>
                            <button
                              type="button"
                              onClick={() => handleAddBullet(sIdx)}
                              className="text-xs font-black text-lime-700 hover:text-lime-900 flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add Bullet
                            </button>
                          </div>

                          <div className="space-y-3">
                            {slide.content.map((point, pIdx) => (
                              <div key={pIdx} className="flex items-start gap-2 group">
                                <span className="w-2 h-2 rounded-full bg-lime-500 flex-shrink-0 mt-4.5" />
                                <div className="flex-1 min-w-0">
                                  <HtmlBulletEditor
                                    value={point}
                                    onChange={(newValue) => handleUpdateBullet(sIdx, pIdx, newValue)}
                                    placeholder="Provide descriptive details (supports HTML formatting)"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBullet(sIdx, pIdx)}
                                  disabled={slide.content.length <= 1}
                                  className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer disabled:opacity-0 mt-1"
                                  title="Delete point"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Slide Interactive Graphic customization */}
                        <div className="space-y-4 border border-lime-200 bg-white rounded-3xl p-6 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <LayoutGrid className="w-4 h-4 text-lime-700" />
                              <span className="font-black text-xs text-lime-950 uppercase tracking-wider">Visual Diagram Block</span>
                            </div>
                            {slide.graphic && (
                              <button
                                type="button"
                                onClick={() => updateSlideField(sIdx, 'graphic', undefined)}
                                className="text-xs font-black text-red-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove Graphic
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4 pt-3 border-t border-lime-100">
                            <div className="space-y-4">
                              <div className="rounded-3xl border border-lime-200 bg-lime-50/30 p-4">
                                <div className="flex items-center justify-between gap-2 mb-3">
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-wider text-lime-800/70">Live Preview</p>
                                    <p className="text-xs text-lime-900/50 font-semibold">This is the actual graphic used in presentation mode.</p>
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-wider rounded-full px-2.5 py-1 bg-white border border-lime-200 text-lime-800">
                                    {slide.graphic ? 'Actual graphic' : 'Template preview'}
                                  </span>
                                </div>
                                <div className="min-h-[260px] rounded-2xl bg-white border border-lime-200 p-3 overflow-hidden">
                                  {slide.graphic ? (
                                    <InteractiveGraphic
                                      graphic={slide.graphic}
                                      accentClass="bg-lime-500"
                                      isVerticalMode={false}
                                    />
                                  ) : (
                                    <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center px-8 text-lime-900/55">
                                      <LayoutGrid className="w-10 h-10 mb-4 text-lime-300" />
                                      <p className="text-sm font-black text-lime-900/80">Choose a visual diagram style to preview the graphic here.</p>
                                      <p className="text-xs mt-2 font-semibold leading-relaxed">
                                        The gallery below shows each template with a thumbnail, label, and summary.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {slide.graphic && (
                                <div className="space-y-4 pt-1">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[10px] font-black text-lime-800/60 uppercase tracking-wider mb-1">Graphic Title</label>
                                      <input
                                        type="text"
                                        value={slide.graphic.title || ''}
                                        onChange={(e) => handleUpdateGraphicField(sIdx, 'title', e.target.value)}
                                        placeholder="Optional Title (e.g. Statistical Milestones)"
                                        className="w-full text-xs text-lime-950 bg-lime-50/20 border border-lime-200/80 rounded-xl px-3.5 py-2.5 outline-none focus:border-lime-500"
                                      />
                                    </div>
                                    <div className="flex items-end justify-end">
                                      <button
                                        type="button"
                                        onClick={() => handleAddGraphicElement(sIdx)}
                                        className="text-xs font-black text-lime-700 hover:text-lime-900 flex items-center gap-1 cursor-pointer"
                                      >
                                        <ListPlus className="w-3.5 h-3.5" />
                                        Add Graphic Node
                                      </button>
                                    </div>
                                  </div>

                                  <div className="space-y-3 pt-2">
                                    <label className="block text-[10px] font-black text-lime-800/60 uppercase tracking-wider">Graphic Elements / Nodes</label>
                                    {slide.graphic.elements.map((el, elIdx) => (
                                      <div key={elIdx} className="p-4 bg-lime-50/10 border border-lime-200/50 rounded-2xl space-y-3 relative group">
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveGraphicElement(sIdx, elIdx)}
                                          disabled={slide.graphic!.elements.length <= 1}
                                          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 rounded-xl bg-transparent hover:bg-red-50 disabled:opacity-0 transition-all cursor-pointer"
                                          title="Delete Graphic Node"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
                                          <div>
                                            <label className="block text-[10px] font-semibold text-lime-950/70 mb-1">Label</label>
                                            <input
                                              type="text"
                                              value={el.label}
                                              onChange={(e) => handleUpdateGraphicElement(sIdx, elIdx, 'label', e.target.value)}
                                              placeholder="Item/Stage Name"
                                              className="w-full text-xs bg-white border border-lime-200/60 rounded-xl px-3 py-2 outline-none focus:border-lime-500"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[10px] font-semibold text-lime-950/70 mb-1">Statistic / Value</label>
                                            <input
                                              type="text"
                                              value={el.value || ''}
                                              onChange={(e) => handleUpdateGraphicElement(sIdx, elIdx, 'value', e.target.value)}
                                              placeholder="E.g. Stage 1, $4.5M, 90%"
                                              className="w-full text-xs bg-white border border-lime-200/60 rounded-xl px-3 py-2 outline-none focus:border-lime-500"
                                            />
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pr-6">
                                          <div className="sm:col-span-2">
                                            <label className="block text-[10px] font-semibold text-lime-950/70 mb-1">Secondary Text Description</label>
                                            <input
                                              type="text"
                                              value={el.secondaryText || ''}
                                              onChange={(e) => handleUpdateGraphicElement(sIdx, elIdx, 'secondaryText', e.target.value)}
                                              placeholder="Description or context details"
                                              className="w-full text-xs bg-white border border-lime-200/60 rounded-xl px-3 py-2 outline-none focus:border-lime-500"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[10px] font-semibold text-lime-950/70 mb-1">Percentage (0-100)</label>
                                            <input
                                              type="number"
                                              min="0"
                                              max="100"
                                              value={el.percentage !== undefined ? el.percentage : ''}
                                              onChange={(e) => {
                                                const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                                                handleUpdateGraphicElement(sIdx, elIdx, 'percentage', val);
                                              }}
                                              placeholder="E.g. 75"
                                              className="w-full text-xs bg-white border border-lime-200/60 rounded-xl px-3 py-2 outline-none focus:border-lime-500"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-wider text-lime-800/70">Graphic Gallery</p>
                                  <p className="text-xs text-lime-900/50 font-semibold">Pick a template with a thumbnail and short description.</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {GRAPHIC_OPTIONS.map((option) => {
                                  const isSelected = option.id === (slide.graphic?.type || 'none');
                                  return (
                                    <button
                                      key={option.id}
                                      type="button"
                                      onClick={() => {
                                        if (option.id === 'none') {
                                          updateSlideField(sIdx, 'graphic', undefined);
                                          return;
                                        }
                                        updateSlideField(sIdx, 'graphic', createGraphicForType(option.id, slide.graphic || undefined));
                                      }}
                                      className={cn(
                                        "text-left rounded-3xl border p-3 transition-all cursor-pointer shadow-sm hover:shadow-md",
                                        isSelected
                                          ? "border-lime-700 ring-2 ring-lime-500/15 bg-lime-50/60"
                                          : "border-lime-200 bg-white hover:border-lime-300"
                                      )}
                                    >
                                      {renderGraphicThumbnail(option.id)}
                                      <div className="mt-3">
                                        <div className="flex items-center justify-between gap-2">
                                          <h4 className="text-sm font-black text-lime-950 leading-tight">{option.name}</h4>
                                          {isSelected && (
                                            <span className="text-[9px] font-black uppercase tracking-wider rounded-full px-1.5 py-0.5 bg-lime-100 text-lime-900">
                                              Selected
                                            </span>
                                          )}
                                        </div>
                                        <p className="mt-1 text-[10px] leading-relaxed font-semibold text-lime-900/55">{option.desc}</p>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Slide Audience Interactive Quiz */}
                        <div className="space-y-4 border border-lime-200 bg-white rounded-3xl p-6 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <HelpCircle className="w-4 h-4 text-amber-500" />
                              <span className="font-black text-xs text-lime-950 uppercase tracking-wider">Audience Assessment Quiz</span>
                            </div>

                            {!slide.quiz ? (
                              <button
                                type="button"
                                onClick={() => handleAddQuizEntirely(sIdx)}
                                className="text-xs font-black text-amber-700 hover:text-amber-850 flex items-center gap-1 cursor-pointer"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                Add Audience Quiz
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRemoveQuizEntirely(sIdx)}
                                className="text-xs font-black text-red-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove Quiz
                              </button>
                            )}
                          </div>

                          {slide.quiz && (
                            <div className="space-y-4 pt-3 border-t border-gray-100">
                              <div>
                                <label className="block text-[10px] font-black text-lime-800/60 uppercase tracking-wider mb-1">Quiz Question</label>
                                <input
                                  type="text"
                                  value={slide.quiz.question}
                                  onChange={(e) => handleUpdateQuizField(sIdx, 'question', e.target.value)}
                                  placeholder="Enter quiz question"
                                  className="w-full text-xs text-lime-950 bg-white border border-lime-200/80 focus:border-lime-500 rounded-xl px-4 py-2.5 outline-none focus:ring-4 focus:ring-lime-500/5 transition-all"
                                />
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="block text-[10px] font-black text-lime-800/60 uppercase tracking-wider">Options (Select Radio for Correct Answer)</label>
                                  <button
                                    type="button"
                                    onClick={() => handleAddQuizOption(sIdx)}
                                    className="text-[10px] font-black text-amber-700 hover:text-amber-850 cursor-pointer"
                                  >
                                    + Add Option
                                  </button>
                                </div>

                                {slide.quiz.options.map((opt, oIdx) => (
                                  <div key={oIdx} className="flex items-center gap-2 group">
                                    <input
                                      type="radio"
                                      name={`slide-quiz-correct-${sIdx}`}
                                      checked={slide.quiz?.correctAnswerIndex === oIdx}
                                      onChange={() => handleUpdateQuizField(sIdx, 'correctAnswerIndex', oIdx)}
                                      className="w-3.5 h-3.5 text-lime-700 cursor-pointer"
                                      title="Mark as correct answer"
                                    />
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => handleUpdateQuizOption(sIdx, oIdx, e.target.value)}
                                      placeholder={`Option ${oIdx + 1}`}
                                      className="flex-1 text-xs text-lime-950 bg-white border border-lime-200/85 rounded-xl px-3 py-2 outline-none focus:border-lime-500"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveQuizOption(sIdx, oIdx)}
                                      disabled={slide.quiz!.options.length <= 2}
                                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer disabled:opacity-0"
                                      title="Delete option"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Interactive Supporting links & Resources */}
                        <div className="space-y-4 border border-lime-200 bg-white rounded-3xl p-6 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <LinkIcon className="w-4 h-4 text-lime-500" />
                              <span className="font-black text-xs text-lime-950 uppercase tracking-wider">Supporting Documentation & Links</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddLink(sIdx)}
                              className="text-xs font-black text-lime-700 hover:text-lime-850 flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add Resource Link
                            </button>
                          </div>

                          {slide.links && slide.links.length > 0 && (
                            <div className="space-y-3 pt-3 border-t border-lime-100">
                              {slide.links.map((link, lIdx) => (
                                <div key={lIdx} className="flex items-center gap-3 bg-lime-50/10 p-4 rounded-2xl border border-lime-200/55 relative group">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLink(sIdx, lIdx)}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                                    title="Delete Link"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pr-8">
                                    <div>
                                      <label className="block text-[10px] font-semibold text-lime-950/70 mb-1">Link Label / Title</label>
                                      <input
                                        type="text"
                                        value={link.title}
                                        onChange={(e) => handleUpdateLink(sIdx, lIdx, 'title', e.target.value)}
                                        placeholder="E.g. Department Financial Portal"
                                        className="w-full text-xs bg-white border border-lime-200/60 rounded-xl px-3 py-2 outline-none focus:border-lime-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-lime-950/70 mb-1">Destination URL</label>
                                      <input
                                        type="url"
                                        value={link.url}
                                        onChange={(e) => handleUpdateLink(sIdx, lIdx, 'url', e.target.value)}
                                        placeholder="https://example.com"
                                        className="w-full text-xs bg-white border border-lime-200/60 rounded-xl px-3 py-2 outline-none focus:border-lime-500"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Embedded Video Resource */}
                        <div className="space-y-3 border border-lime-200 bg-white rounded-3xl p-6 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <Video className="w-4 h-4 text-rose-500" />
                            <span className="font-black text-xs text-lime-950 uppercase tracking-wider">Embedded YouTube Video URL</span>
                          </div>
                          <input
                            type="url"
                            value={slide.videoUrl || ''}
                            onChange={(e) => updateSlideField(sIdx, 'videoUrl', e.target.value || undefined)}
                            placeholder="E.g. https://www.youtube.com/embed/dQw4w9WgXcQ"
                            className="w-full text-xs text-lime-950 bg-white border border-lime-200/80 focus:border-lime-500 focus:ring-4 focus:ring-lime-500/5 rounded-xl px-4 py-2.5 outline-none transition-all"
                          />
                          <p className="text-[10px] text-lime-900/50 font-bold">Specify a YouTube embedded URL (must contain `/embed/`) to present a supplementary video player directly on the slide.</p>
                        </div>

                        {/* Presenter Speaker Notes */}
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-lime-800 uppercase tracking-wider">Presenter / Speaker Notes</label>
                          <textarea
                            value={slide.speakerNotes || ''}
                            onChange={(e) => updateSlideField(sIdx, 'speakerNotes', e.target.value)}
                            placeholder="Provide details to assist the presenter during the delivery..."
                            rows={3}
                            className="w-full text-xs text-lime-950 bg-white border border-lime-200/85 focus:border-lime-500 focus:ring-4 focus:ring-lime-500/5 rounded-2xl px-4 py-3.5 outline-none transition-all resize-y font-semibold"
                          />
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Giant Add New Slide button */}
            <button
              onClick={handleAddSlide}
              className="w-full py-5 border-2 border-dashed border-lime-200/80 hover:border-lime-400 hover:bg-lime-50/20 text-lime-600/70 hover:text-lime-950 rounded-2xl flex items-center justify-center gap-2 font-black text-sm transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Add New Custom Slide
            </button>

          </div>
        </div>

        {/* PANEL C: Sidebar Styling & Presets Builder (Right Panel) */}
        <div className="w-[30%] border-l border-lime-200 bg-white flex flex-col h-[calc(100vh-73px)] min-w-[340px] max-w-[440px] overflow-y-auto p-6 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-lime-100">
            <Settings className="w-4.5 h-4.5 text-lime-700 animate-spin-slow" />
            <h3 className="font-black text-sm text-lime-950 uppercase tracking-wider">Theme & Graphics Stylist</h3>
          </div>

          {/* 1. Theme selection presets */}
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase tracking-wider text-lime-900/60">
              Active Visual Palette
            </label>
            <div className="flex flex-col gap-2.5">
              {THEMES.map((t) => {
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer",
                      isSelected 
                        ? "border-lime-700 bg-lime-50/30 ring-1 ring-lime-500/20 shadow-sm" 
                        : "border-lime-100 hover:border-lime-200 bg-white"
                    )}
                  >
                    <div className={cn("w-5 h-5 rounded-full border border-white/20 shadow-inner flex-shrink-0 mt-0.5", t.colors)} />
                    <div>
                      <h4 className="font-black text-lime-950 text-xs flex items-center gap-1.5">
                        {t.name}
                        {isSelected && <span className="text-[9px] bg-lime-200 text-lime-950 px-1.5 py-0.5 rounded-full font-black">Selected</span>}
                      </h4>
                      <p className="text-[10px] text-lime-900/50 mt-0.5 font-bold leading-relaxed">{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Custom Theme Fields (only shown if theme === 'custom') */}
          {theme === 'custom' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-5 bg-lime-50/20 rounded-3xl border border-lime-200 space-y-4 shadow-inner"
            >
              <div className="flex items-center gap-1.5 pb-2 border-b border-lime-100">
                <Palette className="w-4 h-4 text-pink-600" />
                <span className="font-black text-xs text-lime-950 uppercase tracking-wider">Custom Style Properties</span>
              </div>

              {/* Font Family selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-lime-800/60 uppercase tracking-wider flex items-center gap-1">
                  <FontIcon className="w-3 h-3" />
                  Typography pairing
                </label>
                <select
                  value={customSettings.fontFamily}
                  onChange={(e) => setCustomSettings({ ...customSettings, fontFamily: e.target.value })}
                  className="w-full text-xs border border-lime-200/80 rounded-xl px-3 py-2 bg-white outline-none cursor-pointer focus:border-lime-500"
                >
                  {FONTS.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              {/* Spacing alignment */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-lime-800/60 uppercase tracking-wider">Alignment</label>
                  <select
                    value={customSettings.alignment}
                    onChange={(e) => setCustomSettings({ ...customSettings, alignment: e.target.value as any })}
                    className="w-full text-xs border border-lime-200/80 rounded-xl px-2.5 py-2 bg-white outline-none cursor-pointer focus:border-lime-500"
                  >
                    <option value="left">Left Aligned</option>
                    <option value="center">Centered</option>
                    <option value="right">Right Aligned</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-lime-800/60 uppercase tracking-wider">Gutter Spacing</label>
                  <select
                    value={customSettings.spacing}
                    onChange={(e) => setCustomSettings({ ...customSettings, spacing: e.target.value as any })}
                    className="w-full text-xs border border-lime-200/80 rounded-xl px-2.5 py-2 bg-white outline-none cursor-pointer focus:border-lime-500"
                  >
                    <option value="compact">Compact (S)</option>
                    <option value="normal">Normal (M)</option>
                    <option value="relaxed">Relaxed (L)</option>
                  </select>
                </div>
              </div>

              {/* Hex Color pickers */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-lime-800/60 uppercase tracking-wider">Theme Colors</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[9px] font-black text-lime-950/70 mb-1 text-center truncate">Primary</label>
                    <div className="flex flex-col items-center gap-1.5">
                      <input
                        type="color"
                        value={customSettings.primaryColor}
                        onChange={(e) => setCustomSettings({ ...customSettings, primaryColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                      <span className="font-mono text-[9px] text-lime-900/50 uppercase">{customSettings.primaryColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-lime-950/70 mb-1 text-center truncate">Background</label>
                    <div className="flex flex-col items-center gap-1.5">
                      <input
                        type="color"
                        value={customSettings.backgroundColor}
                        onChange={(e) => setCustomSettings({ ...customSettings, backgroundColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-lime-200/80"
                      />
                      <span className="font-mono text-[9px] text-lime-900/50 uppercase">{customSettings.backgroundColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-lime-950/70 mb-1 text-center truncate">Text / Ink</label>
                    <div className="flex flex-col items-center gap-1.5">
                      <input
                        type="color"
                        value={customSettings.textColor}
                        onChange={(e) => setCustomSettings({ ...customSettings, textColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-lime-200/80"
                      />
                      <span className="font-mono text-[9px] text-lime-900/50 uppercase">{customSettings.textColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick Preview Slide text card */}
          <div className="p-5 bg-lime-950 text-lime-100/90 rounded-3xl mt-auto border border-lime-900 space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-lime-400" />
              <span className="font-black text-[11px] text-lime-400 uppercase tracking-wider">Rendering Live Summary</span>
            </div>
            <p className="text-[10px] leading-relaxed text-lime-100/70 font-semibold">
              Clicking <strong className="text-lime-300 font-black">Finalise & Present</strong> combines your edited slide configurations, custom graphic templates, and selected theme palette to spawn a presentation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
