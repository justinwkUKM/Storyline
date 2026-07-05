import React, { useState, useEffect, useCallback, useLayoutEffect, useMemo, useRef } from 'react';
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
  Loader2,
  Edit3,
  Video,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Palette
} from 'lucide-react';
import { cn } from '../lib/utils';
import { InteractiveGraphic } from './InteractiveGraphic';
import { jsPDF } from 'jspdf';
import pptxgen from 'pptxgenjs';
import { sanitizeRichTextHtml, stripRichTextHtml } from '../lib/richText';
import { THEMES, themeStyles } from '../lib/themes';
import { captureSlideCanvas, waitForLayout } from '../lib/export';

interface PresentationProps {
  data: PresentationData;
  theme: ThemeName;
  customSettings?: CustomizationSettings;
  onClose: () => void;
  onEdit?: () => void;
  onThemeChange?: (theme: ThemeName, customSettings?: CustomizationSettings) => void;
  readOnly?: boolean;
}

type SlideDensity = 'roomy' | 'normal' | 'compact' | 'dense' | 'cramped';

const ZOOM_STEPS = [0.75, 0.85, 1, 1.1, 1.2] as const;
const DENSITY_ORDER: SlideDensity[] = ['roomy', 'normal', 'compact', 'dense', 'cramped'];

const DENSITY_CLASSES: Record<SlideDensity, {
  slidePadding: string;
  title: string;
  titleMargin: string;
  contentGap: string;
  bodyWithGraphic: string;
  bodyNoGraphic: string;
  listSpacing: string;
  graphicBox: string;
  graphicMinHeight: string;
  footerTop: string;
}> = {
  roomy: {
    slidePadding: 'p-8 md:p-12',
    title: 'text-2xl md:text-3xl',
    titleMargin: 'pb-4 mb-6',
    contentGap: 'gap-4 md:gap-8 lg:gap-10',
    bodyWithGraphic: 'text-base md:text-lg',
    bodyNoGraphic: 'text-lg md:text-xl lg:text-2xl',
    listSpacing: 'space-y-5',
    graphicBox: 'p-4',
    graphicMinHeight: 'min-h-[300px]',
    footerTop: 'pt-4 mt-6'
  },
  normal: {
    slidePadding: 'p-7 md:p-10',
    title: 'text-xl md:text-3xl',
    titleMargin: 'pb-3.5 mb-5',
    contentGap: 'gap-4 md:gap-6 lg:gap-8',
    bodyWithGraphic: 'text-sm md:text-base lg:text-lg',
    bodyNoGraphic: 'text-base md:text-lg lg:text-xl',
    listSpacing: 'space-y-4',
    graphicBox: 'p-3.5',
    graphicMinHeight: 'min-h-[280px]',
    footerTop: 'pt-3.5 mt-5'
  },
  compact: {
    slidePadding: 'p-6 md:p-8',
    title: 'text-lg md:text-2xl',
    titleMargin: 'pb-3 mb-4',
    contentGap: 'gap-3 md:gap-5 lg:gap-6',
    bodyWithGraphic: 'text-xs md:text-sm lg:text-base',
    bodyNoGraphic: 'text-sm md:text-base lg:text-lg',
    listSpacing: 'space-y-3',
    graphicBox: 'p-3',
    graphicMinHeight: 'min-h-[240px]',
    footerTop: 'pt-3 mt-4'
  },
  dense: {
    slidePadding: 'p-5 md:p-7',
    title: 'text-base md:text-xl lg:text-2xl',
    titleMargin: 'pb-2.5 mb-3',
    contentGap: 'gap-3 md:gap-4 lg:gap-5',
    bodyWithGraphic: 'text-[11px] md:text-xs lg:text-sm',
    bodyNoGraphic: 'text-xs md:text-sm lg:text-base',
    listSpacing: 'space-y-2',
    graphicBox: 'p-2.5',
    graphicMinHeight: 'min-h-[210px]',
    footerTop: 'pt-2.5 mt-3'
  },
  cramped: {
    slidePadding: 'p-4 md:p-6',
    title: 'text-sm md:text-lg lg:text-xl',
    titleMargin: 'pb-2 mb-2.5',
    contentGap: 'gap-2.5 md:gap-3 lg:gap-4',
    bodyWithGraphic: 'text-[10px] md:text-[11px] lg:text-xs',
    bodyNoGraphic: 'text-[11px] md:text-xs lg:text-sm',
    listSpacing: 'space-y-1.5',
    graphicBox: 'p-2',
    graphicMinHeight: 'min-h-[180px]',
    footerTop: 'pt-2 mt-2.5'
  }
};

function stripHtml(html: string): string {
  if (!html) return '';
  return stripRichTextHtml(html);
}

