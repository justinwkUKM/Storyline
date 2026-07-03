/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PresentationData, ThemeName, CustomizationSettings } from './types';
import { Uploader } from './components/Uploader';
import { Presentation } from './components/Presentation';
import { SlideEditor } from './components/SlideEditor';
import { AnimatePresence, motion } from 'motion/react';
import { FileText } from 'lucide-react';

export default function App() {
  const [draftPresentation, setDraftPresentation] = useState<PresentationData | null>(null);
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [theme, setTheme] = useState<ThemeName>('modern');
  const [customSettings, setCustomSettings] = useState<CustomizationSettings | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (
    file: File, 
    selectedTheme: ThemeName, 
    settings?: CustomizationSettings, 
    graphicStyle: string = 'modern_infographic', 
    tone: string = 'executive',
    slideCount: string = 'auto',
    orientation: string = 'horizontal'
  ) => {
    setIsLoading(true);
    setError(null);
    setTheme(selectedTheme);
    setCustomSettings(settings);

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('graphicStyle', graphicStyle);
    formData.append('tone', tone);
    formData.append('slideCount', slideCount);
    formData.append('orientation', orientation);
    if (settings) {
      formData.append('customSettings', JSON.stringify(settings));
    }

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (!response.ok) {
        if (isJson) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server error: ${response.status}`);
        } else {
          throw new Error(`Server returned status ${response.status} with an invalid response format (HTML instead of JSON).`);
        }
      }

      if (!isJson) {
        throw new Error('Server responded with an invalid layout format (HTML instead of JSON). This could indicate a server timeout, network issue, or file size restriction.');
      }

      const data: PresentationData = await response.json();
      
      // Ensure we have slides before transitioning
      if (data && data.slides && data.slides.length > 0) {
        setDraftPresentation(data);
      } else {
        throw new Error('Received invalid presentation structure from server');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
      
      <AnimatePresence mode="wait">
        {presentation ? (
          <motion.div
            key="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <Presentation 
              data={presentation} 
              theme={theme} 
              customSettings={customSettings}
              onClose={() => {
                setPresentation(null);
                setDraftPresentation(null);
              }} 
              onEdit={() => {
                setDraftPresentation(presentation);
                setPresentation(null);
              }}
            />
          </motion.div>
        ) : draftPresentation ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <SlideEditor
              initialData={draftPresentation}
              onFinalise={(finalData, finalTheme, finalSettings) => {
                setTheme(finalTheme);
                setCustomSettings(finalSettings);
                setPresentation(finalData);
              }}
              onCancel={() => {
                setDraftPresentation(null);
              }}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="uploader"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col items-center justify-center py-12"
          >
            {/* Header branding */}
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-blue-600 p-3 rounded-2xl shadow-sm">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-gray-900">SlideCraft AI</span>
            </div>

            {error && (
              <div className="max-w-6xl w-full mx-auto px-6 mb-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm">
                  <p className="font-medium">Error generating presentation</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            <Uploader onGenerate={handleGenerate} isLoading={isLoading} />
            
            {/* Loading Overlay */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
                >
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mb-6"
                  />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">Analyzing your PDF...</h3>
                  <p className="text-gray-500">Extracting text and synthesizing slides using Gemini AI</p>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
