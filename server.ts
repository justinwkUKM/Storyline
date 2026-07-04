import 'dotenv/config';
import express from 'express';
import path from 'path';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import { PDFParse } from 'pdf-parse';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { authMiddleware, requireAuth } from './src/server/auth';
import { prisma } from './src/server/db';
import { sendError } from './src/server/http';
import { authRouter } from './src/server/routes/auth';
import { decksRouter } from './src/server/routes/decks';
import { sanitizeRichTextHtml } from './src/lib/richText';

const GRAPHIC_TYPES = ['process', 'comparison', 'metrics', 'hierarchy', 'pie'];

function normalizeSlideContent(slide: any, fallbackId: string, fallbackTitle: string) {
  return {
    id: fallbackId,
    title: typeof slide?.title === 'string' && slide.title.trim() ? slide.title.trim() : fallbackTitle,
    content: Array.isArray(slide?.content) && slide.content.length > 0
      ? slide.content.map((point: any) => sanitizeRichTextHtml(String(point)))
      : ['Key detailed point'],
    speakerNotes: typeof slide?.speakerNotes === 'string' ? slide.speakerNotes : '',
    graphic: slide?.graphic && typeof slide.graphic === 'object' && Array.isArray(slide.graphic.elements) ? {
      type: GRAPHIC_TYPES.includes(slide.graphic.type) ? slide.graphic.type : 'metrics',
      title: slide.graphic.title ? String(slide.graphic.title) : '',
      style: slide.graphic.style ? String(slide.graphic.style) : undefined,
      elements: slide.graphic.elements.length > 0
        ? slide.graphic.elements.map((el: any) => ({
          label: el?.label ? String(el.label) : 'Detail',
          value: el?.value ? String(el.value) : undefined,
          secondaryText: el?.secondaryText ? String(el.secondaryText) : undefined,
          percentage: typeof el?.percentage === 'number' ? Math.min(100, Math.max(0, el.percentage)) : undefined,
          icon: el?.icon ? String(el.icon) : undefined
        }))
        : [{ label: 'Key point', value: '100%', percentage: 100, icon: 'Target' }]
    } : undefined,
    quiz: slide?.quiz && typeof slide.quiz === 'object' && slide.quiz.question && Array.isArray(slide.quiz.options) && slide.quiz.options.length >= 2 ? {
      question: String(slide.quiz.question),
      options: slide.quiz.options.slice(0, 6).map((option: any) => String(option)),
      correctAnswerIndex: typeof slide.quiz.correctAnswerIndex === 'number'
        ? Math.min(Math.max(slide.quiz.correctAnswerIndex, 0), Math.min(slide.quiz.options.length - 1, 5))
        : 0
    } : undefined,
    links: Array.isArray(slide?.links) ? slide.links.filter((link: any) => link && link.title && link.url).map((link: any) => ({
      title: String(link.title),
      url: String(link.url)
    })) : undefined,
    videoUrl: slide?.videoUrl ? String(slide.videoUrl) : undefined
  };
}

function buildSlideResponseSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING, description: 'A concise explanation of what changed and why.' },
      warnings: {
        type: Type.ARRAY,
        description: 'Optional cautions if the request could only be partially completed.',
        items: { type: Type.STRING }
      },
      updatedSlide: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          content: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          speakerNotes: { type: Type.STRING },
          graphic: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: 'process, comparison, metrics, hierarchy, or pie' },
              style: { type: Type.STRING },
              title: { type: Type.STRING },
              elements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING },
                    secondaryText: { type: Type.STRING },
                    percentage: { type: Type.INTEGER },
                    icon: { type: Type.STRING }
                  },
                  required: ['label']
                }
              }
            },
            required: ['type', 'elements']
          },
          quiz: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswerIndex: { type: Type.INTEGER }
            },
            required: ['question', 'options', 'correctAnswerIndex']
          },
          links: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                url: { type: Type.STRING }
              },
              required: ['title', 'url']
            }
          },
          videoUrl: { type: Type.STRING }
        },
        required: ['id', 'title', 'content', 'speakerNotes']
      }
    },
    required: ['summary', 'updatedSlide']
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // Add request logging middleware
  app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url} - IP: ${req.ip}`);
    next();
  });

  // Add body parser for JSON requests
  app.use(express.json());
  app.use(cookieParser(process.env.SESSION_SECRET || 'dev-session-secret-change-me'));
  app.use(authMiddleware);

  // Use multer memory storage
  const upload = multer({ storage: multer.memoryStorage() });

  app.use('/api/auth', authRouter);
  app.use('/api/decks', decksRouter);

  // Add health endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/ai/edit-slide', requireAuth, async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not configured. Please add it to your settings.' });
      }

      const instruction = typeof req.body.instruction === 'string' ? req.body.instruction.trim().slice(0, 1000) : '';
      const slide = req.body.slide;
      if (!instruction) {
        return res.status(400).json({ error: 'Tell AI what to change on this slide.' });
      }
      if (!slide || typeof slide !== 'object') {
        return res.status(400).json({ error: 'Current slide data is required.' });
      }

      const editTargets = {
        title: Boolean(req.body.editTargets?.title),
        content: Boolean(req.body.editTargets?.content),
        speakerNotes: Boolean(req.body.editTargets?.speakerNotes),
        graphic: Boolean(req.body.editTargets?.graphic),
        quiz: Boolean(req.body.editTargets?.quiz),
        links: Boolean(req.body.editTargets?.links)
      };

      if (!Object.values(editTargets).some(Boolean)) {
        return res.status(400).json({ error: 'Select at least one slide area for AI to edit.' });
      }

      const deckTitle = typeof req.body.deckTitle === 'string' && req.body.deckTitle.trim() ? req.body.deckTitle.trim() : 'Untitled Storyline';
      const slideIndex = Number.isInteger(req.body.slideIndex) ? req.body.slideIndex : 0;
      const totalSlides = Number.isInteger(req.body.totalSlides) ? req.body.totalSlides : 1;
      const previousSlideTitle = typeof req.body.previousSlideTitle === 'string' ? req.body.previousSlideTitle : '';
      const nextSlideTitle = typeof req.body.nextSlideTitle === 'string' ? req.body.nextSlideTitle : '';
      const rawParsedText = typeof req.body.rawParsedText === 'string' ? req.body.rawParsedText.slice(0, 15000) : '';

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are Storyline's AI slide editor. Edit ONLY the provided slide according to the user's instruction.

Rules:
- Preserve the original slide id exactly.
- Stay faithful to the current slide, deck context, and source text. Do not invent unsupported facts.
- Only modify fields enabled in editTargets. Keep disabled fields unchanged.
- Keep bullet content concise, presentation-ready, and stored as strings.
- Supported graphic types are process, comparison, metrics, hierarchy, and pie.
- If creating or changing a graphic, provide useful labels, values, percentages, descriptions, and Lucide icon names.
- If adding a quiz, include one clear question, 2-4 options, and a correctAnswerIndex.
- Return JSON only using the requested schema.

Deck title: ${deckTitle}
Slide position: ${slideIndex + 1} of ${totalSlides}
Previous slide title: ${previousSlideTitle || 'None'}
Next slide title: ${nextSlideTitle || 'None'}
Edit targets: ${JSON.stringify(editTargets)}
User instruction: ${instruction}

Current slide JSON:
${JSON.stringify(slide, null, 2)}

Source text excerpt for fact checking:
${rawParsedText || 'No source text is available for this editing session.'}`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: buildSlideResponseSchema(),
          },
        });
      } catch (geminiErr: any) {
        console.error('Gemini slide edit failed:', geminiErr);
        let errorMsg = 'The AI model failed to edit this slide. Please try again.';
        if (geminiErr.message?.includes('API_KEY')) {
          errorMsg = 'Invalid or missing GEMINI_API_KEY. Please verify your environment variables or key settings.';
        } else if (geminiErr.status === 429) {
          errorMsg = 'Rate limit exceeded for the AI model. Please wait a moment and try again.';
        } else if (geminiErr.message?.includes('safety')) {
          errorMsg = 'The slide edit was blocked by content safety filters. Try a different instruction.';
        } else if (geminiErr.message) {
          errorMsg = `AI slide edit error: ${geminiErr.message}`;
        }
        return res.status(500).json({ error: errorMsg });
      }

      const jsonStr = response.text?.trim() || '';
      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (err) {
        console.error('Failed to parse Gemini slide edit JSON:', err, jsonStr);
        return res.status(500).json({ error: 'Failed to structure the AI slide edit.' });
      }

      const normalizedSlide = normalizeSlideContent(parsed.updatedSlide, String(slide.id || `slide-${slideIndex + 1}`), String(slide.title || `Slide ${slideIndex + 1}`));

      const protectedSlide = {
        ...slide,
        ...(editTargets.title ? { title: normalizedSlide.title } : {}),
        ...(editTargets.content ? { content: normalizedSlide.content } : {}),
        ...(editTargets.speakerNotes ? { speakerNotes: normalizedSlide.speakerNotes } : {}),
        ...(editTargets.graphic ? { graphic: normalizedSlide.graphic } : {}),
        ...(editTargets.quiz ? { quiz: normalizedSlide.quiz } : {}),
        ...(editTargets.links ? { links: normalizedSlide.links } : {}),
        id: String(slide.id || `slide-${slideIndex + 1}`)
      };

      res.json({
        summary: typeof parsed.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : 'AI prepared an update for this slide.',
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map((warning: any) => String(warning)) : [],
        updatedSlide: protectedSlide
      });
    } catch (error: any) {
      console.error('Error editing slide with AI:', error);
      res.status(500).json({ error: 'An unexpected internal error occurred: ' + (error.message || 'Unknown error') });
    }
  });

  // Generate presentation endpoint
  app.post('/api/generate', requireAuth, upload.single('pdf'), async (req, res) => {
    try {
      // Credit check
      if (req.user!.credits < 1) {
        const nextReset = new Date(req.user!.creditsResetAt);
        nextReset.setMonth(nextReset.getMonth() + 1);
        return res.status(403).json({
          error: `You have run out of credits for this month. Your 100 credits will automatically renew on ${nextReset.toLocaleDateString()}.`
        });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file uploaded. Please select a valid PDF.' });
      }

      // Parse the PDF with robust error checking
      let pdfData;
      try {
        const parser = new PDFParse({ data: req.file.buffer });
        pdfData = await parser.getText();
      } catch (err: any) {
        console.error('Error parsing PDF:', err);
        return res.status(400).json({ 
          error: 'Could not parse the PDF file. The file may be corrupt or encrypted. Details: ' + (err.message || 'Unknown error') 
        });
      }

      const text = pdfData?.text;
      if (!text || text.trim() === '') {
        return res.status(400).json({ 
          error: 'No readable text could be extracted from this PDF. This usually occurs if the document contains only scanned images (no selectable text), is encrypted, or is password-protected. Please upload a text-based or OCR-processed PDF document.' 
        });
      }

      // Truncate extremely long text to prevent prompt window overflow, rate-limit issues, or timeouts.
      const MAX_TEXT_LENGTH = 120000; // approx 25,000 to 30,000 words, plenty for a high-quality deck
      let textToAnalyze = text;
      if (text.length > MAX_TEXT_LENGTH) {
        console.warn(`Extracted text length (${text.length}) exceeds threshold. Truncating to ${MAX_TEXT_LENGTH} chars.`);
        textToAnalyze = text.slice(0, MAX_TEXT_LENGTH) + '\n... [Remaining document text truncated to fit model context limit]';
      }

      // Initialize Gemini
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not configured. Please add it to your settings.' });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Retrieve presentation style options
      const graphicStyle = req.body.graphicStyle || 'modern_infographic';
      const tone = req.body.tone || 'executive';
      const slideCount = req.body.slideCount || 'auto';
      const orientation = req.body.orientation || 'horizontal';
      const presentationType = req.body.presentationType || 'business_brief';
      const audience = req.body.audience || 'general';
      const narrativeStyle = req.body.narrativeStyle || 'balanced';
      const focusPrompt = typeof req.body.focusPrompt === 'string' ? req.body.focusPrompt.trim().slice(0, 900) : '';

      let styleGuidance = '';
      if (graphicStyle === 'modern_infographic') {
        styleGuidance = 'The visual elements MUST follow a "Modern Infographic" style. Choose graphic types like "process" (for timelines), "comparison" (for meters/bars), and "pie" (for proportional breakdowns). Keep visual item labels bold and stats crisp.';
      } else if (graphicStyle === 'bento_minimal') {
        styleGuidance = 'The visual elements MUST follow a "Modern Bento Grid" style. Choose graphic types like "metrics" (to create beautiful side-by-side bento metrics boards), "comparison", or modular data cards with clear numerical stats.';
      } else if (graphicStyle === 'executive_mono') {
        styleGuidance = 'The visual elements MUST follow a "High-Impact Technical / Corporate Executive" style. Choose graphic types like "hierarchy" (for structured layers/tiers) or "metrics" and "process". Use serious, data-driven labels and structured content mapping.';
      } else if (graphicStyle === 'editorial_story') {
        styleGuidance = 'The visual elements MUST follow an "Editorial Storyboard" style. Use magazine-like pacing, chapter-style section breaks, pull-quote moments, and visually strong title/transition slides with process, hierarchy, and comparison graphics.';
      } else if (graphicStyle === 'data_report') {
        styleGuidance = 'The visual elements MUST follow a "Data-Heavy Report" style. Prefer metrics dashboards, benchmark panels, comparison bars, percentage grids, trend indicators, and evidence-led labels. Every slide should make the data or proof easy to scan.';
      } else if (graphicStyle === 'workshop_canvas') {
        styleGuidance = 'The visual elements MUST follow a "Workshop Canvas" style. Use decision matrices, process boards, action-plan templates, priority stacks, and facilitation-friendly prompts that help an audience discuss and act.';
      }

      let toneGuidance = '';
      if (tone === 'executive') {
        toneGuidance = 'The text content MUST be "Executive & High-Impact". Bullet points must be short, punchy, strategic, and direct. Avoid long wordy sentences. Highlight main decisions, goals, and core outcomes.';
      } else if (tone === 'academic') {
        toneGuidance = 'The text content MUST be "Academic & Detailed". Bullet points should be rich with educational information, definitions, and conceptual context. Formulate thought-provoking multiple-choice quizzes.';
      } else if (tone === 'creative') {
        toneGuidance = 'The text content MUST be "Creative & Narrative". Tell a compelling story across the slides, using engaging metaphors, custom process stages, and fun quiz challenges.';
      } else if (tone === 'sales') {
        toneGuidance = 'The text content MUST be a persuasive "Sales Pitch". Lead with pains, benefits, proof points, objections, differentiation, and a clear call to action. Keep claims grounded in the source text.';
      } else if (tone === 'training') {
        toneGuidance = 'The text content MUST be a "Training Module". Add learning objectives, explain concepts progressively, include examples, and use quizzes to check understanding.';
      } else if (tone === 'investor') {
        toneGuidance = 'The text content MUST be an "Investor Narrative". Emphasize market context, traction, opportunity, risk, financial/operating signals, and forward-looking implications when supported by the source.';
      }

      const presentationTypeGuidanceMap: Record<string, string> = {
        business_brief: 'Create a business brief with an executive summary, prioritized insights, implications, decisions, and next steps.',
        sales_pitch: 'Create a sales pitch with problem framing, value proposition, proof points, differentiation, objection handling, and a clear close.',
        training_lesson: 'Create a training lesson with learning objectives, progressive explanation, examples, recap moments, and knowledge-check quizzes.',
        research_report: 'Create a research report with methodology/context, key findings, evidence, interpretation, limitations, and recommendations.',
        investor_update: 'Create an investor update with headline performance, traction, metrics, market context, risks, milestones, and outlook.',
        workshop: 'Create a workshop deck with agenda, facilitation prompts, discussion boards, decision points, activities, and action planning.'
      };

      const audienceGuidanceMap: Record<string, string> = {
        general: 'Write for a mixed general audience. Avoid unnecessary jargon and explain specialized terms briefly.',
        executives: 'Write for executives. Emphasize strategic stakes, tradeoffs, risks, decisions, metrics, and concise takeaways.',
        technical: 'Write for a technical audience. Preserve important methods, architecture, assumptions, dependencies, and implementation details.',
        students: 'Write for students. Teach concepts step-by-step with definitions, examples, and comprehension checks.',
        customers: 'Write for customers. Emphasize outcomes, benefits, proof, trust, and practical next steps.'
      };

      const narrativeGuidanceMap: Record<string, string> = {
        balanced: 'Use a balanced narrative with clear summary slides and enough supporting detail to be credible.',
        problem_solution: 'Use a problem-to-solution arc: current pain, root causes, solution, impact, and next actions.',
        before_after: 'Use a before-to-after arc: current state, transition, future state, and measurable improvements.',
        playbook: 'Use a playbook structure: principles, steps, owners, checkpoints, risks, and action items.',
        deep_dive: 'Use a deep-dive structure with richer evidence, more nuance, and explicit assumptions or caveats.'
      };

      const presentationTypeGuidance = presentationTypeGuidanceMap[presentationType] || presentationTypeGuidanceMap.business_brief;
      const audienceGuidance = audienceGuidanceMap[audience] || audienceGuidanceMap.general;
      const narrativeGuidance = narrativeGuidanceMap[narrativeStyle] || narrativeGuidanceMap.balanced;
      const focusGuidance = focusPrompt
        ? `User's Custom Focus Prompt: Follow this additional user instruction while staying faithful to the source text: "${focusPrompt}"`
        : "User's Custom Focus Prompt: No extra focus prompt was provided.";

      let slideCountGuidance = 'Generate an appropriate number of slides to summarize the key points (usually between 5 to 10 slides).';
      if (slideCount !== 'auto') {
        const count = parseInt(slideCount, 10);
        if (!isNaN(count) && count > 0) {
          slideCountGuidance = `You MUST generate EXACTLY ${count} slides in the "slides" array. No more and no less. Plan the pacing and content grouping carefully so that the presentation spans exactly ${count} slides.`;
        }
      }

      // Call Gemini to structure the presentation
      const prompt = `Please create a professional presentation slide deck based on the following text extracted from a PDF. 
First, identify and extract the most critical points and concepts. Use these to create a focused and professional summary that will serve as the primary content for the slides.
Make sure there's an introductory slide, several content slides, and a conclusion slide.

Layout and Content Tone Expectations:
- Style Guideline: ${styleGuidance}
- Tone Guideline: ${toneGuidance}
- Presentation Type: ${presentationTypeGuidance}
- Target Audience: ${audienceGuidance}
- Narrative Variation: ${narrativeGuidance}
- ${focusGuidance}
- Slide Count Requirement: ${slideCountGuidance}

For each slide, you MUST define a highly graphical visual element in the 'graphic' property to turn the slide into a visually rich, template-driven layout instead of a text-only slide. Select the most appropriate graphic 'type' (e.g., 'process' for progressive steps, 'comparison' for bar/percentage metrics comparisons, 'metrics' for a bento-style grid of stats, 'hierarchy' for tree structures/layered information, or 'pie' for proportional breakdowns). You MUST also select a specific 'style' variation to match one of our 50 high-quality presentation graphic templates (Choose from: process: 'timeline', 'step-by-step', 'chevron-flow', 'zigzag', 'circular-process', 'numbered-vertical', 'arrow-flow', 'milestones', 'pipeline', 'workflow'; comparison: 'bar-chart', 'vs-card', 'split-progress', 'feature-table', 'side-by-side', 'pro-con', 'gauge-compare', 'parallel-meters', 'bullet-chart', 'percentage-bars'; metrics: 'bento-grid', 'stat-cards', 'kpi-dashboard', 'scoreboard', 'numbers-cloud', 'highlight-stat', 'counter-grid', 'bento-list', 'radial-progress', 'trend-indicators'; hierarchy: 'pyramid', 'org-tree', 'layered-stack', 'hub-and-spoke', 'nested-boxes', 'funnel-down', 'tree-map', 'concentric-rings', 'priority-stack', 'architecture-layers'; pie: 'donut-chart', 'semi-circle', 'radial-bars', 'segment-cards', 'concentric-arcs', 'pie-exploded', 'percentage-grid', 'legend-highlight', 'stacked-donut', 'proportional-bubbles'). Provide distinct labels, values, percentages, and relevant Lucide icon names (such as Cpu, TrendingUp, Users, Target, Shield, Globe, Zap, etc.).

Additionally, add interactive elements to the slides where appropriate to make the presentation engaging:
1. Include relevant external links for further reading or reference (can be real or placeholder links based on context).
2. For at least one slide, generate a relevant YouTube video embed URL (e.g., https://www.youtube.com/embed/dQw4w9WgXcQ) if applicable.
3. For at least one slide, create a simple multiple-choice question to test the audience's understanding of the extracted text.

Text to analyze:
---
${textToAnalyze}
---`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: 'The overall title of the presentation.',
                },
                slides: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING, description: 'Unique identifier for the slide (e.g. slide-1)' },
                      title: { type: Type.STRING, description: 'Title of the slide' },
                      content: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'Summarized bullet points or main text content for the slide'
                      },
                      speakerNotes: { type: Type.STRING, description: 'Speaker notes for the slide' },
                      graphic: {
                        type: Type.OBJECT,
                        description: 'Graphical block to visualize concepts or stats for the slide.',
                        properties: {
                          type: { 
                            type: Type.STRING, 
                            description: 'The visual template category: process, comparison, metrics, hierarchy, or pie.' 
                          },
                          style: {
                            type: Type.STRING,
                            description: 'The specific visual variation template name chosen from the 50 templates listed in the prompt instructions.'
                          },
                          title: { type: Type.STRING, description: 'Optional graphic title' },
                          elements: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                label: { type: Type.STRING, description: 'The title/label of this visual item' },
                                value: { type: Type.STRING, description: 'Primary metric value or stat if applicable (e.g., "$5M", "Stage 1", "75%")' },
                                secondaryText: { type: Type.STRING, description: 'Description or secondary detail of this item' },
                                percentage: { type: Type.INTEGER, description: 'Optional percentage value from 0 to 100 for visual bars, progress, or pie charts' },
                                icon: { type: Type.STRING, description: 'A Lucide React icon name that represents this concept (e.g., "TrendingUp", "Award", "Cpu", "Server", "Database", "Users", "Layers", "Activity", "Target", "Shield", "Zap", "Globe", "Briefcase")' }
                              },
                              required: ['label']
                            }
                          }
                        },
                        required: ['type', 'elements']
                      },
                      quiz: {
                        type: Type.OBJECT,
                        description: 'Optional multiple-choice question for audience interaction',
                        properties: {
                          question: { type: Type.STRING },
                          options: { type: Type.ARRAY, items: { type: Type.STRING } },
                          correctAnswerIndex: { type: Type.INTEGER }
                        },
                        required: ['question', 'options', 'correctAnswerIndex']
                      },
                      links: {
                        type: Type.ARRAY,
                        description: 'Optional external links for further reading',
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            title: { type: Type.STRING },
                            url: { type: Type.STRING }
                          },
                          required: ['title', 'url']
                        }
                      },
                      videoUrl: { type: Type.STRING, description: 'Optional embedded video URL (e.g. YouTube embed)' }
                    },
                    required: ['id', 'title', 'content', 'speakerNotes']
                  }
                }
              },
              required: ['title', 'slides']
            },
          },
        });
      } catch (geminiErr: any) {
        console.error('Gemini API call failed:', geminiErr);
        let errorMsg = 'The AI model failed to analyze the PDF. Please try again.';
        if (geminiErr.message?.includes('API_KEY')) {
          errorMsg = 'Invalid or missing GEMINI_API_KEY. Please verify your environment variables or key settings.';
        } else if (geminiErr.status === 429) {
          errorMsg = 'Rate limit exceeded for the AI model. Please wait a moment and try again.';
        } else if (geminiErr.message?.includes('safety')) {
          errorMsg = 'The PDF content was flagged by content safety filters. Please try another document.';
        } else if (geminiErr.message) {
          errorMsg = `AI generation error: ${geminiErr.message}`;
        }
        return res.status(500).json({ error: errorMsg });
      }

      const jsonStr = response.text?.trim() || '';
      let presentationData;
      try {
        presentationData = JSON.parse(jsonStr);
      } catch (err) {
        console.error('Failed to parse Gemini response JSON:', err, jsonStr);
        return res.status(500).json({ error: 'Failed to structure the AI generated presentation data.' });
      }

      // Deep sanitize the returned object to ensure type safety and prevent frontend runtime crashes
      if (!presentationData.title || typeof presentationData.title !== 'string') {
        presentationData.title = 'Extracted Presentation';
      }
      if (!Array.isArray(presentationData.slides) || presentationData.slides.length === 0) {
        return res.status(500).json({ error: 'AI failed to generate any slides from this document. Please try again with a different document.' });
      }

      presentationData.slides = presentationData.slides.map((slide: any, index: number) => {
        return {
          id: slide.id || `slide-${index + 1}`,
          title: slide.title || `Key Point ${index + 1}`,
          content: Array.isArray(slide.content) ? slide.content.map((c: any) => String(c)) : ['Key detailed point'],
          speakerNotes: slide.speakerNotes || '',
          graphic: slide.graphic && typeof slide.graphic === 'object' && Array.isArray(slide.graphic.elements) ? {
            type: ['process', 'comparison', 'metrics', 'hierarchy', 'pie'].includes(slide.graphic.type) 
              ? slide.graphic.type 
              : 'metrics',
            title: slide.graphic.title || '',
            style: slide.graphic.style ? String(slide.graphic.style) : undefined,
            elements: slide.graphic.elements.map((el: any) => ({
              label: el.label ? String(el.label) : 'Detail',
              value: el.value ? String(el.value) : undefined,
              secondaryText: el.secondaryText ? String(el.secondaryText) : undefined,
              percentage: typeof el.percentage === 'number' ? Math.min(100, Math.max(0, el.percentage)) : undefined,
              icon: el.icon ? String(el.icon) : undefined
            }))
          } : undefined,
          quiz: slide.quiz && typeof slide.quiz === 'object' && slide.quiz.question && Array.isArray(slide.quiz.options) ? {
            question: String(slide.quiz.question),
            options: slide.quiz.options.map((o: any) => String(o)),
            correctAnswerIndex: typeof slide.quiz.correctAnswerIndex === 'number' ? slide.quiz.correctAnswerIndex : 0
          } : undefined,
          links: Array.isArray(slide.links) ? slide.links.filter((l: any) => l && l.title && l.url).map((l: any) => ({
            title: String(l.title),
            url: String(l.url)
          })) : undefined,
          videoUrl: slide.videoUrl ? String(slide.videoUrl) : undefined
        };
      });

      // Deduct 1 credit from user on successful generation
      const updatedUser = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          credits: {
            decrement: 1
          }
        }
      });

      presentationData.rawParsedText = textToAnalyze;
      presentationData.orientation = orientation;

      res.json({
        ...presentationData,
        creditsRemaining: updatedUser.credits
      });
    } catch (error: any) {
      console.error('Error generating presentation:', error);
      res.status(500).json({ error: 'An unexpected internal error occurred: ' + (error.message || 'Unknown error') });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global JSON error handler
  app.use(sendError);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
