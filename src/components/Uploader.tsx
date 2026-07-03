import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  UploadCloud, 
  File, 
  Loader2, 
  Settings, 
  LayoutGrid, 
  TrendingUp, 
  Award, 
  Zap, 
  BookOpen, 
  Sparkles,
  Layers,
  Monitor
} from 'lucide-react';
import { ThemeName, CustomizationSettings } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface UploaderProps {
  onGenerate: (
    file: File, 
    theme: ThemeName, 
    customSettings?: CustomizationSettings, 
    graphicStyle?: string, 
    tone?: string,
    slideCount?: string,
    orientation?: string
  ) => void;
  isLoading: boolean;
}

const THEMES: { id: ThemeName; name: string; description: string; colors: string }[] = [
  { id: 'limefrost', name: 'Limefrost', description: 'Fresh, bold, and signature Storyline', colors: 'bg-lime-400 text-lime-950' },
  { id: 'modern', name: 'Modern', description: 'Clean and professional', colors: 'bg-blue-500 text-white' },
  { id: 'cosmic', name: 'Cosmic', description: 'Dark and elegant', colors: 'bg-slate-900 text-purple-400' },
  { id: 'minimal', name: 'Minimal', description: 'Black and white simplicity', colors: 'bg-white text-black border border-gray-200' },
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
  }
];

