export interface InteractiveQuiz {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface InteractiveLink {
  title: string;
  url: string;
}

export interface SlideGraphic {
  type: 'process' | 'comparison' | 'metrics' | 'hierarchy' | 'pie';
  title?: string;
  elements: {
    label: string;
    value?: string;
    secondaryText?: string;
    percentage?: number; // for progress, visual charts (0-100)
    icon?: string; // name of lucide icon if any
  }[];
}

export interface SlideContent {
  id: string;
  title: string;
  content: string[];
  speakerNotes: string;
  quiz?: InteractiveQuiz;
  links?: InteractiveLink[];
  videoUrl?: string; // e.g., YouTube embed URL
  graphic?: SlideGraphic;
}

export interface PresentationData {
  title: string;
  slides: SlideContent[];
}

export type ThemeName = 'modern' | 'limefrost' | 'cosmic' | 'minimal' | 'custom';

export interface CustomizationSettings {
  fontFamily: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  spacing: 'compact' | 'normal' | 'relaxed';
  alignment: 'left' | 'center' | 'right';
}
