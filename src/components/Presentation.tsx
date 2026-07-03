import React, { useState, useEffect, useCallback } from 'react';
import { PresentationData, ThemeName, CustomizationSettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Maximize, X, ExternalLink, PlayCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { InteractiveGraphic } from './InteractiveGraphic';

interface PresentationProps {
  data: PresentationData;
  theme: ThemeName;
  customSettings?: CustomizationSettings;
  onClose: () => void;
}

const themeStyles: Record<ThemeName, { bg: string; text: string; accent: string; title: string }> = {
  modern: { bg: 'bg-white', text: 'text-gray-600', accent: 'bg-blue-600', title: 'text-gray-900' },
  limefrost: { bg: 'bg-lime-50', text: 'text-lime-900', accent: 'bg-lime-500', title: 'text-lime-950' },
  cosmic: { bg: 'bg-slate-950', text: 'text-slate-300', accent: 'bg-purple-600', title: 'text-white' },
  minimal: { bg: 'bg-white', text: 'text-black', accent: 'bg-black', title: 'text-black' },
  custom: { bg: '', text: '', accent: '', title: '' } // Handled via style props
};

export function Presentation({ data, theme, customSettings, onClose }: PresentationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [direction, setDirection] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  // Reset states on slide change
  useEffect(() => {
    setSelectedAnswer(null);
    setShowVideo(false);
  }, [currentIndex]);

  const style = themeStyles[theme];

  const handleNext = useCallback(() => {
    if (currentIndex < data.slides.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, data.slides.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, isFullscreen, onClose]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const currentSlide = data.slides[currentIndex];
  const isTitleSlide = currentIndex === 0;

  const isCustom = theme === 'custom' && customSettings;
  const containerStyle = isCustom ? { backgroundColor: customSettings.backgroundColor } : undefined;
  const textStyleObj = isCustom ? { color: customSettings.textColor } : undefined;
  const titleStyleObj = isCustom ? { color: customSettings.textColor } : undefined; // Custom title uses text color or maybe a darker variant, let's just use textColor
  const accentStyleObj = isCustom ? { backgroundColor: customSettings.primaryColor } : undefined;

  const getSpacingClass = () => {
    if (!isCustom) return 'space-y-6';
    if (customSettings.spacing === 'compact') return 'space-y-3';
    if (customSettings.spacing === 'relaxed') return 'space-y-10';
    return 'space-y-6';
  };

  const getAlignmentClass = () => {
    if (!isCustom) return 'justify-start text-left';
    if (customSettings.alignment === 'center') return 'justify-center text-center items-center';
    if (customSettings.alignment === 'right') return 'justify-start text-right items-end';
    return 'justify-start text-left items-start';
  };

  const getAlignmentClassForList = () => {
    if (!isCustom) return 'items-start text-left';
    if (customSettings.alignment === 'center') return 'items-center text-center';
    if (customSettings.alignment === 'right') return 'items-end text-right flex-row-reverse';
    return 'items-start text-left';
  };

  return (
    <div 
      className={cn("fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-colors duration-500", !isCustom && style.bg, isCustom && customSettings.fontFamily)}
      style={containerStyle}
    >
      
      {/* Controls */}
      <div className={cn("absolute top-4 right-4 z-50 flex gap-2 transition-opacity duration-300", isFullscreen ? "opacity-0 hover:opacity-100" : "opacity-100")}>
        <button onClick={toggleFullscreen} className={cn("p-2 rounded-full bg-black/10 hover:bg-black/20 backdrop-blur transition-colors", !isCustom && style.text)} style={textStyleObj}>
          <Maximize className="w-5 h-5" />
        </button>
        <button onClick={onClose} className={cn("p-2 rounded-full bg-black/10 hover:bg-black/20 backdrop-blur transition-colors", !isCustom && style.text)} style={textStyleObj}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 z-40 bg-black/5">
        <motion.div
          className={cn("h-full", !isCustom && style.accent)}
          style={accentStyleObj}
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / data.slides.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Main Slide Content */}
      <div className="relative w-full h-full max-w-6xl max-h-[800px] aspect-video mx-auto flex items-center justify-center p-12">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className={cn(
              "w-full h-full flex flex-col rounded-3xl p-16 shadow-2xl overflow-hidden", 
              !isCustom && style.bg, 
              isTitleSlide ? "justify-center items-center text-center" : getAlignmentClass()
            )}
            style={{
               ...(theme === 'minimal' && !isCustom ? { boxShadow: 'none', border: '1px solid #e5e7eb' } : {}),
               ...containerStyle
            }}
          >
            {isTitleSlide ? (
              <>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className={cn("w-24 h-2 mb-8 rounded-full", !isCustom && style.accent)} 
                  style={accentStyleObj}
                />
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className={cn("text-6xl md:text-7xl font-bold tracking-tight mb-6", !isCustom && style.title)}
                  style={titleStyleObj}
                >
                  {currentSlide.title}
                </motion.h1>
                <motion.p
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ delay: 0.6 }}
                   className={cn("text-xl md:text-2xl mt-4 max-w-2xl", !isCustom && style.text)}
                   style={textStyleObj}
                >
                   {data.title !== currentSlide.title ? data.title : ''}
                </motion.p>
              </>
            ) : (
              <>
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className={cn("text-4xl md:text-5xl font-bold mb-12", !isCustom && style.title)}
                  style={titleStyleObj}
                >
                  {currentSlide.title}
                </motion.h2>
                <div className="flex-1 overflow-y-auto pr-4 w-full flex flex-col">
                  {showVideo && currentSlide.videoUrl ? (
                    <div className="w-full flex-1 min-h-[300px] bg-black/5 rounded-xl overflow-hidden mb-6 relative">
                      <button onClick={() => setShowVideo(false)} className="absolute top-2 right-2 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70">
                        <X className="w-4 h-4" />
                      </button>
                      <iframe 
                        src={currentSlide.videoUrl} 
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : currentSlide.graphic ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1 w-full h-full min-h-0">
                      {/* Left Column: Key Points */}
                      <div className="lg:col-span-5 flex flex-col justify-center h-full">
                        <ul className={cn(getSpacingClass(), "w-full space-y-4")}>
                          {currentSlide.content.map((point, idx) => (
                            <motion.li
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + (idx * 0.1) }}
                              className={cn("flex text-xl leading-relaxed", !isCustom && style.text, getAlignmentClassForList())}
                              style={textStyleObj}
                            >
                              <span className={cn("inline-block w-2.5 h-2.5 rounded-full mt-2.5 mr-4 flex-shrink-0", !isCustom && style.accent, customSettings?.alignment === 'right' ? 'mr-0 ml-4' : 'ml-0 mr-4', customSettings?.alignment === 'center' ? 'hidden' : '')} style={accentStyleObj} />
                              <span className={cn(customSettings?.alignment === 'center' && 'text-center')}>{point}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>

                      {/* Right Column: Premium Animated Graphic */}
                      <div className="lg:col-span-7 flex flex-col justify-center h-full bg-black/5 dark:bg-white/5 rounded-2xl p-6 border border-black/5 dark:border-white/5 backdrop-blur-sm shadow-xl min-h-[350px]">
                        <InteractiveGraphic
                          graphic={currentSlide.graphic}
                          accentClass={!isCustom ? style.accent : ''}
                          accentStyleObj={accentStyleObj}
                          isDarkTheme={theme === 'cosmic'}
                        />
                      </div>
                    </div>
                  ) : (
                    <ul className={cn(getSpacingClass(), "w-full")}>
                      {currentSlide.content.map((point, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + (idx * 0.1) }}
                          className={cn("flex text-2xl leading-relaxed", !isCustom && style.text, getAlignmentClassForList())}
                          style={textStyleObj}
                        >
                          <span className={cn("inline-block w-3 h-3 rounded-full mt-3 mr-6 ml-6 flex-shrink-0", !isCustom && style.accent, customSettings?.alignment === 'right' ? 'mr-0 ml-6' : 'ml-0 mr-6', customSettings?.alignment === 'center' ? 'hidden' : '')} style={accentStyleObj} />
                          <span className={cn(customSettings?.alignment === 'center' && 'text-center')}>{point}</span>
                        </motion.li>
                      ))}
                    </ul>
                  )}

                  {/* Interactive Elements Section */}
                  <div className="mt-auto pt-8 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {/* Quiz */}
                    {currentSlide.quiz && (
                      <div className="bg-black/5 p-6 rounded-2xl">
                        <h4 className={cn("font-semibold mb-3 flex items-center gap-2", !isCustom && style.title)} style={titleStyleObj}>
                          Knowledge Check
                        </h4>
                        <p className={cn("mb-4", !isCustom && style.text)} style={textStyleObj}>{currentSlide.quiz.question}</p>
                        <div className="space-y-2">
                          {currentSlide.quiz.options.map((opt, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedAnswer(idx)}
                              disabled={selectedAnswer !== null}
                              className={cn(
                                "w-full text-left p-3 rounded-xl transition-all border",
                                selectedAnswer === null 
                                  ? "border-transparent bg-white/50 hover:bg-white/80" 
                                  : idx === currentSlide.quiz!.correctAnswerIndex
                                    ? "bg-green-100 border-green-500 text-green-900"
                                    : idx === selectedAnswer
                                      ? "bg-red-100 border-red-500 text-red-900"
                                      : "bg-white/30 opacity-50 border-transparent",
                                !isCustom && selectedAnswer === null ? style.text : ''
                              )}
                              style={selectedAnswer === null ? textStyleObj : undefined}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-4">
                      {/* Video Button */}
                      {currentSlide.videoUrl && !showVideo && (
                        <button
                          onClick={() => setShowVideo(true)}
                          className={cn("flex items-center gap-3 p-4 rounded-xl bg-black/5 hover:bg-black/10 transition-colors w-full text-left", !isCustom && style.title)}
                          style={titleStyleObj}
                        >
                          <PlayCircle className="w-8 h-8 opacity-80" />
                          <div>
                            <p className="font-semibold">Watch Video</p>
                            <p className={cn("text-sm opacity-70", !isCustom && style.text)} style={{...textStyleObj, opacity: 0.7}}>Play embedded video content</p>
                          </div>
                        </button>
                      )}

                      {/* Links */}
                      {currentSlide.links && currentSlide.links.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <h4 className={cn("font-semibold text-sm uppercase tracking-wider mb-2", !isCustom && style.text)} style={{...textStyleObj, opacity: 0.7}}>References</h4>
                          {currentSlide.links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn("flex items-center gap-2 p-3 rounded-xl bg-black/5 hover:bg-black/10 transition-colors", !isCustom && style.text)}
                              style={textStyleObj}
                            >
                              <ExternalLink className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{link.title}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Slide Number */}
            <div className={cn("absolute bottom-8 right-12 text-lg font-medium opacity-50", !isCustom && style.text)} style={textStyleObj}>
              {currentIndex + 1} / {data.slides.length}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className={cn("absolute bottom-8 flex gap-4 transition-opacity duration-300 z-50", isFullscreen ? "opacity-0 hover:opacity-100" : "opacity-100")}>
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={cn(
            "p-4 rounded-full backdrop-blur transition-all",
            currentIndex === 0 ? "opacity-30 cursor-not-allowed bg-black/5" : "bg-black/10 hover:bg-black/20 active:scale-95",
            !isCustom && style.text
          )}
          style={textStyleObj}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === data.slides.length - 1}
          className={cn(
            "p-4 rounded-full backdrop-blur transition-all",
            currentIndex === data.slides.length - 1 ? "opacity-30 cursor-not-allowed bg-black/5" : "bg-black/10 hover:bg-black/20 active:scale-95",
            !isCustom && style.text
          )}
          style={textStyleObj}
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Speaker Notes Overlay (Visible on hover in non-fullscreen) */}
      {!isFullscreen && currentSlide.speakerNotes && (
        <div className="absolute bottom-4 left-4 max-w-sm">
          <div className="bg-black/80 text-white/90 p-4 rounded-xl text-sm opacity-0 hover:opacity-100 transition-opacity backdrop-blur shadow-xl border border-white/10">
            <h4 className="font-semibold text-white mb-1 uppercase tracking-wider text-xs">Speaker Notes</h4>
            <p>{currentSlide.speakerNotes}</p>
          </div>
        </div>
      )}
    </div>
  );
}