const DEFAULT_CUSTOM_SETTINGS: CustomizationSettings = {
  fontFamily: 'font-sans',
  primaryColor: '#a3e635',
  backgroundColor: '#f7fee7',
  textColor: '#1a2e05',
  spacing: 'normal',
  alignment: 'left'
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getDensityIndex(density: SlideDensity) {
  return DENSITY_ORDER.indexOf(density);
}

function getDensityByIndex(index: number): SlideDensity {
  return DENSITY_ORDER[clamp(index, 0, DENSITY_ORDER.length - 1)];
}

function getSlideDensity(
  slide: PresentationData['slides'][number],
  isTitleSlide: boolean,
  isVertical: boolean,
  activeTab: 'content' | 'quiz' | 'links'
): SlideDensity {
  if (isTitleSlide) {
    const titleScore = slide.title.length + (isVertical ? 24 : 0);
    if (titleScore > 110) return 'dense';
    if (titleScore > 76) return 'compact';
    return 'roomy';
  }

  if (activeTab === 'quiz') {
    const quizScore = (slide.quiz?.question.length || 0) + (slide.quiz?.options.join('').length || 0);
    if (quizScore > 520) return 'cramped';
    if (quizScore > 360) return 'dense';
    if (quizScore > 240) return 'compact';
    return 'normal';
  }

  if (activeTab === 'links') {
    const linkScore = (slide.links?.length || 0) * 70 + (slide.links || []).reduce((sum, link) => sum + link.title.length, 0);
    if (linkScore > 520) return 'dense';
    if (linkScore > 320) return 'compact';
    return 'normal';
  }

  const textLength = slide.content.reduce((sum, point) => sum + stripHtml(point).length, 0);
  const longestPoint = slide.content.reduce((max, point) => Math.max(max, stripHtml(point).length), 0);
  const score =
    slide.title.length * 1.2 +
    textLength +
    longestPoint * 0.55 +
    slide.content.length * 52 +
    (slide.graphic ? 110 : 0) +
    (isVertical ? 150 : 0);

  if (score > 1120) return 'cramped';
  if (score > 840) return 'dense';
  if (score > 610) return 'compact';
  if (score > 360) return 'normal';
  return 'roomy';
}

export function Presentation({ data, theme, customSettings, onClose, onEdit, onThemeChange, readOnly = false }: PresentationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [direction, setDirection] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(2);
  const [displayTheme, setDisplayTheme] = useState<ThemeName>(theme);
  const [displayCustomSettings, setDisplayCustomSettings] = useState<CustomizationSettings | undefined>(customSettings);
  const [densityBump, setDensityBump] = useState(0);
  const [exportDensityBumps, setExportDensityBumps] = useState<Record<string, number>>({});
  const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const contentMeasureRef = useRef<HTMLDivElement | null>(null);
  
  // Compartmentalized Tab State
  const [activeTab, setActiveTab] = useState<'content' | 'quiz' | 'links'>('content');
  
  // Download states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');

  useEffect(() => {
    setDisplayTheme(theme);
    setDisplayCustomSettings(customSettings);
  }, [theme, customSettings]);

  // Reset states on slide change
  useEffect(() => {
    setSelectedAnswer(null);
    setShowVideo(false);
    setActiveTab('content');
  }, [currentIndex]);

  const style = themeStyles[displayTheme];

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

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
  const isVertical = data.orientation === 'vertical';
  const zoom = ZOOM_STEPS[zoomIndex];
  const aspectRatio = isVertical ? 3 / 4 : 16 / 9;
  const availableSlideWidth = Math.max(280, viewportSize.width - 24);
  const availableSlideHeight = Math.max(280, viewportSize.height - 136);
  const baseSlideWidth = Math.min(availableSlideWidth, availableSlideHeight * aspectRatio);
  const slideWidth = clamp(baseSlideWidth * zoom, Math.min(280, availableSlideWidth), availableSlideWidth);
  const baseDensity = useMemo(
    () => getSlideDensity(currentSlide, isTitleSlide, isVertical, activeTab),
    [activeTab, currentSlide, isTitleSlide, isVertical]
  );
  const density = getDensityByIndex(getDensityIndex(baseDensity) + densityBump);
  const densityClasses = DENSITY_CLASSES[density];

  const isCustom = displayTheme === 'custom';
  const activeCustomSettings = displayCustomSettings || DEFAULT_CUSTOM_SETTINGS;
  const containerStyle = isCustom ? { backgroundColor: activeCustomSettings.backgroundColor } : undefined;
  const textStyleObj = isCustom ? { color: activeCustomSettings.textColor } : undefined;
  const titleStyleObj = isCustom ? { color: activeCustomSettings.textColor } : undefined;
  const accentStyleObj = isCustom ? { backgroundColor: activeCustomSettings.primaryColor } : undefined;

  const getSpacingClass = () => {
    if (!isCustom) return densityClasses.listSpacing;
    if (activeCustomSettings.spacing === 'compact') return density === 'cramped' ? 'space-y-1' : 'space-y-2';
    if (activeCustomSettings.spacing === 'relaxed') return density === 'roomy' ? 'space-y-8' : 'space-y-4';
    return densityClasses.listSpacing;
  };

  const getAlignmentClass = () => {
    if (!isCustom) return 'justify-start text-left';
    if (activeCustomSettings.alignment === 'center') return 'justify-center text-center items-center';
    if (activeCustomSettings.alignment === 'right') return 'justify-start text-right items-end';
    return 'justify-start text-left items-start';
  };

  const getAlignmentClassForList = () => {
    if (!isCustom) return 'items-start text-left';
    if (activeCustomSettings.alignment === 'center') return 'items-center text-center';
    if (activeCustomSettings.alignment === 'right') return 'items-end text-right flex-row-reverse';
    return 'items-start text-left';
  };

  // Determine sub-tabs existence for the active slide
  const hasQuiz = !!currentSlide.quiz;
  const hasLinks = !!currentSlide.links && currentSlide.links.length > 0;
  const showTabs = !isTitleSlide && (hasQuiz || hasLinks);

  useEffect(() => {
    setDensityBump(0);
  }, [activeTab, currentIndex, displayTheme, displayCustomSettings]);

  useLayoutEffect(() => {
    if (isTitleSlide) return;
    const el = contentMeasureRef.current;
    if (!el) return;

    const timeoutId = window.setTimeout(() => {
      const overflowAmount = el.scrollHeight - el.clientHeight;
      if (overflowAmount > 4 && densityBump < DENSITY_ORDER.length - 1) {
        setDensityBump((current) => Math.min(current + 1, DENSITY_ORDER.length - 1));
      }
    }, 80);

    return () => window.clearTimeout(timeoutId);
  }, [activeTab, currentIndex, data.slides, densityBump, displayTheme, isTitleSlide]);

  const handleThemeSelect = (nextTheme: ThemeName) => {
    const nextSettings = nextTheme === 'custom' ? activeCustomSettings : undefined;
    setDisplayTheme(nextTheme);
    setDisplayCustomSettings(nextSettings);
    onThemeChange?.(nextTheme, nextSettings);
  };

  const zoomOut = () => setZoomIndex((current) => Math.max(0, current - 1));
  const zoomIn = () => setZoomIndex((current) => Math.min(ZOOM_STEPS.length - 1, current + 1));
  const resetZoom = () => setZoomIndex(2);
  const clearExportDensityBumps = () => setExportDensityBumps({});
  const getExportPageElement = (slideIndex: number, pageType: 'content' | 'quiz') =>
    document.getElementById(`pdf-slide-${pageType}-${slideIndex}`) as HTMLElement | null;

  const fitExportPage = async (slideIndex: number, pageType: 'content' | 'quiz') => {
    const slideKey = `${pageType}-${slideIndex}`;
    for (let attempt = 0; attempt < DENSITY_ORDER.length; attempt++) {
      const element = getExportPageElement(slideIndex, pageType);
      if (!element) return null;

      await waitForLayout(element, 2);
      const overflowAmount = element.scrollHeight - element.clientHeight;
      if (overflowAmount <= 4) {
        return element;
      }

      setExportDensityBumps((current) => ({
        ...current,
        [slideKey]: Math.min((current[slideKey] ?? 0) + 1, DENSITY_ORDER.length - 1)
      }));
    }

    return getExportPageElement(slideIndex, pageType);
  };

  const captureExportPage = async (
    slideIndex: number,
    pageType: 'content' | 'quiz',
    width: number,
    height: number,
    backgroundColor: string,
    scale = 2
  ) => {
    const element = await fitExportPage(slideIndex, pageType);
    if (!element) return null;
    await waitForLayout(element, 2);
    return captureSlideCanvas(element, {
      width,
      height,
      scale,
      backgroundColor
    });
  };

  // High-fidelity PDF Download
  const exportToPDF = async () => {
    setIsDownloading(true);
    setDownloadProgress('Preparing high-res PDF...');

    try {
      const pdfWidth = isVertical ? 720 : 1280;
      const pdfHeight = isVertical ? 960 : 720;
      const pdfOrientation = isVertical ? 'portrait' : 'landscape';
      const backgroundColor = isCustom
        ? activeCustomSettings.backgroundColor
        : displayTheme === 'cosmic'
          ? '#0b0f19'
          : displayTheme === 'limefrost'
            ? '#f7fee7'
            : displayTheme === 'sunset'
              ? '#fff7ed'
              : displayTheme === 'ocean'
                ? '#ecfeff'
                : displayTheme === 'lavender'
                  ? '#f5f3ff'
                  : displayTheme === 'rose'
                    ? '#fff1f2'
                    : '#ffffff';

      const pdf = new jsPDF({
        orientation: pdfOrientation,
        unit: 'px',
        format: [pdfWidth, pdfHeight]
      });

      let pageCount = 0;
      for (let i = 0; i < data.slides.length; i++) {
        setDownloadProgress(`Rendering slide ${i + 1} of ${data.slides.length}...`);
        const contentCanvas = await captureExportPage(i, 'content', pdfWidth, pdfHeight, backgroundColor, 2);
        if (contentCanvas) {
          if (pageCount > 0) {
            pdf.addPage([pdfWidth, pdfHeight], pdfOrientation);
          }
          pdf.addImage(contentCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
          pageCount++;
        }

        if (data.slides[i].quiz) {
          setDownloadProgress(`Rendering quiz for slide ${i + 1}...`);
          const quizCanvas = await captureExportPage(i, 'quiz', pdfWidth, pdfHeight, backgroundColor, 2);
          if (quizCanvas) {
            pdf.addPage([pdfWidth, pdfHeight], pdfOrientation);
            pdf.addImage(quizCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
            pageCount++;
          }
        }
      }

      const fileName = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_presentation.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Could not export PDF: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      clearExportDensityBumps();
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
      if (isVertical) {
        pptx.defineLayout({ name: 'PORTRAIT', width: 7.5, height: 10 });
        pptx.layout = 'PORTRAIT';
      } else {
        pptx.layout = 'LAYOUT_16x9';
      }

      const bgColorHex = isCustom
        ? activeCustomSettings.backgroundColor
        : displayTheme === 'cosmic'
          ? '#0b0f19'
          : displayTheme === 'limefrost'
            ? '#f7fee7'
            : displayTheme === 'sunset'
              ? '#fff7ed'
              : displayTheme === 'ocean'
                ? '#ecfeff'
                : displayTheme === 'lavender'
                  ? '#f5f3ff'
                  : displayTheme === 'rose'
                    ? '#fff1f2'
                    : '#ffffff';
      const pptWidth = isVertical ? 7.5 : 13.333;
      const pptHeight = isVertical ? 10 : 7.5;

      for (let sIdx = 0; sIdx < data.slides.length; sIdx++) {
        const slide = data.slides[sIdx];
        const pptSlide = pptx.addSlide();
        pptSlide.background = { fill: bgColorHex };

        const contentCanvas = await captureExportPage(sIdx, 'content', isVertical ? 720 : 1280, isVertical ? 960 : 720, bgColorHex, 2);
        if (contentCanvas) {
          pptSlide.addImage({
            data: contentCanvas.toDataURL('image/png'),
            x: 0,
            y: 0,
            w: pptWidth,
            h: pptHeight
          });
        }

        if (slide.links && slide.links.length > 0) {
          const linksSlide = pptx.addSlide();
          linksSlide.background = { fill: bgColorHex };
          linksSlide.addText(`${slide.title} - Links`, {
            x: '5%',
            y: '8%',
            w: '90%',
            h: '8%',
            fontSize: 24,
            bold: true,
            color: isCustom ? activeCustomSettings.primaryColor : displayTheme === 'cosmic' ? '#7c3aed' : '#2563eb',
            fontFace: 'Arial'
          });

          slide.links.forEach((link, index) => {
            linksSlide.addText([
              {
                text: `${index + 1}. ${link.title} `,
                options: { bold: true, color: isCustom ? activeCustomSettings.textColor : '#1f2937' }
              },
              {
                text: link.url,
                options: {
                  color: '#2563eb',
                  hyperlink: { url: link.url }
                }
              }
            ] as any, {
              x: '6%',
              y: `${18 + index * 10}%`,
              w: '88%',
              h: '8%',
              fontSize: 14,
              fontFace: 'Arial'
            });
          });
        }

        if (slide.quiz) {
          const quizCanvas = await captureExportPage(sIdx, 'quiz', isVertical ? 720 : 1280, isVertical ? 960 : 720, bgColorHex, 2);
          if (quizCanvas) {
            const quizSlide = pptx.addSlide();
            quizSlide.background = { fill: bgColorHex };
            quizSlide.addImage({
              data: quizCanvas.toDataURL('image/png'),
              x: 0,
              y: 0,
              w: pptWidth,
              h: pptHeight
            });
          }
        }
      }

      const fileName = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_presentation.pptx`;
      await pptx.writeFile({ fileName });
    } catch (err) {
      console.error('Failed to export PPTX:', err);
      alert('Could not export PPTX: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      clearExportDensityBumps();
      setIsDownloading(false);
      setDownloadProgress('');
    }
  };

  // Slideshow Video (MP4/WebM) Download
  const exportToMP4 = async () => {
    setIsDownloading(true);
    setDownloadProgress('Preparing high-res slides for video...');

    try {
      const canvasWidth = isVertical ? 720 : 1280;
      const canvasHeight = isVertical ? 960 : 720;
      const backgroundColor = isCustom
        ? activeCustomSettings.backgroundColor
        : displayTheme === 'cosmic'
          ? '#0b0f19'
          : displayTheme === 'limefrost'
            ? '#f7fee7'
            : displayTheme === 'sunset'
              ? '#fff7ed'
              : displayTheme === 'ocean'
                ? '#ecfeff'
                : displayTheme === 'lavender'
                  ? '#f5f3ff'
                  : displayTheme === 'rose'
                    ? '#fff1f2'
                    : '#ffffff';

      const slideCanvases: HTMLCanvasElement[] = [];

      for (let i = 0; i < data.slides.length; i++) {
        setDownloadProgress(`Rendering slide ${i + 1} of ${data.slides.length}...`);
        const contentCanvas = await captureExportPage(i, 'content', canvasWidth, canvasHeight, backgroundColor, 2);
        if (contentCanvas) {
          slideCanvases.push(contentCanvas);
        }

        if (data.slides[i].quiz) {
          setDownloadProgress(`Rendering quiz for slide ${i + 1}...`);
          const quizCanvas = await captureExportPage(i, 'quiz', canvasWidth, canvasHeight, backgroundColor, 2);
          if (quizCanvas) {
            slideCanvases.push(quizCanvas);
          }
        }
      }

      if (slideCanvases.length === 0) {
        throw new Error('No slides successfully rendered to video.');
      }

      const selectedMimeTypes = [
        'video/mp4',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
      ];
      let selectedMimeType = '';
      for (const mimeType of selectedMimeTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error('This browser does not support video recording API.');
      }

      const formatLabel = selectedMimeType.includes('mp4') ? 'MP4' : 'WebM';
      setDownloadProgress(`Recording video (${formatLabel}) 0%...`);

      // Step 2: Create master canvas and start MediaRecorder
      const masterCanvas = document.createElement('canvas');
      masterCanvas.width = canvasWidth;
      masterCanvas.height = canvasHeight;
      const ctx = masterCanvas.getContext('2d')!;

      const stream = masterCanvas.captureStream(30); // 30 fps
      const recorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
      const recordedChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      const slideDuration = 3000;
      const totalDuration = slideCanvases.length * slideDuration;
      const fadeDuration = 500;

      const recordingPromise = new Promise<void>((resolve, reject) => {
        recorder.onstop = () => {
          try {
            const blob = new Blob(recordedChunks, { type: selectedMimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const isMp4 = selectedMimeType.includes('mp4');
            a.download = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_presentation.${isMp4 ? 'mp4' : 'webm'}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        recorder.onerror = (e) => reject(e);
      });

      // Start recording
      recorder.start();

      const startTime = performance.now();

      // Step 3: Draw frames onto master canvas in a loop with simple crossfades
      await new Promise<void>((resolve, reject) => {
        const renderLoop = () => {
          const elapsed = performance.now() - startTime;
          if (elapsed >= totalDuration) {
            // Draw last frame one final time
            const lastFrame = slideCanvases[slideCanvases.length - 1];
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.drawImage(lastFrame, 0, 0, canvasWidth, canvasHeight);
            recorder.stop();
            resolve();
            return;
          }

          const currentSlideIdx = Math.floor(elapsed / slideDuration);
          const timeInSlide = elapsed - (currentSlideIdx * slideDuration);
          const currentFrame = slideCanvases[currentSlideIdx];
          const previousFrame = currentSlideIdx > 0 ? slideCanvases[currentSlideIdx - 1] : null;
          const nextFrame = currentSlideIdx < slideCanvases.length - 1 ? slideCanvases[currentSlideIdx + 1] : null;

          ctx.clearRect(0, 0, canvasWidth, canvasHeight);
          if (currentFrame) {
            if (timeInSlide < fadeDuration && previousFrame) {
              const alpha = timeInSlide / fadeDuration;
              ctx.globalAlpha = 1 - alpha;
              ctx.drawImage(previousFrame, 0, 0, canvasWidth, canvasHeight);
              ctx.globalAlpha = alpha;
              ctx.drawImage(currentFrame, 0, 0, canvasWidth, canvasHeight);
              ctx.globalAlpha = 1;
            } else if (timeInSlide > slideDuration - fadeDuration && nextFrame) {
              const alpha = (timeInSlide - (slideDuration - fadeDuration)) / fadeDuration;
              ctx.globalAlpha = 1 - alpha;
              ctx.drawImage(currentFrame, 0, 0, canvasWidth, canvasHeight);
              ctx.globalAlpha = alpha;
              ctx.drawImage(nextFrame, 0, 0, canvasWidth, canvasHeight);
              ctx.globalAlpha = 1;
            } else {
              ctx.globalAlpha = 1;
              ctx.drawImage(currentFrame, 0, 0, canvasWidth, canvasHeight);
            }
          }

          // Update progress
          const percentage = Math.min(100, Math.round((elapsed / totalDuration) * 100));
          setDownloadProgress(`Recording video (${formatLabel}) ${percentage}%...`);

          requestAnimationFrame(renderLoop);
        };

        requestAnimationFrame(renderLoop);
      });

      await recordingPromise;

    } catch (err: any) {
      console.error('Failed to export video:', err);
      alert('Could not export video: ' + (err.message || 'Unknown error'));
    } finally {
      clearExportDensityBumps();
      setIsDownloading(false);
      setDownloadProgress('');
    }
  };

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-colors duration-500 p-3 md:p-4 gap-3", 
        !isCustom && style.bg, 
        isCustom && activeCustomSettings.fontFamily
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
      <div
        className="w-full flex-1 flex items-center justify-center min-h-0"
        style={{
          width: `${slideWidth}px`
        }}
      >
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
              "w-full rounded-3xl shadow-xl border overflow-hidden flex flex-col relative bg-white", 
              isVertical ? "aspect-[3/4]" : "aspect-video",
              densityClasses.slidePadding,
              !isCustom && style.bg, 
              isTitleSlide ? "justify-center items-center text-center" : getAlignmentClass()
            )}
            style={{
               boxShadow: displayTheme === 'minimal' ? 'none' : '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
               borderColor: displayTheme === 'minimal' ? '#e5e7eb' : displayTheme === 'cosmic' ? '#334155' : '#f1f5f9',
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
                  className={cn("font-extrabold mb-4", isVertical ? "text-2xl md:text-3xl" : "text-4xl md:text-5xl lg:text-6xl", density === 'dense' && "lg:text-5xl", density === 'cramped' && "lg:text-4xl", !isCustom && style.title)}
                  style={titleStyleObj}
                >
                  {currentSlide.title}
                </motion.h1>
                <motion.p
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ delay: 0.45 }}
                   className={cn("opacity-75 max-w-2xl font-medium", isVertical ? "text-sm md:text-base" : "text-lg md:text-xl", !isCustom && style.text)}
                   style={textStyleObj}
                >
                   {data.title !== currentSlide.title ? data.title : 'Interactive Presentation Deck'}
                </motion.p>
              </>
            ) : (
              // ---------------- STANDARD SLIDE VIEW ----------------
              <>
                {/* Header Compartment: Title + Sub-Tabs */}
                <div className={cn("w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 flex-shrink-0", densityClasses.titleMargin)}>
                  <motion.h2 
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className={cn("font-bold leading-tight", densityClasses.title, !isCustom && style.title)}
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
                              ? "bg-white text-lime-700 shadow-sm dark:bg-slate-800 dark:text-lime-400"
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

                {/* Content Area Compartment */}
                <div ref={contentMeasureRef} className="flex-1 w-full min-h-0 overflow-hidden flex flex-col">
                  
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
                        <div className={cn("grid items-center w-full", densityClasses.contentGap, isVertical ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-12")}>
                          
                          {/* Bullet points on Left column */}
                          <div className={cn(isVertical ? "col-span-1" : "lg:col-span-5", "flex flex-col justify-center")}>
                            <ul className={cn(getSpacingClass(), "w-full")}>
                              {currentSlide.content.map((point, idx) => (
                                <motion.li
                                  key={idx}
                                  initial={{ opacity: 0, x: -15 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.15 + (idx * 0.08) }}
                                  className={cn("flex leading-snug md:leading-relaxed", isVertical ? "text-[10px] md:text-xs" : densityClasses.bodyWithGraphic, !isCustom && style.text, getAlignmentClassForList())}
                                  style={textStyleObj}
                                >
                                  <span className={cn("inline-block rounded-full mt-2 mr-3 flex-shrink-0", isVertical ? "w-1.5 h-1.5" : "w-2 h-2", !isCustom && style.accent, activeCustomSettings.alignment === 'right' ? 'mr-0 ml-3' : 'ml-0 mr-3', activeCustomSettings.alignment === 'center' ? 'hidden' : '')} style={accentStyleObj} />
                                  <span className={cn(activeCustomSettings.alignment === 'center' && 'text-center')} dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(point) }} />
                                </motion.li>
                              ))}
                            </ul>

                            {/* Supplementary Embedded Video launcher */}
                            {currentSlide.videoUrl && (
                              <button
                                onClick={() => setShowVideo(true)}
                                className={cn("flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 hover:bg-black/10 text-[10px] md:text-xs font-semibold text-left transition-colors cursor-pointer w-fit", isVertical ? "mt-3" : "mt-6")}
                              >
                                <PlayCircle className="w-4 h-4 text-lime-500" />
                                <span style={textStyleObj}>Watch Video</span>
                              </button>
                            )}
                          </div>

                          {/* Interactive premium Graphic on Right column */}
                          <div className={cn("flex flex-col justify-center bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 shadow-inner", densityClasses.graphicBox, isVertical ? "col-span-1 min-h-[150px]" : "lg:col-span-7", !isVertical && densityClasses.graphicMinHeight)}>
                            <InteractiveGraphic
                              graphic={currentSlide.graphic}
                              accentClass={!isCustom ? style.accent : ''}
                              accentStyleObj={accentStyleObj}
                              isDarkTheme={displayTheme === 'cosmic'}
                              isVerticalMode={isVertical}
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
                              className={cn("flex leading-snug md:leading-relaxed", densityClasses.bodyNoGraphic, !isCustom && style.text, getAlignmentClassForList())}
                              style={textStyleObj}
                            >
                              <span className={cn("inline-block w-2.5 h-2.5 rounded-full mt-2.5 mr-4 flex-shrink-0", !isCustom && style.accent, activeCustomSettings.alignment === 'right' ? 'mr-0 ml-4' : 'ml-0 mr-4', activeCustomSettings.alignment === 'center' ? 'hidden' : '')} style={accentStyleObj} />
                              <span className={cn(activeCustomSettings.alignment === 'center' && 'text-center')} dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(point) }} />
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
                              <ExternalLink className="w-5 h-5 text-lime-500 flex-shrink-0" />
                              <span className="font-semibold text-sm truncate" style={textStyleObj}>{link.title}</span>
                            </div>
                            <span className="text-xs text-lime-700 font-bold hover:underline flex-shrink-0 flex items-center gap-1">
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
            <div className={cn("w-full flex items-center justify-between border-t border-black/5 dark:border-white/5 text-xs font-semibold opacity-60 flex-shrink-0", densityClasses.footerTop)}>
              <span className="truncate pr-4" style={textStyleObj}>
                {isTitleSlide ? 'Interactive Storyline' : `Slide ${currentIndex + 1}: ${currentSlide.title}`}
              </span>
              <span className="font-mono" style={textStyleObj}>
                {currentIndex + 1} / {data.slides.length}
              </span>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

      {/* UnifiedFrosted Presenter Control Bar (Horizontal layout placed underneath slide box - NO OVERLAP) */}
      <div className="w-full max-w-6xl flex flex-col xl:flex-row items-center justify-between gap-3 px-4 py-3 bg-lime-950/95 border border-lime-800/40 backdrop-blur-md rounded-3xl shadow-xl z-50 transition-all">
        {/* Left segment: Slideshow Controls & Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-white/10 rounded-full p-1 border border-white/10">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-full text-lime-100/80 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              title="Previous Slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-mono font-black text-lime-200 px-3">
              {currentIndex + 1} / {data.slides.length}
            </span>
            <button
              onClick={handleNext}
              disabled={currentIndex === data.slides.length - 1}
              className="p-1.5 rounded-full text-lime-100/80 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              title="Next Slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="hidden lg:block text-[11px] font-black text-lime-300/60 uppercase tracking-widest truncate max-w-[200px]">
            {data.title}
          </div>
        </div>

        {/* Center/Right segment: Dual Exporters & Secondary Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {!readOnly && onThemeChange && (
            <label className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-full pl-3 pr-2 py-1 text-lime-100">
              <Palette className="w-3.5 h-3.5 text-lime-300" />
              <select
                value={displayTheme}
                onChange={(event) => handleThemeSelect(event.target.value as ThemeName)}
                className="bg-transparent text-xs font-black outline-none cursor-pointer max-w-[132px]"
                title="Change presentation theme"
              >
                {THEMES.map((option) => (
                  <option key={option.id} value={option.id} className="bg-lime-950 text-lime-50">
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="flex items-center gap-1 bg-white/10 rounded-full p-1 border border-white/10">
            <button
              onClick={zoomOut}
              disabled={zoomIndex === 0}
              className="p-1.5 rounded-full text-lime-100/80 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetZoom}
              className="min-w-14 px-2 py-1.5 rounded-full text-[10px] font-black text-lime-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Reset zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={zoomIn}
              disabled={zoomIndex === ZOOM_STEPS.length - 1}
              className="p-1.5 rounded-full text-lime-100/80 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={resetZoom}
            className="p-2 rounded-xl text-lime-300/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            title="Reset slide zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {!readOnly && onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 rounded-full text-xs font-black bg-lime-400 hover:bg-lime-300 active:scale-95 text-lime-950 flex items-center gap-1.5 transition-all cursor-pointer shadow-md border border-lime-300/40"
              title="Edit Slide Content & Visuals"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Slides
            </button>
          )}

          {isDownloading ? (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs text-white/90 animate-pulse font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-lime-400" />
              <span>{downloadProgress || 'Processing...'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {!readOnly && (
                <>
                  <button
                    onClick={exportToPDF}
                    className="px-4 py-2 rounded-full text-xs font-black bg-white/10 hover:bg-white/20 active:scale-95 text-lime-100 border border-white/5 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title="Download High-Res Presentation PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-lime-400" />
                    Download PDF
                  </button>
                  
                  <button
                    onClick={exportToPPTX}
                    className="px-4 py-2 rounded-full text-xs font-black bg-white/10 hover:bg-white/20 active:scale-95 text-lime-100 border border-white/5 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title="Download Editable PowerPoint (PPTX)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-orange-400" />
                    Download PPTX
                  </button>

                  <button
                    onClick={exportToMP4}
                    className="px-4 py-2 rounded-full text-xs font-black bg-white/10 hover:bg-white/20 active:scale-95 text-lime-100 border border-white/5 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title="Download Presentation Video"
                  >
                    <Video className="w-3.5 h-3.5 text-rose-400" />
                    Download Video
                  </button>
                </>
              )}
            </div>
          )}

          <div className="w-px h-5 bg-white/10 mx-1 hidden sm:block" />

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-lime-300/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            title="Toggle Fullscreen Mode"
          >
            <Maximize className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
            title={readOnly ? 'Return home' : 'Exit Presentation'}
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Speaker Notes Overlay (Frosted slide-up hover panel) */}
      {!readOnly && !isFullscreen && currentSlide.speakerNotes && (
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
        data-export-capture="true"
        className="absolute left-[-9999px] top-[-9999px] pointer-events-none overflow-hidden"
        style={{ width: isVertical ? '720px' : '1280px', height: isVertical ? '960px' : '720px' }}
      >
        <style>{`
          [data-export-capture="true"] .truncate {
            overflow: visible !important;
            text-overflow: clip !important;
            white-space: normal !important;
          }
          [data-export-capture="true"] .line-clamp-1,
          [data-export-capture="true"] .line-clamp-2,
          [data-export-capture="true"] .line-clamp-3 {
            display: block !important;
            overflow: visible !important;
            -webkit-line-clamp: unset !important;
            -webkit-box-orient: initial !important;
          }
          [data-export-capture="true"] [class*="text-[9px]"] {
            font-size: 12px !important;
          }
          [data-export-capture="true"] [class*="text-[10px]"] {
            font-size: 12px !important;
          }
          [data-export-capture="true"] [class*="text-[11px]"] {
            font-size: 12px !important;
          }
        `}</style>
        {data.slides.map((slide, sIdx) => {
          const contentKey = `content-${sIdx}`;
          const contentBump = exportDensityBumps[contentKey] ?? 0;
          const exportDensity = getDensityByIndex(getDensityIndex(getSlideDensity(slide, sIdx === 0, isVertical, 'content')) + contentBump);
          const exportIsTight = exportDensity === 'dense' || exportDensity === 'cramped';
          const exportIsCompact = exportDensity === 'compact';
          const exportPadding = exportIsTight ? 'p-8 md:p-10' : exportIsCompact ? 'p-10 md:p-12' : 'p-14 md:p-16';
          const exportTitleClass = exportIsTight
            ? (isVertical ? 'text-2xl mb-3' : 'text-4xl mb-5')
            : exportIsCompact
              ? (isVertical ? 'text-3xl mb-4' : 'text-[44px] mb-8')
              : (isVertical ? 'text-4xl mb-5' : 'text-5xl mb-10');
          const exportBulletClass = exportIsTight
            ? (isVertical ? 'text-base' : 'text-lg')
            : exportIsCompact
              ? (isVertical ? 'text-lg' : 'text-xl')
              : (isVertical ? 'text-xl' : 'text-[24px]');
          const exportNoGraphicBulletClass = exportIsTight
            ? (isVertical ? 'text-lg' : 'text-xl')
            : exportIsCompact
              ? (isVertical ? 'text-xl' : 'text-[22px]')
              : 'text-2xl';
          const exportListSpacing = exportIsTight ? 'space-y-2.5' : exportIsCompact ? 'space-y-3.5' : 'space-y-5';
          const exportGraphicHeight = isVertical ? 'h-[300px]' : 'h-[380px]';

          return (
          <React.Fragment key={sIdx}>
            
            {/* Slide Content Page */}
            <div
              id={`pdf-slide-content-${sIdx}`}
              className={cn(
                "flex flex-col justify-between relative bg-white animate-none",
                exportPadding,
                isVertical ? "w-[720px] h-[960px]" : "w-[1280px] h-[720px]",
                !isCustom && themeStyles[displayTheme].bg,
                isCustom && activeCustomSettings.fontFamily
              )}
              style={{
                backgroundColor: isCustom ? activeCustomSettings.backgroundColor : undefined,
                fontFamily: isCustom ? activeCustomSettings.fontFamily : undefined,
              }}
            >
              {sIdx === 0 ? (
                <div className="flex-1 w-full flex flex-col items-center justify-center text-center min-h-0">
                  <div className={cn("w-16 h-1.5 mb-6 rounded-full", !isCustom && themeStyles[displayTheme].accent)} style={accentStyleObj} />
                  <h2
                    className={cn("font-extrabold", isVertical ? "text-3xl md:text-4xl" : "text-5xl md:text-6xl", exportIsCompact && !isVertical && "text-[44px]", exportIsTight && !isVertical && "text-[38px]", !isCustom && themeStyles[displayTheme].title)}
                    style={titleStyleObj}
                  >
                    {slide.title}
                  </h2>
                  <p className={cn("mt-5 max-w-3xl opacity-80", isVertical ? "text-sm md:text-base" : "text-lg md:text-xl", !isCustom && themeStyles[displayTheme].text)} style={textStyleObj}>
                    {data.title !== slide.title ? data.title : 'Interactive Presentation Deck'}
                  </p>
                </div>
              ) : (
                <>
                  <h2
                    className={cn("font-extrabold", exportTitleClass, !isCustom && themeStyles[displayTheme].title)}
                    style={titleStyleObj}
                  >
                    {slide.title}
                  </h2>
                  <div className="flex-1 w-full flex min-h-0 items-center justify-between gap-6">
                    {slide.graphic ? (
                      <div className={cn("grid gap-6 w-full items-center", isVertical ? "grid-cols-1 mt-2" : "grid-cols-12 gap-10")}>
                        <div className={isVertical ? "col-span-1" : "col-span-5"}>
                          <ul className={exportListSpacing}>
                            {slide.content.map((point, idx) => (
                              <li
                                key={idx}
                                className={cn("flex leading-relaxed", exportBulletClass, !isCustom && themeStyles[displayTheme].text)}
                                style={textStyleObj}
                              >
                                <span className={cn("inline-block rounded-full mt-2 mr-4 flex-shrink-0", isVertical ? "w-2 h-2" : "w-3.5 h-3.5", !isCustom && themeStyles[displayTheme].accent)} style={accentStyleObj} />
                                <span dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(point) }} />
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className={cn("bg-black/5 dark:bg-white/5 rounded-2xl p-6 border border-black/5 dark:border-white/5 flex items-center justify-center", isVertical ? "col-span-1" : "col-span-7", exportGraphicHeight)}>
                          <InteractiveGraphic
                            graphic={slide.graphic}
                            accentClass={!isCustom ? themeStyles[displayTheme].accent : ''}
                            accentStyleObj={accentStyleObj}
                            isDarkTheme={displayTheme === 'cosmic'}
                            isVerticalMode={isVertical}
                            exportMode
                          />
                        </div>
                      </div>
                    ) : (
                      <ul className={cn(exportListSpacing, "w-full")}>
                        {slide.content.map((point, idx) => (
                          <li
                            key={idx}
                            className={cn("flex leading-relaxed", exportNoGraphicBulletClass, !isCustom && themeStyles[displayTheme].text)}
                            style={textStyleObj}
                          >
                            <span className={cn("inline-block w-4 h-4 rounded-full mt-3.5 mr-6 flex-shrink-0", !isCustom && themeStyles[displayTheme].accent)} style={accentStyleObj} />
                            <span dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(point) }} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="w-full flex justify-between border-t border-black/5 dark:border-white/5 pt-4 text-sm font-semibold opacity-50">
                    <span style={textStyleObj}>{data.title}</span>
                    <span style={textStyleObj}>{sIdx + 1} / {data.slides.length}</span>
                  </div>
                </>
              )}
            </div>

            {/* Slide Quiz Page */}
            {slide.quiz && (
              <div
                id={`pdf-slide-quiz-${sIdx}`}
                className={cn(
                  exportPadding,
                  "flex flex-col justify-between relative bg-white",
                  isVertical ? "w-[720px] h-[960px]" : "w-[1280px] h-[720px]",
                  !isCustom && themeStyles[displayTheme].bg,
                  isCustom && activeCustomSettings.fontFamily
                )}
                style={{
                  backgroundColor: isCustom ? activeCustomSettings.backgroundColor : undefined,
                  fontFamily: isCustom ? activeCustomSettings.fontFamily : undefined,
                }}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 px-3.5 py-1.5 rounded-full border border-amber-200">
                    Knowledge Check Assessment
                  </span>
                </div>
                <h2 
                  className={cn("font-extrabold my-8", exportIsTight ? (isVertical ? "text-2xl my-3" : "text-4xl my-5") : isVertical ? "text-3xl my-4" : "text-5xl my-8", !isCustom && themeStyles[displayTheme].title)}
                  style={titleStyleObj}
                >
                  {slide.title} — Quiz
                </h2>
                <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col justify-center">
                  <p className={cn("font-bold mb-8", isVertical ? "text-xl mb-4" : "text-2xl mb-8", !isCustom && themeStyles[displayTheme].text)} style={textStyleObj}>
                    {slide.quiz.question}
                  </p>
                  <div className={cn("grid gap-4", isVertical ? "grid-cols-1" : "grid-cols-2")}>
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
          );
        })}
      </div>

    </div>
  );
}
