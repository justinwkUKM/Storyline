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
  style?: string;
  elements: {
    label: string;
    value?: string;
    secondaryText?: string;
    percentage?: number; // for progress, visual charts (0-100)
    icon?: string; // name of lucide icon if any
  }[];
}

export type ExecutiveSlideMode = 'executive-report' | 'bold-infographic';

export type ExecutiveVisualPalette = 'blue' | 'green' | 'dark-green' | 'deep-blue' | 'neutral';

export interface ExecutiveVisualAsset {
  key: string;
  prompt: string;
  url?: string;
  status?: 'pending' | 'ready' | 'failed';
  alt?: string;
}

export type ExecutiveLayoutArchetype =
  | 'three-card-story'
  | 'two-column-comparison'
  | 'metric-dashboard'
  | 'five-stage-model'
  | 'formal-landscape'
  | 'title-poster'
  | 'summary-dashboard';

export interface ExecutiveSlideCard {
  number?: string;
  heading: string;
  subheading?: string;
  points: string[];
  takeaway?: string;
  accent?: 'blue' | 'green' | 'teal' | 'orange' | 'yellow' | 'magenta' | 'red' | 'neutral';
  icon?: string;
  illustration?: string; // Backward-compatible legacy visual hint. Prefer visualAsset.
  visualAsset?: ExecutiveVisualAsset;
}


export interface ExecutiveBottomLine {
  label?: string;
  text: string;
  icon?: string;
  visualAsset?: ExecutiveVisualAsset;
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
  executiveMode?: ExecutiveSlideMode;
  layoutArchetype?: ExecutiveLayoutArchetype;
  eyebrow?: string;
  framingStatement?: string;
  cards?: ExecutiveSlideCard[];
  bottomLine?: ExecutiveBottomLine;
  heroVisualAsset?: ExecutiveVisualAsset;
  dominantColor?: 'blue' | 'deep-blue' | 'green' | 'dark-green' | 'white' | 'light';
}

export interface PresentationData {
  title: string;
  slides: SlideContent[];
  rawParsedText?: string;
  orientation?: 'horizontal' | 'vertical';
}

export interface SourceContext {
  sourceType: 'pdf' | 'text' | 'url';
  label: string;
  title?: string;
  text: string;
}

export type GenerationSource =
  | { sourceType: 'pdf'; file: File }
  | { sourceType: 'text'; sourceText: string }
  | { sourceType: 'url'; sourceUrl: string };

export type ThemeName = 'modern' | 'limefrost' | 'cosmic' | 'minimal' | 'sunset' | 'ocean' | 'lavender' | 'rose' | 'executiveInfographic' | 'custom';

export interface CustomizationSettings {
  fontFamily: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  spacing: 'compact' | 'normal' | 'relaxed';
  alignment: 'left' | 'center' | 'right';
}

export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
  credits: number;
  creditsResetAt: string;
}

export interface DeckSummary {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  hasShare?: boolean;
}

export interface SavedDeck extends DeckSummary {
  presentationData: PresentationData;
  theme: ThemeName;
  customSettings?: CustomizationSettings;
  sourceContext?: SourceContext;
}

export interface ShareLinkInfo {
  token: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}
