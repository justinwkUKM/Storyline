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
  ListPlus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SlideEditorProps {
  initialData: PresentationData;
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
  { id: 'modern', name: 'Modern Corporate', desc: 'Clean professional blue & slate theme', colors: 'bg-blue-600 text-slate-800' },
  { id: 'limefrost', name: 'Lime Frost', desc: 'Fresh minty lime and dark green tones', colors: 'bg-lime-500 text-lime-900' },
  { id: 'cosmic', name: 'Cosmic Slate', desc: 'Ambient futuristic dark mode styling', colors: 'bg-purple-600 text-slate-200 dark' },
  { id: 'minimal', name: 'High-Contrast Mono', desc: 'Swiss minimalist absolute dark & white', colors: 'bg-black text-black' },
  { id: 'custom', name: 'Custom Theme Builder', desc: 'Tailor colors, spacing, and layouts', colors: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' }
];

const GRAPHIC_TYPES: { id: 'process' | 'comparison' | 'metrics' | 'hierarchy' | 'pie'; name: string; desc: string }[] = [
  { id: 'process', name: 'Timeline / Process Steps', desc: 'Sequential horizontal or vertical progress' },
  { id: 'comparison', name: 'Meters / Comparisons', desc: 'Side-by-side statistical visual bars' },
  { id: 'metrics', name: 'Bento Stats Grid', desc: 'Beautiful modular metric callouts' },
  { id: 'hierarchy', name: 'Structural Tiers', desc: 'Pyramids, stacks, or structural maps' },
  { id: 'pie', name: 'Proportional Slices', desc: 'Circular ratio percentage metrics' }
];

export function SlideEditor({ initialData, onFinalise, onCancel }: SlideEditorProps) {
  const [data, setData] = useState<PresentationData>({
    ...initialData,
    slides: [...initialData.slides]
  });

  const [theme, setTheme] = useState<ThemeName>('modern');
  const [customSettings, setCustomSettings] = useState<CustomizationSettings>({
    fontFamily: 'font-sans',
    primaryColor: '#2563eb',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
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

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col">
      {/* 1. Sticky Header Bar */}
      <header className="sticky top-0 bg-white border-b border-gray-200 shadow-sm px-6 py-4 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Presentation Blueprint Editor</h1>
            <p className="text-xs text-gray-500 font-medium">Refine, structure, and customize your parsed deck before rendering the slideshow</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowRawTextPanel(!showRawTextPanel)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer",
              showRawTextPanel 
                ? "bg-slate-100 border-slate-300 text-slate-800" 
                : "bg-white hover:bg-gray-50 border-gray-200 text-gray-600"
            )}
          >
            <FileText className="w-4 h-4" />
            {showRawTextPanel ? 'Hide Source Text' : 'View Source Text'}
          </button>

          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-600 cursor-pointer transition-all"
          >
            Cancel
          </button>

          <button
            onClick={handleFinaliseClick}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Finalise & Present
          </button>
        </div>
      </header>

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
              className="border-r border-gray-200 bg-gray-50/50 flex flex-col h-[calc(100vh-73px)] min-w-[320px] max-w-[420px]"
            >
              <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-sm text-gray-900">Raw Extracted PDF Content</span>
                </div>
                {data.rawParsedText && (
                  <button
                    onClick={handleCopyRawText}
                    className="p-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 text-gray-500 transition-colors cursor-pointer"
                    title="Copy source text to clipboard"
                  >
                    {copiedRawText ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-5 font-mono text-xs text-gray-600 leading-relaxed whitespace-pre-wrap select-text">
                {data.rawParsedText ? (
                  data.rawParsedText
                ) : (
                  <p className="text-gray-400 italic text-center py-12 font-sans">No parsed text returned from this file.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PANEL B: Active Multi-slide Editor (Center Workspace) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 h-[calc(100vh-73px)]">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* 1. Global Presentation Title Card */}
            <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <label className="block text-xs font-extrabold uppercase tracking-widest text-gray-500">
                Overall Deck Title
              </label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                placeholder="E.g. Fiscal Analysis Q2 2026"
                className="w-full text-2xl font-extrabold text-gray-900 bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3 outline-none transition-all"
              />
            </div>

            {/* 2. Slide Cards List */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-500 px-1">
                Presentation Slides ({data.slides.length})
              </h3>

              {data.slides.map((slide, sIdx) => {
                const isExpanded = expandedSlideIndex === sIdx;
                const bulletCount = slide.content.length;

                return (
                  <div 
                    key={slide.id} 
                    className={cn(
                      "bg-white rounded-2xl border transition-all overflow-hidden",
                      isExpanded 
                        ? "border-blue-500/60 shadow-md ring-1 ring-blue-500/20" 
                        : "border-gray-200 hover:border-gray-300 shadow-sm"
                    )}
                  >
                    {/* Slide Header (Summary Bar) */}
                    <div 
                      onClick={() => setExpandedSlideIndex(isExpanded ? null : sIdx)}
                      className="flex items-center justify-between px-6 py-4 cursor-pointer select-none bg-white hover:bg-gray-50/50"
                    >
                      <div className="flex items-center gap-4 truncate pr-4">
                        <span className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-xs text-blue-600 flex-shrink-0">
                          {sIdx + 1}
                        </span>
                        <div className="truncate">
                          <h4 className="font-bold text-gray-900 text-sm leading-snug">{slide.title || '(Untitled Slide)'}</h4>
                          <p className="text-xs text-gray-400 mt-0.5 font-medium">
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
                          className="p-1.5 rounded-lg border border-transparent hover:border-gray-200 hover:bg-white text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-all cursor-pointer"
                          title="Move Slide Up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleMoveSlide(sIdx, 'down', e)}
                          disabled={sIdx === data.slides.length - 1}
                          className="p-1.5 rounded-lg border border-transparent hover:border-gray-200 hover:bg-white text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-all cursor-pointer"
                          title="Move Slide Down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>

                        <div className="w-px h-4 bg-gray-200 mx-1" />

                        {/* Remove button */}
                        <button
                          onClick={(e) => handleRemoveSlide(sIdx, e)}
                          className="p-1.5 rounded-lg border border-transparent hover:border-red-200 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all cursor-pointer"
                          title="Remove Slide"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="w-px h-4 bg-gray-200 mx-1" />

                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    {/* Slide Body (Forms & Editables) */}
                    {isExpanded && (
                      <div className="px-8 pb-8 pt-4 border-t border-gray-100 bg-gray-50/20 space-y-6">
                        
                        {/* Slide Title Input */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Slide Title</label>
                          <input
                            type="text"
                            value={slide.title}
                            onChange={(e) => updateSlideField(sIdx, 'title', e.target.value)}
                            placeholder="Slide Title"
                            className="w-full text-base font-bold text-gray-900 bg-white border border-gray-200 hover:border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2.5 outline-none transition-all"
                          />
                        </div>

                        {/* Slide Bullet points */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Bullet Points</label>
                            <button
                              type="button"
                              onClick={() => handleAddBullet(sIdx)}
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add Bullet
                            </button>
                          </div>

                          <div className="space-y-2">
                            {slide.content.map((point, pIdx) => (
                              <div key={pIdx} className="flex items-center gap-2 group">
                                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                <input
                                  type="text"
                                  value={point}
                                  onChange={(e) => handleUpdateBullet(sIdx, pIdx, e.target.value)}
                                  placeholder="Provide descriptive details"
                                  className="flex-1 text-sm text-gray-700 bg-white border border-gray-200 hover:border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2 outline-none transition-all"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBullet(sIdx, pIdx)}
                                  disabled={slide.content.length <= 1}
                                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer disabled:opacity-0"
                                  title="Delete point"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Slide Interactive Graphic customization */}
                        <div className="space-y-3 border border-gray-200/60 bg-white rounded-2xl p-5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <LayoutGrid className="w-4 h-4 text-indigo-600" />
                              <span className="font-bold text-xs text-gray-900 uppercase tracking-wider">Visual Diagram Block</span>
                            </div>

                            <select
                              value={slide.graphic?.type || 'none'}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'none') {
                                  updateSlideField(sIdx, 'graphic', undefined);
                                } else {
                                  const defaultGraphic: SlideGraphic = {
                                    type: val as any,
                                    title: slide.graphic?.title || 'Visual Graphic',
                                    elements: slide.graphic?.elements || [
                                      { label: 'Key Metric A', value: '85%', secondaryText: 'Core assessment value', percentage: 85 }
                                    ]
                                  };
                                  updateSlideField(sIdx, 'graphic', defaultGraphic);
                                }
                              }}
                              className="text-xs font-bold text-gray-700 border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
                            >
                              <option value="none">No Graphic (Text Only)</option>
                              <option value="metrics">Bento Metrics Grid</option>
                              <option value="process">Timeline / Process Steps</option>
                              <option value="comparison">Gauge Comparisons</option>
                              <option value="hierarchy">Structural Tiers</option>
                              <option value="pie">Radial Pie Slices</option>
                            </select>
                          </div>

                          {slide.graphic && (
                            <div className="space-y-4 pt-2 border-t border-gray-100">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Graphic Title</label>
                                  <input
                                    type="text"
                                    value={slide.graphic.title || ''}
                                    onChange={(e) => handleUpdateGraphicField(sIdx, 'title', e.target.value)}
                                    placeholder="Optional Title (e.g. Statistical Milestones)"
                                    className="w-full text-xs text-gray-700 bg-gray-50/50 border border-gray-100 rounded-lg px-3 py-2 outline-none"
                                  />
                                </div>
                                <div className="flex items-end justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleAddGraphicElement(sIdx)}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                                  >
                                    <ListPlus className="w-3.5 h-3.5" />
                                    Add Graphic Node
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-3 pt-2">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Graphic Elements / Nodes</label>
                                {slide.graphic.elements.map((el, elIdx) => (
                                  <div key={elIdx} className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-3 relative group">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveGraphicElement(sIdx, elIdx)}
                                      disabled={slide.graphic!.elements.length <= 1}
                                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 rounded-lg bg-transparent hover:bg-red-50 disabled:opacity-0 transition-all cursor-pointer"
                                      title="Delete Graphic Node"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
                                      <div>
                                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">Label</label>
                                        <input
                                          type="text"
                                          value={el.label}
                                          onChange={(e) => handleUpdateGraphicElement(sIdx, elIdx, 'label', e.target.value)}
                                          placeholder="Item/Stage Name"
                                          className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">Statistic / Value</label>
                                        <input
                                          type="text"
                                          value={el.value || ''}
                                          onChange={(e) => handleUpdateGraphicElement(sIdx, elIdx, 'value', e.target.value)}
                                          placeholder="E.g. Stage 1, $4.5M, 90%"
                                          className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pr-6">
                                      <div className="sm:col-span-2">
                                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">Secondary Text Description</label>
                                        <input
                                          type="text"
                                          value={el.secondaryText || ''}
                                          onChange={(e) => handleUpdateGraphicElement(sIdx, elIdx, 'secondaryText', e.target.value)}
                                          placeholder="Description or context details"
                                          className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">Percentage (0-100)</label>
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
                                          className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Slide Audience Interactive Quiz */}
                        <div className="space-y-3 border border-gray-200/60 bg-white rounded-2xl p-5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <HelpCircle className="w-4 h-4 text-amber-500" />
                              <span className="font-bold text-xs text-gray-900 uppercase tracking-wider">Audience Assessment Quiz</span>
                            </div>

                            {!slide.quiz ? (
                              <button
                                type="button"
                                onClick={() => handleAddQuizEntirely(sIdx)}
                                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                Add Audience Quiz
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRemoveQuizEntirely(sIdx)}
                                className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove Quiz
                              </button>
                            )}
                          </div>

                          {slide.quiz && (
                            <div className="space-y-4 pt-3 border-t border-gray-100">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Quiz Question</label>
                                <input
                                  type="text"
                                  value={slide.quiz.question}
                                  onChange={(e) => handleUpdateQuizField(sIdx, 'question', e.target.value)}
                                  placeholder="Enter quiz question"
                                  className="w-full text-xs text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none"
                                />
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Options (Select Radio for Correct Answer)</label>
                                  <button
                                    type="button"
                                    onClick={() => handleAddQuizOption(sIdx)}
                                    className="text-[10px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
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
                                      className="w-3.5 h-3.5 text-blue-600 cursor-pointer"
                                      title="Mark as correct answer"
                                    />
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => handleUpdateQuizOption(sIdx, oIdx, e.target.value)}
                                      placeholder={`Option ${oIdx + 1}`}
                                      className="flex-1 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-1.5 outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveQuizOption(sIdx, oIdx)}
                                      disabled={slide.quiz!.options.length <= 2}
                                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer disabled:opacity-0"
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
                        <div className="space-y-3 border border-gray-200/60 bg-white rounded-2xl p-5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <LinkIcon className="w-4 h-4 text-blue-500" />
                              <span className="font-bold text-xs text-gray-900 uppercase tracking-wider">Supporting Documentation & Links</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddLink(sIdx)}
                              className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add Resource Link
                            </button>
                          </div>

                          {slide.links && slide.links.length > 0 && (
                            <div className="space-y-3 pt-3 border-t border-gray-100">
                              {slide.links.map((link, lIdx) => (
                                <div key={lIdx} className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100 relative group">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLink(sIdx, lIdx)}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                                    title="Delete Link"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pr-8">
                                    <div>
                                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">Link Label / Title</label>
                                      <input
                                        type="text"
                                        value={link.title}
                                        onChange={(e) => handleUpdateLink(sIdx, lIdx, 'title', e.target.value)}
                                        placeholder="E.g. Department Financial Portal"
                                        className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">Destination URL</label>
                                      <input
                                        type="url"
                                        value={link.url}
                                        onChange={(e) => handleUpdateLink(sIdx, lIdx, 'url', e.target.value)}
                                        placeholder="https://example.com"
                                        className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Embedded Video Resource */}
                        <div className="space-y-2 border border-gray-200/60 bg-white rounded-2xl p-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <Video className="w-4 h-4 text-rose-500" />
                            <span className="font-bold text-xs text-gray-900 uppercase tracking-wider">Embedded YouTube Video URL</span>
                          </div>
                          <input
                            type="url"
                            value={slide.videoUrl || ''}
                            onChange={(e) => updateSlideField(sIdx, 'videoUrl', e.target.value || undefined)}
                            placeholder="E.g. https://www.youtube.com/embed/dQw4w9WgXcQ"
                            className="w-full text-xs text-gray-700 bg-white border border-gray-200 focus:border-blue-500 rounded-xl px-4 py-2.5 outline-none transition-all"
                          />
                          <p className="text-[10px] text-gray-400 font-medium">Specify a YouTube embedded URL (must contain `/embed/`) to present a supplementary video player directly on the slide.</p>
                        </div>

                        {/* Presenter Speaker Notes */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Presenter / Speaker Notes</label>
                          <textarea
                            value={slide.speakerNotes || ''}
                            onChange={(e) => updateSlideField(sIdx, 'speakerNotes', e.target.value)}
                            placeholder="Provide details to assist the presenter during the delivery..."
                            rows={3}
                            className="w-full text-xs text-gray-700 bg-white border border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 outline-none transition-all resize-y font-medium"
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
              className="w-full py-5 border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/20 text-gray-400 hover:text-blue-600 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Add New Custom Slide
            </button>

          </div>
        </div>

        {/* PANEL C: Sidebar Styling & Presets Builder (Right Panel) */}
        <div className="w-[30%] border-l border-gray-200 bg-white flex flex-col h-[calc(100vh-73px)] min-w-[340px] max-w-[440px] overflow-y-auto p-6 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Settings className="w-4.5 h-4.5 text-blue-600 animate-spin-slow" />
            <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Theme & Graphics Stylist</h3>
          </div>

          {/* 1. Theme selection presets */}
          <div className="space-y-3">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500">
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
                        ? "border-blue-600 bg-blue-50/30 ring-1 ring-blue-500/20 shadow-sm" 
                        : "border-gray-100 hover:border-gray-200 bg-gray-50/10 hover:bg-gray-50/40"
                    )}
                  >
                    <div className={cn("w-5 h-5 rounded-full border border-white/20 shadow-inner flex-shrink-0 mt-0.5", t.colors)} />
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                        {t.name}
                        {isSelected && <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-bold">Selected</span>}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-medium leading-relaxed">{t.desc}</p>
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
              className="p-5 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-4 shadow-inner"
            >
              <div className="flex items-center gap-1.5 pb-2 border-b border-gray-200/50">
                <Palette className="w-4 h-4 text-pink-600" />
                <span className="font-extrabold text-xs text-gray-800 uppercase tracking-wider">Custom Style Properties</span>
              </div>

              {/* Font Family selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                  <FontIcon className="w-3 h-3" />
                  Typography pairing
                </label>
                <select
                  value={customSettings.fontFamily}
                  onChange={(e) => setCustomSettings({ ...customSettings, fontFamily: e.target.value })}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white outline-none cursor-pointer"
                >
                  {FONTS.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              {/* Spacing alignment */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Alignment</label>
                  <select
                    value={customSettings.alignment}
                    onChange={(e) => setCustomSettings({ ...customSettings, alignment: e.target.value as any })}
                    className="w-full text-xs border border-gray-200 rounded-xl px-2.5 py-2 bg-white outline-none cursor-pointer"
                  >
                    <option value="left">Left Aligned</option>
                    <option value="center">Centered</option>
                    <option value="right">Right Aligned</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Gutter Spacing</label>
                  <select
                    value={customSettings.spacing}
                    onChange={(e) => setCustomSettings({ ...customSettings, spacing: e.target.value as any })}
                    className="w-full text-xs border border-gray-200 rounded-xl px-2.5 py-2 bg-white outline-none cursor-pointer"
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
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Theme Colors</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 mb-1 truncate text-center">Primary</label>
                    <div className="flex flex-col items-center gap-1.5">
                      <input
                        type="color"
                        value={customSettings.primaryColor}
                        onChange={(e) => setCustomSettings({ ...customSettings, primaryColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                      <span className="font-mono text-[9px] text-gray-400 uppercase">{customSettings.primaryColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 mb-1 truncate text-center">Background</label>
                    <div className="flex flex-col items-center gap-1.5">
                      <input
                        type="color"
                        value={customSettings.backgroundColor}
                        onChange={(e) => setCustomSettings({ ...customSettings, backgroundColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200"
                      />
                      <span className="font-mono text-[9px] text-gray-400 uppercase">{customSettings.backgroundColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 mb-1 truncate text-center">Text / Ink</label>
                    <div className="flex flex-col items-center gap-1.5">
                      <input
                        type="color"
                        value={customSettings.textColor}
                        onChange={(e) => setCustomSettings({ ...customSettings, textColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200"
                      />
                      <span className="font-mono text-[9px] text-gray-400 uppercase">{customSettings.textColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick Preview Slide text card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 mt-auto">
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-slate-600" />
              <span className="font-bold text-[11px] text-slate-700 uppercase tracking-widest">Rendering Live Summary</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
              Clicking <strong className="text-emerald-700 font-bold">Finalise & Present</strong> combines your edited slide configurations, custom graphic templates, and selected theme palette to spawn a presentation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
