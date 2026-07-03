import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, Loader2, Settings } from 'lucide-react';
import { ThemeName, CustomizationSettings } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface UploaderProps {
  onGenerate: (file: File, theme: ThemeName, customSettings?: CustomizationSettings) => void;
  isLoading: boolean;
}

const THEMES: { id: ThemeName; name: string; description: string; colors: string }[] = [
  { id: 'modern', name: 'Modern', description: 'Clean and professional', colors: 'bg-blue-500 text-white' },
  { id: 'limefrost', name: 'Limefrost', description: 'Fresh and energetic', colors: 'bg-lime-400 text-lime-950' },
  { id: 'cosmic', name: 'Cosmic', description: 'Dark and elegant', colors: 'bg-slate-900 text-purple-400' },
  { id: 'minimal', name: 'Minimal', description: 'Black and white simplicity', colors: 'bg-white text-black border border-gray-200' },
  { id: 'custom', name: 'Custom', description: 'Fully personalized', colors: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white' }
];

const DEFAULT_CUSTOM_SETTINGS: CustomizationSettings = {
  fontFamily: 'font-sans',
  primaryColor: '#3b82f6',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  spacing: 'normal',
  alignment: 'left',
};

export function Uploader({ onGenerate, isLoading }: UploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [theme, setTheme] = useState<ThemeName>('modern');
  const [customSettings, setCustomSettings] = useState<CustomizationSettings>(DEFAULT_CUSTOM_SETTINGS);

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
      onGenerate(file, theme, theme === 'custom' ? customSettings : undefined);
    }
  };

  const updateCustomSetting = <K extends keyof CustomizationSettings>(key: K, value: CustomizationSettings[K]) => {
    setCustomSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 w-full">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
          Transform PDFs into Presentations
        </h1>
        <p className="text-lg text-gray-600">
          Upload your document, choose a style, and let AI craft a beautiful slide deck for you.
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
              isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400 bg-gray-50",
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

      <div className="flex justify-center mt-8">
        <button
          onClick={handleSubmit}
          disabled={!file || isLoading}
          className={cn(
            "px-8 py-4 rounded-full font-medium text-lg text-white shadow-lg transition-all flex items-center justify-center min-w-[200px]",
            !file || isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95"
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
