import React, { useState, useEffect, useCallback } from 'react';
import { PresentationData, ThemeName, CustomizationSettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  X, 
  ExternalLink, 
  PlayCircle, 
  Sparkles, 
  HelpCircle, 
  Link as LinkIcon, 
  Presentation as SlideIcon,
  Download,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { InteractiveGraphic } from './InteractiveGraphic';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import pptxgen from 'pptxgenjs';

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
  
  // Compartmentalized Tab State
  const [activeTab, setActiveTab] = useState<'content' | 'quiz' | 'links'>('content');
  
  // Download states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');

  // Reset states on slide change
  useEffect(() => {
    setSelectedAnswer(null);
    setShowVideo(false);
    setActiveTab('content');
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
        // Prevent scroll on Space bar
        if (e.key === 'Space') e.preventDefault();
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
      x: direction > 0 ? 800 : -800,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 800 : -800,
      opacity: 0
    })
  };

  const currentSlide = data.slides[currentIndex];
  const isTitleSlide = currentIndex === 0;

  const isCustom = theme === 'custom' && customSettings;
  const containerStyle = isCustom ? { backgroundColor: customSettings.backgroundColor } : undefined;
  const textStyleObj = isCustom ? { color: customSettings.textColor } : undefined;
  const titleStyleObj = isCustom ? { color: customSettings.textColor } : undefined;
  const accentStyleObj = isCustom ? { backgroundColor: customSettings.primaryColor } : undefined;

  const getSpacingClass = () => {
    if (!isCustom) return 'space-y-5';
    if (customSettings.spacing === 'compact') return 'space-y-2';
    if (customSettings.spacing === 'relaxed') return 'space-y-8';
    return 'space-y-5';
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

  // Determine sub-tabs existence for the active slide
  const hasQuiz = !!currentSlide.quiz;
  const hasLinks = !!currentSlide.links && currentSlide.links.length > 0;
  const showTabs = !isTitleSlide && (hasQuiz || hasLinks);

  // High-fidelity PDF Download
  const exportToPDF = async () => {
    setIsDownloading(true);
    setDownloadProgress('Preparing high-res PDF...');
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1280, 720]
      });

      let pageCount = 0;
      for (let i = 0; i < data.slides.length; i++) {
        // Render slide content
        setDownloadProgress(`Rendering slide ${i + 1} of ${data.slides.length}...`);
        const contentEl = document.getElementById(`pdf-slide-content-${i}`);
        if (contentEl) {
          // Add a brief timeout to let everything stabilize
          await new Promise(r => setTimeout(r, 120));
          const canvas = await html2canvas(contentEl, {
            width: 1280,
            height: 720,
            scale: 1.5, // 1.5x scale offers gorgeous density without inflating PDF sizes
            useCORS: true,
            logging: false,
          });
          const imgData = canvas.toDataURL('image/png');
          
          if (pageCount > 0) {
            pdf.addPage([1280, 720], 'landscape');
          }
          pdf.addImage(imgData, 'PNG', 0, 0, 1280, 720);
          pageCount++;
        }

        // Render dedicated quiz page if the slide contains a quiz
        if (data.slides[i].quiz) {
          setDownloadProgress(`Rendering quiz for slide ${i + 1}...`);
          const quizEl = document.getElementById(`pdf-slide-quiz-${i}`);
          if (quizEl) {
            await new Promise(r => setTimeout(r, 120));
            const canvas = await html2canvas(quizEl, {
              width: 1280,
              height: 720,
              scale: 1.5,
              useCORS: true,
              logging: false,
            });
            const imgData = canvas.toDataURL('image/png');
            
            pdf.addPage([1280, 720], 'landscape');
            pdf.addImage(imgData, 'PNG', 0, 0, 1280, 720);
            pageCount++;
          }
        }
      }

      const fileName = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_presentation.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsDownloading(false);
      setDownloadProgress('');
    }
  };

  // Editable PPTX Download
  const exportToPPTX = async () => {
    setIsDownloading(true);
    setDownloadProgress('Creating PPTX presentation...');
    try {
      const pptx = new pptxgen();
      pptx.title = data.title;
      pptx.layout = 'LAYOUT_16x9';

      const primaryColorHex = isCustom ? customSettings?.primaryColor : theme === 'cosmic' ? '#7c3aed' : '#2563eb';
      const textColorHex = isCustom ? customSettings?.textColor : theme === 'cosmic' ? '#ffffff' : '#1f2937';
      const bgColorHex = isCustom ? customSettings?.backgroundColor : theme === 'cosmic' ? '#0b0f19' : theme === 'limefrost' ? '#f7fee7' : '#ffffff';

      data.slides.forEach((slide, sIdx) => {
        // 1. Core Slide Content
        const pptSlide = pptx.addSlide();
        pptSlide.background = { fill: bgColorHex };

        if (sIdx === 0) {
          // Title Slide Layout
          pptSlide.addText(slide.title, {
            x: '10%',
            y: '35%',
            w: '80%',
            h: '20%',
            fontSize: 44,
            bold: true,
            color: textColorHex,
            align: 'center',
            fontFace: 'Arial'
          });

          if (data.title !== slide.title) {
            pptSlide.addText(data.title, {
              x: '15%',
              y: '55%',
              w: '70%',
              h: '10%',
              fontSize: 18,
              color: textColorHex,
              align: 'center',
              fontFace: 'Arial'
            });
          }

          pptSlide.addShape(pptx.ShapeType.rect, {
            x: '45%',
            y: '30%',
            w: '10%',
            h: '1%',
            fill: { color: primaryColorHex }
          });
        } else {
          // Standard Slide Content
          pptSlide.addText(slide.title, {
            x: '5%',
            y: '8%',
            w: '90%',
            h: '10%',
            fontSize: 32,
            bold: true,
            color: primaryColorHex,
            fontFace: 'Arial'
          });

          const hasGraphic = !!slide.graphic;
          const leftColWidth = hasGraphic ? '45%' : '90%';

          // Bullets text
          const bulletObjects = slide.content.map(bullet => ({
            text: bullet,
            options: { bullet: true, fontSize: 16, color: textColorHex }
          }));

          if (bulletObjects.length > 0) {
            pptSlide.addText(bulletObjects as any, {
              x: '5%',
              y: '22%',
              w: leftColWidth,
              h: '60%',
              fontSize: 16,
              color: textColorHex,
              align: 'left',
              fontFace: 'Arial',
              valign: 'top',
              lineSpacing: 24
            });
          }

          // Render Graphics as visual blocks inside PowerPoint
          if (slide.graphic) {
            // Draw visual container box
            pptSlide.addShape(pptx.ShapeType.roundRect, {
              x: '54%',
              y: '22%',
              w: '41%',
              h: '60%',
              fill: { color: theme === 'cosmic' ? '#131926' : '#f8fafc' },
              line: { color: primaryColorHex, width: 1 }
            });

            // Container header
            const graphicTitle = slide.graphic.title || 'Visual Graphic';
            pptSlide.addText(graphicTitle, {
              x: '56%',
              y: '25%',
              w: '37%',
              h: '5%',
              fontSize: 14,
              bold: true,
              color: primaryColorHex,
              fontFace: 'Arial'
            });

            // Draw graphic metrics / steps
            const elementsToDraw = slide.graphic.elements.slice(0, 4);
            elementsToDraw.forEach((el, elIdx) => {
              const elementY = 32 + (elIdx * 12);

              // Step tag
              pptSlide.addShape(pptx.ShapeType.roundRect, {
                x: '56%',
                y: `${elementY}%`,
                w: '2.5%',
                h: '3%',
                fill: { color: primaryColorHex }
              });

              // Element text label
              pptSlide.addText(el.label, {
                x: '60%',
                y: `${elementY - 1}%`,
                w: '24%',
                h: '4%',
                fontSize: 12,
                bold: true,
                color: textColorHex,
                fontFace: 'Arial'
              });

              if (el.secondaryText) {
                pptSlide.addText(el.secondaryText, {
                  x: '60%',
                  y: `${elementY + 3.2}%`,
                  w: '24%',
                  h: '5%',
                  fontSize: 10,
                  color: textColorHex,
                  fontFace: 'Arial'
                });
              }

              const valueText = el.value || (el.percentage !== undefined ? `${el.percentage}%` : '');
              if (valueText) {
                pptSlide.addText(valueText, {
                  x: '86%',
                  y: `${elementY - 1}%`,
                  w: '7%',
                  h: '4%',
                  fontSize: 12,
                  bold: true,
                  color: primaryColorHex,
                  align: 'right',
                  fontFace: 'Arial'
                });
              }
            });
          }
        }

        // Slide counter
        pptSlide.addText(`${sIdx + 1} / ${data.slides.length}`, {
          x: '85%',
          y: '90%',
          w: '10%',
          h: '5%',
          fontSize: 10,
          color: textColorHex,
          align: 'right',
          fontFace: 'Arial'
        });

        // 2. Add Dedicated Quiz Slide in PPTX if present (so printed presentation holds it!)
        if (slide.quiz) {
          const quizSlide = pptx.addSlide();
          quizSlide.background = { fill: bgColorHex };

          // Title
          quizSlide.addText(`${slide.title} — Quiz`, {
            x: '5%',
            y: '8%',
            w: '90%',
            h: '10%',
            fontSize: 28,
            bold: true,
            color: primaryColorHex,
            fontFace: 'Arial'
          });

          // Question Card Box
          quizSlide.addShape(pptx.ShapeType.roundRect, {
            x: '5%',
            y: '22%',
            w: '90%',
            h: '60%',
            fill: { color: theme === 'cosmic' ? '#131926' : '#f8fafc' },
            line: { color: '#e2e8f0', width: 1 }
          });

          // Question text
          quizSlide.addText(`QUESTION:\n${slide.quiz.question}`, {
            x: '8%',
            y: '26%',
            w: '84%',
            h: '15%',
            fontSize: 18,
            bold: true,
            color: textColorHex,
            fontFace: 'Arial',
            valign: 'middle'
          });

          // Options as list
          const optionsTextObj = slide.quiz.options.map((opt, oIdx) => {
            const isCorrect = oIdx === slide.quiz?.correctAnswerIndex;
            return {
              text: `[Option ${oIdx + 1}]  ${opt} ${isCorrect ? '  (✓ CORRECT ANSWER)' : ''}`,
              options: { fontSize: 14, color: isCorrect ? '#10b981' : textColorHex, bold: isCorrect }
            };
          });

          quizSlide.addText(optionsTextObj as any, {
            x: '8%',
            y: '45%',
            w: '84%',
            h: '32%',
            fontSize: 14,
            fontFace: 'Arial',
            lineSpacing: 24,
            valign: 'top'
          });
        }
      });

      const fileName = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_presentation.pptx`;
      await pptx.writeFile({ fileName });
    } catch (err) {
      console.error('Failed to export PPTX:', err);
    } finally {
      setIsDownloading(false);
      setDownloadProgress('');
    }
  };

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-colors duration-500 p-4 md:p-6", 
        !isCustom && style.bg, 
        isCustom && customSettings?.fontFamily
      )}
      style={containerStyle}
    >
      
      {/* Absolute Header Branding (Centered clean watermark) */}
      <div className="absolute top-4 left-6 z-40 flex items-center gap-2 opacity-60 pointer-events-none">
        <SlideIcon className="w-4 h-4" style={textStyleObj} />
        <span className="text-xs font-semibold tracking-wider uppercase" style={textStyleObj}>
          {data.title}
        </span>
      </div>

      {/* Main Slide Card Layout */}
      <div className="w-full flex-1 max-w-5xl flex items-center justify-center min-h-0">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 350, damping: 33 },
              opacity: { duration: 0.15 }
            }}
            className={cn(
              "w-full aspect-video rounded-3xl p-8 md:p-12 shadow-xl border overflow-hidden flex flex-col relative bg-white", 
              !isCustom && style.bg, 
              isTitleSlide ? "justify-center items-center text-center" : getAlignmentClass()
            )}
            style={{
               boxShadow: theme === 'minimal' ? 'none' : '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
               borderColor: theme === 'minimal' ? '#e5e7eb' : theme === 'cosmic' ? '#334155' : '#f1f5f9',
               ...containerStyle
            }}
          >
            {isTitleSlide ? (
              // ---------------- TITLE SLIDE VIEW ----------------
              <>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className={cn("w-16 h-1.5 mb-6 rounded-full", !isCustom && style.accent)} 
                  style={accentStyleObj}
                />
                <motion.h1 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.5 }}
                  className={cn("text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4", !isCustom && style.title)}
                  style={titleStyleObj}
                >
                  {currentSlide.title}
                </motion.h1>
                <motion.p
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ delay: 0.45 }}
                   className={cn("text-lg md:text-xl opacity-75 max-w-2xl font-medium", !isCustom && style.text)}
                   style={textStyleObj}
                >
                   {data.title !== currentSlide.title ? data.title : 'Interactive Presentation Deck'}
                </motion.p>
              </>
            ) : (
              // ---------------- STANDARD SLIDE VIEW ----------------
              <>
                {/* Header Compartment: Title + Sub-Tabs */}
                <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 dark:border-white/5 pb-4 mb-6 flex-shrink-0">
                  <motion.h2 
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className={cn("text-2xl md:text-3xl font-bold tracking-tight", !isCustom && style.title)}
                    style={titleStyleObj}
                  >
                    {currentSlide.title}
                  </motion.h2>

                  {/* Sub-Tabs Selector to Compartmentalize overlapping components */}
                  {showTabs && (
                    <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-full border border-black/5 dark:border-white/5">
                      <button 
                        onClick={() => setActiveTab('content')}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all",
                          activeTab === 'content'
                            ? "bg-white text-gray-900 shadow-sm dark:bg-slate-800 dark:text-white"
                            : "text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                      >
                        <SlideIcon className="w-3.5 h-3.5" />
                        Slide
                      </button>
                      
                      {hasQuiz && (
                        <button 
                          onClick={() => setActiveTab('quiz')}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all relative",
                            activeTab === 'quiz'
                              ? "bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400"
                              : "text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
                          )}
                        >
                          <HelpCircle className={cn("w-3.5 h-3.5 text-amber-500", activeTab !== 'quiz' && "animate-pulse")} />
                          Quiz
                        </button>
                      )}

                      {hasLinks && (
                        <button 
                          onClick={() => setActiveTab('links')}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all",
                            activeTab === 'links'
                              ? "bg-white text-gray-900 shadow-sm dark:bg-slate-800 dark:text-white"
                              : "text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
                          )}
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          Refs
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Content Area Compartment (Isolated Scroll container with explicit height constraint) */}
                <div className="flex-1 w-full min-h-0 overflow-y-auto pr-2 flex flex-col justify-center">
                  
                  {/* TAB 1: Slide Content & Graphics */}
                  {activeTab === 'content' && (
                    <div className="w-full">
                      {showVideo && currentSlide.videoUrl ? (
                        <div className="w-full aspect-video max-h-[350px] bg-black/10 rounded-2xl overflow-hidden relative border border-black/10 shadow-inner">
                          <button 
                            onClick={() => setShowVideo(false)} 
                            className="absolute top-3 right-3 z-10 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full transition-colors cursor-pointer"
                          >
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
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center w-full">
                          
                          {/* Bullet points on Left column */}
                          <div className="lg:col-span-5 flex flex-col justify-center">
                            <ul className={cn(getSpacingClass(), "w-full")}>
                              {currentSlide.content.map((point, idx) => (
                                <motion.li
                                  key={idx}
                                  initial={{ opacity: 0, x: -15 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.15 + (idx * 0.08) }}
                                  className={cn("flex text-base md:text-lg leading-relaxed", !isCustom && style.text, getAlignmentClassForList())}
                                  style={textStyleObj}
                                >
                                  <span className={cn("inline-block w-2 h-2 rounded-full mt-2.5 mr-3 flex-shrink-0", !isCustom && style.accent, customSettings?.alignment === 'right' ? 'mr-0 ml-3' : 'ml-0 mr-3', customSettings?.alignment === 'center' ? 'hidden' : '')} style={accentStyleObj} />
                                  <span className={cn(customSettings?.alignment === 'center' && 'text-center')}>{point}</span>
                                </motion.li>
                              ))}
                            </ul>

                            {/* Supplementary Embedded Video launcher */}
                            {currentSlide.videoUrl && (
                              <button
                                onClick={() => setShowVideo(true)}
                                className="flex items-center gap-2 mt-6 px-4 py-2.5 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-semibold text-left transition-colors cursor-pointer w-fit"
                              >
                                <PlayCircle className="w-5 h-5 text-blue-500" />
                                <span style={textStyleObj}>Watch Embedded Video Content</span>
                              </button>
                            )}
                          </div>

                          {/* Interactive premium Graphic on Right column */}
                          <div className="lg:col-span-7 flex flex-col justify-center bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 shadow-inner min-h-[300px]">
                            <InteractiveGraphic
                              graphic={currentSlide.graphic}
                              accentClass={!isCustom ? style.accent : ''}
                              accentStyleObj={accentStyleObj}
                              isDarkTheme={theme === 'cosmic'}
                            />
                          </div>
                        </div>
                      ) : (
                        // Full-width bullet points if no graphic is present
                        <ul className={cn(getSpacingClass(), "w-full max-w-4xl mx-auto")}>
                          {currentSlide.content.map((point, idx) => (
                            <motion.li
                              key={idx}
                              initial={{ opacity: 0, x: -15 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.15 + (idx * 0.08) }}
                              className={cn("flex text-lg md:text-xl lg:text-2xl leading-relaxed", !isCustom && style.text, getAlignmentClassForList())}
                              style={textStyleObj}
                            >
                              <span className={cn("inline-block w-2.5 h-2.5 rounded-full mt-3 mr-4 flex-shrink-0", !isCustom && style.accent, customSettings?.alignment === 'right' ? 'mr-0 ml-4' : 'ml-0 mr-4', customSettings?.alignment === 'center' ? 'hidden' : '')} style={accentStyleObj} />
                              <span className={cn(customSettings?.alignment === 'center' && 'text-center')}>{point}</span>
                            </motion.li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* TAB 2: Dedicated Interactive Quiz Panel */}
                  {activeTab === 'quiz' && currentSlide.quiz && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full max-w-3xl mx-auto p-6 md:p-8 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 shadow-inner"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                        <h4 className="font-bold text-base uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          Audience Assessment
                        </h4>
                      </div>
                      <p className={cn("text-lg md:text-xl font-bold mb-6", !isCustom && style.title)} style={titleStyleObj}>
                        {currentSlide.quiz.question}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                        {currentSlide.quiz.options.map((opt, idx) => {
                          const isAnswered = selectedAnswer !== null;
                          const isCorrect = idx === currentSlide.quiz!.correctAnswerIndex;
                          const isSelected = idx === selectedAnswer;

                          return (
                            <button
                              key={idx}
                              onClick={() => setSelectedAnswer(idx)}
                              disabled={isAnswered}
                              className={cn(
                                "w-full text-left p-4 rounded-xl text-sm font-semibold transition-all border duration-150 cursor-pointer",
                                !isAnswered 
                                  ? "border-black/5 bg-white/60 hover:bg-white hover:shadow-sm" 
                                  : isCorrect
                                    ? "bg-green-100 dark:bg-green-950/70 border-green-500 text-green-900 dark:text-green-200"
                                    : isSelected
                                      ? "bg-red-100 dark:bg-red-950/70 border-red-500 text-red-900 dark:text-red-200"
                                      : "bg-white/20 dark:bg-black/20 opacity-40 border-transparent cursor-not-allowed",
                                !isCustom && !isAnswered ? style.text : ''
                              )}
                              style={!isAnswered ? textStyleObj : undefined}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span>{opt}</span>
                                {isAnswered && isCorrect && <span className="text-[10px] font-extrabold uppercase bg-green-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">Correct</span>}
                                {isAnswered && isSelected && !isCorrect && <span className="text-[10px] font-extrabold uppercase bg-red-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">Incorrect</span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {selectedAnswer !== null && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-6 text-sm text-center font-medium opacity-80"
                          style={textStyleObj}
                        >
                          {selectedAnswer === currentSlide.quiz.correctAnswerIndex 
                            ? "✓ Spot on! That is the correct answer." 
                            : "✗ Not quite. The correct answer has been highlighted in green."}
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* TAB 3: References & Links */}
                  {activeTab === 'links' && currentSlide.links && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full max-w-2xl mx-auto flex flex-col justify-center"
                    >
                      <h4 className="font-extrabold text-sm uppercase tracking-wider mb-4 opacity-75" style={textStyleObj}>
                        Supporting Documentation & Resources
                      </h4>
                      <div className="flex flex-col gap-3">
                        {currentSlide.links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 rounded-xl border border-black/5 bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 shadow-sm transition-all duration-150"
                          >
                            <div className="flex items-center gap-3 truncate pr-4">
                              <ExternalLink className="w-5 h-5 text-blue-500 flex-shrink-0" />
                              <span className="font-semibold text-sm truncate" style={textStyleObj}>{link.title}</span>
                            </div>
                            <span className="text-xs text-blue-600 font-bold hover:underline flex-shrink-0 flex items-center gap-1">
                              Visit Resource
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </a>
                        ))}
                      </div>
                    </motion.div>
                  )}

                </div>
              </>
            )}

            {/* Static Non-Overlapping Slide Footer inside the Slide Container */}
            <div className="w-full flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-4 mt-6 text-xs font-semibold opacity-60 flex-shrink-0">
              <span className="truncate pr-4" style={textStyleObj}>
                {isTitleSlide ? 'Interactive SlideCraft' : `Slide ${currentIndex + 1}: ${currentSlide.title}`}
              </span>
              <span className="font-mono" style={textStyleObj}>
                {currentIndex + 1} / {data.slides.length}
              </span>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

      {/* UnifiedFrosted Presenter Control Bar (Horizontal layout placed underneath slide box - NO OVERLAP) */}
      <div className="w-full max-w-5xl mt-6 flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-3.5 bg-black/85 dark:bg-black/90 backdrop-blur-md rounded-2xl shadow-xl z-50 transition-all">
        {/* Left segment: Slideshow Controls & Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              title="Previous Slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-mono font-bold text-white/90 px-3">
              {currentIndex + 1} / {data.slides.length}
            </span>
            <button
              onClick={handleNext}
              disabled={currentIndex === data.slides.length - 1}
              className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              title="Next Slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="hidden lg:block text-[11px] font-bold text-white/50 uppercase tracking-widest truncate max-w-[200px]">
            {data.title}
          </div>
        </div>

        {/* Center/Right segment: Dual Exporters & Secondary Controls */}
        <div className="flex items-center gap-3">
          {isDownloading ? (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs text-white/90 animate-pulse font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
              <span>{downloadProgress || 'Processing...'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={exportToPDF}
                className="px-4 py-2 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/5 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Download High-Res Presentation PDF"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                Download PDF
              </button>
              
              <button
                onClick={exportToPPTX}
                className="px-4 py-2 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/5 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Download Editable PowerPoint (PPTX)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-orange-400" />
                Download PPTX
              </button>
            </div>
          )}

          <div className="w-px h-5 bg-white/10 mx-1 hidden sm:block" />

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            title="Toggle Fullscreen Mode"
          >
            <Maximize className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Exit Presentation"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Speaker Notes Overlay (Frosted slide-up hover panel) */}
      {!isFullscreen && currentSlide.speakerNotes && (
        <div className="absolute bottom-6 left-6 max-w-sm group">
          <div className="bg-black/90 text-white/95 p-4 rounded-2xl text-xs opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity duration-300 backdrop-blur shadow-xl border border-white/10">
            <h4 className="font-bold text-white mb-1 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
              Presenter Notes
            </h4>
            <p className="leading-relaxed opacity-90">{currentSlide.speakerNotes}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/5 flex items-center justify-center cursor-help transition-all shadow-md group-hover:opacity-0">
            <span className="text-white text-xs font-bold font-mono">?</span>
          </div>
        </div>
      )}

      {/* ---------------- OFFSCREEN HIGH-RES EXPORT CONTAINER (HIDDEN FROM VIEW) ---------------- */}
      <div 
        className="absolute left-[-9999px] top-[-9999px] pointer-events-none overflow-hidden"
        style={{ width: '1280px', height: '720px' }}
      >
        {data.slides.map((slide, sIdx) => (
          <React.Fragment key={sIdx}>
            
            {/* Slide Content Page */}
            <div
              id={`pdf-slide-content-${sIdx}`}
              className={cn(
                "w-[1280px] h-[720px] p-16 flex flex-col justify-between relative bg-white",
                !isCustom && themeStyles[theme].bg,
                isCustom && customSettings?.fontFamily
              )}
              style={{
                backgroundColor: isCustom ? customSettings?.backgroundColor : undefined,
                fontFamily: isCustom ? customSettings?.fontFamily : undefined,
              }}
            >
              <h2 
                className={cn("text-5xl font-extrabold mb-10", !isCustom && themeStyles[theme].title)}
                style={titleStyleObj}
              >
                {slide.title}
              </h2>
              <div className="flex-1 w-full flex min-h-0 items-center justify-between gap-10">
                {slide.graphic ? (
                  <div className="grid grid-cols-12 gap-10 w-full items-center">
                    <div className="col-span-5">
                      <ul className="space-y-6">
                        {slide.content.map((point, idx) => (
                          <li
                            key={idx}
                            className={cn("flex text-xl leading-relaxed", !isCustom && themeStyles[theme].text)}
                            style={textStyleObj}
                          >
                            <span className={cn("inline-block w-3.5 h-3.5 rounded-full mt-2 mr-4 flex-shrink-0", !isCustom && themeStyles[theme].accent)} style={accentStyleObj} />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="col-span-7 bg-black/5 dark:bg-white/5 rounded-2xl p-8 border border-black/5 dark:border-white/5 min-h-[380px] flex items-center justify-center">
                      <InteractiveGraphic
                        graphic={slide.graphic}
                        accentClass={!isCustom ? themeStyles[theme].accent : ''}
                        accentStyleObj={accentStyleObj}
                        isDarkTheme={theme === 'cosmic'}
                      />
                    </div>
                  </div>
                ) : (
                  <ul className="space-y-6 w-full">
                    {slide.content.map((point, idx) => (
                      <li
                        key={idx}
                        className={cn("flex text-2xl leading-relaxed", !isCustom && themeStyles[theme].text)}
                        style={textStyleObj}
                      >
                        <span className={cn("inline-block w-4 h-4 rounded-full mt-3.5 mr-6 flex-shrink-0", !isCustom && themeStyles[theme].accent)} style={accentStyleObj} />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="w-full flex justify-between border-t border-black/5 dark:border-white/5 pt-4 text-sm font-semibold opacity-50">
                <span style={textStyleObj}>{data.title}</span>
                <span style={textStyleObj}>{sIdx + 1} / {data.slides.length}</span>
              </div>
            </div>

            {/* Slide Quiz Page */}
            {slide.quiz && (
              <div
                id={`pdf-slide-quiz-${sIdx}`}
                className={cn(
                  "w-[1280px] h-[720px] p-16 flex flex-col justify-between relative bg-white",
                  !isCustom && themeStyles[theme].bg,
                  isCustom && customSettings?.fontFamily
                )}
                style={{
                  backgroundColor: isCustom ? customSettings?.backgroundColor : undefined,
                  fontFamily: isCustom ? customSettings?.fontFamily : undefined,
                }}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 px-3.5 py-1.5 rounded-full border border-amber-200">
                    Knowledge Check Assessment
                  </span>
                </div>
                <h2 
                  className={cn("text-5xl font-extrabold my-8", !isCustom && themeStyles[theme].title)}
                  style={titleStyleObj}
                >
                  {slide.title} — Quiz
                </h2>
                <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col justify-center">
                  <p className={cn("text-2xl font-bold mb-8", !isCustom && themeStyles[theme].text)} style={textStyleObj}>
                    {slide.quiz.question}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {slide.quiz.options.map((opt, oIdx) => {
                      const isCorrect = oIdx === slide.quiz?.correctAnswerIndex;
                      return (
                        <div
                          key={oIdx}
                          className={cn(
                            "p-5 rounded-xl border text-lg font-semibold flex items-center justify-between",
                            isCorrect
                              ? "bg-green-50 border-green-500 text-green-900"
                              : "bg-black/5 border-transparent text-gray-700 dark:text-slate-300"
                          )}
                        >
                          <span>{opt}</span>
                          {isCorrect && (
                            <span className="text-[10px] font-extrabold bg-green-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wider">Correct Answer</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="w-full flex justify-between border-t border-black/5 dark:border-white/5 pt-4 text-sm font-semibold opacity-50">
                  <span style={textStyleObj}>{data.title} — Quiz Check</span>
                  <span style={textStyleObj}>{sIdx + 1} / {data.slides.length}</span>
                </div>
              </div>
            )}

          </React.Fragment>
        ))}
      </div>

    </div>
  );
}