export function Uploader({ onGenerate, isLoading }: UploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [theme, setTheme] = useState<ThemeName>('limefrost');
  const [customSettings, setCustomSettings] = useState<CustomizationSettings>(DEFAULT_CUSTOM_SETTINGS);
  const [graphicStyle, setGraphicStyle] = useState<string>('modern_infographic');
  const [tone, setTone] = useState<string>('executive');
  const [slideCount, setSlideCount] = useState<string>('auto');
  const [orientation, setOrientation] = useState<string>('horizontal');

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
    maxFiles: 1
  } as any);

  const handleSubmit = () => {
    if (file && !isLoading) {
      onGenerate(file, theme, theme === 'custom' ? customSettings : undefined, graphicStyle, tone, slideCount, orientation);
    }
  };

  const updateCustomSetting = <K extends keyof CustomizationSettings>(key: K, value: CustomizationSettings[K]) => {
    setCustomSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 w-full">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Turn PDFs into Storylines
        </h1>
        <p className="text-lg text-gray-600">
          Upload a document, choose a style, and shape a bold, editable presentation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        {/* File Upload */}
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-xl font-semibold">1. Upload PDF</h2>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center h-64 cursor-pointer transition-colors",
              isDragActive ? "border-lime-500 bg-lime-50" : "border-gray-300 hover:border-gray-400 bg-gray-50",
              file && "border-green-500 bg-green-50 hover:border-green-600"
            )}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex flex-col items-center text-green-700">
                <File className="w-12 h-12 mb-4" />
                <p className="font-medium text-center">{file.name}</p>
                <p className="text-sm opacity-75 mt-2">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-500">
                <UploadCloud className="w-12 h-12 mb-4" />
                <p className="font-medium text-center">Drag & drop your PDF here</p>
                <p className="text-sm mt-2">or click to browse files</p>
              </div>
            )}
          </div>
        </div>

        {/* Theme Selection */}
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-xl font-semibold">2. Choose Theme</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "p-4 rounded-xl text-left transition-all border-2",
                  theme === t.id ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2" : "border-transparent hover:border-gray-200 bg-gray-50"
                )}
              >
                <div className={cn("w-full h-24 rounded-lg mb-3 shadow-sm", t.colors)} />
                <h3 className="font-medium text-gray-900">{t.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{t.description}</p>
              </button>
            ))}
          </div>

          <AnimatePresence>
            {theme === 'custom' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-6 p-6 border-2 border-gray-200 rounded-xl bg-gray-50 space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-5 h-5 text-gray-700" />
                    <h3 className="text-lg font-semibold text-gray-900">Customization Settings</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Font Family</label>
                      <select 
                        value={customSettings.fontFamily}
                        onChange={(e) => updateCustomSetting('fontFamily', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                      >
                        <option value="font-sans">Inter (Sans)</option>
                        <option value="font-mono">JetBrains (Mono)</option>
                        <option value="font-serif">Georgia (Serif)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Alignment</label>
                      <select 
                        value={customSettings.alignment}
                        onChange={(e) => updateCustomSetting('alignment', e.target.value as any)}
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Primary Color (Accent)</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={customSettings.primaryColor}
                          onChange={(e) => updateCustomSetting('primaryColor', e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={customSettings.primaryColor}
                          onChange={(e) => updateCustomSetting('primaryColor', e.target.value)}
                          className="flex-1 p-2 border border-gray-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Background Color</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={customSettings.backgroundColor}
                          onChange={(e) => updateCustomSetting('backgroundColor', e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={customSettings.backgroundColor}
                          onChange={(e) => updateCustomSetting('backgroundColor', e.target.value)}
                          className="flex-1 p-2 border border-gray-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Text Color</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={customSettings.textColor}
                          onChange={(e) => updateCustomSetting('textColor', e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={customSettings.textColor}
                          onChange={(e) => updateCustomSetting('textColor', e.target.value)}
                          className="flex-1 p-2 border border-gray-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Spacing</label>
                      <div className="flex gap-2 bg-white border border-gray-300 rounded-lg p-1">
                        {['compact', 'normal', 'relaxed'].map(space => (
                          <button
                            key={space}
                            onClick={() => updateCustomSetting('spacing', space as any)}
                            className={cn(
                              "flex-1 py-1 px-2 rounded-md text-sm capitalize transition-colors",
                              customSettings.spacing === space ? "bg-gray-200 font-medium text-gray-900" : "text-gray-500 hover:bg-gray-50"
                            )}
                          >
                            {space}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Graphic Style and Layout Expectations Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 mt-4">
        {/* Graphic Style Selection Card */}
        <div className="space-y-4 p-6 bg-white rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-lime-700" />
            <h2 className="text-xl font-bold text-gray-900">3. Graphic Customization</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Select the preferred aesthetic and structural layout pattern for the slides' interactive diagrams.
          </p>
          <div className="flex flex-col gap-3">
            {GRAPHIC_STYLES.map((style) => {
              const Icon = style.icon;
              const isSelected = graphicStyle === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => setGraphicStyle(style.id)}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-xl text-left border transition-all duration-200",
                    isSelected 
                      ? "border-lime-700 bg-lime-50/50 shadow-sm ring-1 ring-lime-500/30" 
                      : "border-gray-100 bg-gray-50/30 hover:bg-gray-50 hover:border-gray-200"
                  )}
                >
                  <div className={cn(
                    "p-2.5 rounded-lg border flex-shrink-0",
                    isSelected ? "bg-lime-700 border-lime-500 text-white" : "bg-white border-gray-200 text-gray-500"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                      {style.name}
                      {isSelected && <span className="text-xs bg-lime-100 text-lime-900 px-2 py-0.5 rounded-full font-medium">Selected</span>}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-normal">{style.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Tone Selection Card */}
        <div className="space-y-4 p-6 bg-white rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">4. Layout & Content Tone</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Choose how detailed or summary-focused you expect the slide text and interactions to be.
          </p>
          <div className="flex flex-col gap-3">
            {TONES.map((t) => {
              const Icon = t.icon;
              const isSelected = tone === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-xl text-left border transition-all duration-200",
                    isSelected 
                      ? "border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500/30" 
                      : "border-gray-100 bg-gray-50/30 hover:bg-gray-50 hover:border-gray-200"
                  )}
                >
                  <div className={cn(
                    "p-2.5 rounded-lg border flex-shrink-0",
                    isSelected ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white border-gray-200 text-gray-500"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                      {t.name}
                      {isSelected && <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-medium">Selected</span>}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-normal">{t.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Slide Count & Orientation Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Slide Count Selection */}
        <div className="space-y-4 p-6 bg-white rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-900">5. Slide Count</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Select how many slides should be crafted. A larger count delivers an exhaustive analysis, while a shorter count is highly compressed.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { id: 'auto', name: 'Auto-Detect', desc: 'Optimal summaries' },
              { id: '3', name: '3 Slides', desc: 'Ultra-condensed' },
              { id: '5', name: '5 Slides', desc: 'Express brief' },
              { id: '8', name: '8 Slides', desc: 'Standard deck' },
              { id: '10', name: '10 Slides', desc: 'Comprehensive' },
              { id: '15', name: '15 Slides', desc: 'In-depth analysis' }
            ].map((option) => {
              const isSelected = slideCount === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSlideCount(option.id)}
                  className={cn(
                    "p-3 rounded-xl border text-center transition-all cursor-pointer",
                    isSelected 
                      ? "border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500/30 font-semibold text-emerald-900" 
                      : "border-gray-100 bg-gray-50/30 hover:bg-gray-50 hover:border-gray-200 text-gray-700"
                  )}
                >
                  <span className="block text-sm">{option.name}</span>
                  <span className="block text-[10px] text-gray-400 mt-0.5 font-normal">{option.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Orientation Selection */}
        <div className="space-y-4 p-6 bg-white rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Monitor className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">6. Slide Orientation</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Select the aspect ratio or canvas flow. Landscape is standard for large display screens, while portrait is optimized for mobile-first reading.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'horizontal', name: 'Horizontal (Landscape)', desc: 'Standard 16:9 widescreen presentation layout' },
              { id: 'vertical', name: 'Vertical (Portrait)', desc: 'Mobile-first 3:4 vertical stacked layout' }
            ].map((option) => {
              const isSelected = orientation === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setOrientation(option.id)}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all cursor-pointer",
                    isSelected 
                      ? "border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500/30 font-semibold text-indigo-900" 
                      : "border-gray-100 bg-gray-50/30 hover:bg-gray-50 hover:border-gray-200 text-gray-700"
                  )}
                >
                  <span className="block text-sm">{option.name}</span>
                  <span className="block text-xs text-gray-400 mt-1 font-normal leading-normal">{option.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <button
          onClick={handleSubmit}
          disabled={!file || isLoading}
          className={cn(
            "px-8 py-4 rounded-full font-medium text-lg text-white shadow-lg transition-all flex items-center justify-center min-w-[200px]",
            !file || isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-lime-700 hover:bg-lime-800 hover:scale-105 active:scale-95"
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
    </div>
  );
}
