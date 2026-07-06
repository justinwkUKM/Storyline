export interface GenerationOption {
  id: string;
  name: string;
  desc?: string;
}

export interface PromptChip {
  label: string;
  prompt: string;
  defaults: {
    presentationType?: string;
    tone?: string;
    audience?: string;
    narrativeStyle?: string;
  };
}

export const PRESENTATION_TYPES: GenerationOption[] = [
  { id: 'business_brief', name: 'Business Brief', desc: 'Concise recommendations and decision-ready takeaways.' },
  { id: 'sales_pitch', name: 'Sales Pitch', desc: 'Persuasive story, customer pain, value, and next steps.' },
  { id: 'training_lesson', name: 'Training Lesson', desc: 'Learning objectives, examples, exercises, and recap.' },
  { id: 'research_report', name: 'Research Report', desc: 'Evidence-led findings, methods, implications, and caveats.' },
  { id: 'investor_update', name: 'Investor Update', desc: 'Metrics, progress, risks, and asks for stakeholders.' },
  { id: 'workshop', name: 'Workshop', desc: 'Agenda, activities, facilitation prompts, and outcomes.' },
];

export const AUDIENCES: GenerationOption[] = [
  { id: 'general', name: 'General', desc: 'Accessible to a broad audience.' },
  { id: 'executives', name: 'Executives', desc: 'Focused on decisions, tradeoffs, and business impact.' },
  { id: 'technical', name: 'Technical', desc: 'Precise details for practitioners and specialists.' },
  { id: 'students', name: 'Students', desc: 'Instructional explanations with examples.' },
  { id: 'customers', name: 'Customers', desc: 'Outcome-oriented benefits and proof points.' },
  { id: 'investors', name: 'Investors', desc: 'Growth, traction, market, financials, and risk.' },
];

export const NARRATIVE_STYLES: GenerationOption[] = [
  { id: 'balanced', name: 'Balanced', desc: 'Clear setup, supporting detail, and practical close.' },
  { id: 'problem_solution', name: 'Problem/Solution', desc: 'Frame the problem, then show the path forward.' },
  { id: 'before_after', name: 'Before/After', desc: 'Contrast the current state with the desired future.' },
  { id: 'playbook', name: 'Playbook', desc: 'Step-by-step actions, owners, and operating rhythm.' },
  { id: 'deep_dive', name: 'Deep Dive', desc: 'Analytical detail with evidence and implications.' },
];

export const TONES: GenerationOption[] = [
  { id: 'executive', name: 'Executive', desc: 'Confident, concise, and board-ready.' },
  { id: 'friendly', name: 'Friendly', desc: 'Warm, accessible, and encouraging.' },
  { id: 'persuasive', name: 'Persuasive', desc: 'Benefit-led, compelling, and action-oriented.' },
  { id: 'instructional', name: 'Instructional', desc: 'Structured, explanatory, and practical.' },
  { id: 'analytical', name: 'Analytical', desc: 'Evidence-first, objective, and rigorous.' },
];

export const PROMPT_CHIPS: PromptChip[] = [
  {
    label: 'Board-ready summary',
    prompt: 'Create a board-ready summary with the strategic context, key decisions needed, major risks, and recommended next steps.',
    defaults: { presentationType: 'business_brief', tone: 'executive', audience: 'executives', narrativeStyle: 'balanced' },
  },
  {
    label: 'Investor update',
    prompt: 'Create an investor update covering recent traction, core metrics, product and go-to-market progress, risks, and the current ask.',
    defaults: { presentationType: 'investor_update', tone: 'executive', audience: 'investors', narrativeStyle: 'balanced' },
  },
  {
    label: 'Sales pitch',
    prompt: 'Create a sales pitch that opens with the customer pain, explains the solution and differentiators, proves value, and closes with a clear next step.',
    defaults: { presentationType: 'sales_pitch', tone: 'persuasive', audience: 'customers', narrativeStyle: 'problem_solution' },
  },
  {
    label: 'Training module',
    prompt: 'Create a training module with learning objectives, digestible concepts, examples, practice activities, and a short knowledge check.',
    defaults: { presentationType: 'training_lesson', tone: 'instructional', audience: 'students', narrativeStyle: 'playbook' },
  },
  {
    label: 'Research explainer',
    prompt: 'Create a research explainer that summarizes the core question, evidence, findings, limitations, and practical implications for the audience.',
    defaults: { presentationType: 'research_report', tone: 'analytical', audience: 'technical', narrativeStyle: 'deep_dive' },
  },
  {
    label: 'Workshop plan',
    prompt: 'Create a workshop plan with goals, timed agenda, facilitator prompts, participant exercises, materials, and expected outputs.',
    defaults: { presentationType: 'workshop', tone: 'friendly', audience: 'general', narrativeStyle: 'playbook' },
  },
];
