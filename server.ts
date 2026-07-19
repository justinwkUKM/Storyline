import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import { lookup } from 'dns/promises';
import { isIP } from 'net';
import { PDFParse } from 'pdf-parse';
import { GoogleGenAI, Type } from '@google/genai';
import { authMiddleware, requireAuth } from './src/server/auth';
import { decrementUserCredits } from './src/server/db';
import { sendError } from './src/server/http';
import { authRouter } from './src/server/routes/auth';
import { decksRouter } from './src/server/routes/decks';
import { shareRouter } from './src/server/routes/share';
import { sanitizeRichTextHtml } from './src/lib/richText';
import { buildExecutiveIllustrationPrompt, EXECUTIVE_VISUAL_ASSET_KEYS, EXECUTIVE_VISUAL_PALETTES } from './src/lib/executiveIllustrationPrompts';

const GRAPHIC_TYPES = ['process', 'comparison', 'metrics', 'hierarchy', 'pie'];
const EXECUTIVE_MODES = ['executive-report', 'bold-infographic'];
const EXECUTIVE_LAYOUTS = ['three-card-story', 'two-column-comparison', 'metric-dashboard', 'five-stage-model', 'formal-landscape', 'title-poster', 'summary-dashboard'];
const EXECUTIVE_ACCENTS = ['blue', 'green', 'teal', 'orange', 'yellow', 'magenta', 'red', 'neutral'];
const EXECUTIVE_COLORS = ['blue', 'deep-blue', 'green', 'dark-green', 'white', 'light'];
const EXECUTIVE_ASSET_STATUSES = ['pending', 'ready', 'failed'];
const MAX_TEXT_LENGTH = 120000;
const MIN_SOURCE_TEXT_LENGTH = 40;
const URL_FETCH_TIMEOUT_MS = 12000;
const URL_MAX_REDIRECTS = 5;
const URL_MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

interface NormalizedGenerationSource {
  type: 'pdf' | 'text' | 'url';
  text: string;
  label: string;
  title?: string;
}

class SourceInputError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'SourceInputError';
    this.status = status;
  }
}

function capSourceText(text: string) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim();
  if (normalized.length <= MAX_TEXT_LENGTH) {
    return normalized;
  }
  console.warn(`Source text length (${normalized.length}) exceeds threshold. Truncating to ${MAX_TEXT_LENGTH} chars.`);
  return `${normalized.slice(0, MAX_TEXT_LENGTH)}\n... [Remaining source text truncated to fit model context limit]`;
}

function ensureUsefulSourceText(text: string, emptyMessage: string) {
  const capped = capSourceText(text);
  if (!capped || capped.replace(/\s/g, '').length < MIN_SOURCE_TEXT_LENGTH) {
    throw new SourceInputError(emptyMessage);
  }
  return capped;
}

function normalizePastedSourceText(text: string) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim();
  if (!normalized || normalized.replace(/\s/g, '').length < MIN_SOURCE_TEXT_LENGTH) {
    throw new SourceInputError('The pasted text is empty or too short to create a useful presentation. Add more source material and try again.');
  }
  if (normalized.length > MAX_TEXT_LENGTH) {
    throw new SourceInputError(`Pasted text is too long. Please keep it under ${MAX_TEXT_LENGTH.toLocaleString()} characters.`);
  }
  return normalized;
}

async function extractPdfText(file?: Express.Multer.File): Promise<NormalizedGenerationSource> {
  if (!file) {
    throw new SourceInputError('No PDF file uploaded. Please select a valid PDF.');
  }

  let pdfData;
  try {
    const parser = new PDFParse({ data: file.buffer });
    pdfData = await parser.getText();
  } catch (err: any) {
    console.error('Error parsing PDF:', err);
    throw new SourceInputError('Could not parse the PDF file. The file may be corrupt or encrypted. Details: ' + (err.message || 'Unknown error'));
  }

  const text = ensureUsefulSourceText(
    pdfData?.text || '',
    'No readable text could be extracted from this PDF. This usually occurs if the document contains only scanned images, is encrypted, or is password-protected. Please upload a text-based or OCR-processed PDF document.'
  );

  return {
    type: 'pdf',
    text,
    label: file.originalname || 'Uploaded PDF',
    title: file.originalname
  };
}

function extractRawText(sourceText: unknown): NormalizedGenerationSource {
  if (typeof sourceText !== 'string') {
    throw new SourceInputError('Paste source text before generating a presentation.');
  }

  const text = normalizePastedSourceText(sourceText);

  return {
    type: 'text',
    text,
    label: 'Pasted text'
  };
}

function decodeHtmlEntities(value: string) {
  const named: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' '
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const key = String(entity).toLowerCase();
    if (key[0] === '#') {
      const isHex = key[1] === 'x';
      const codePoint = Number.parseInt(key.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    return named[key] || match;
  });
}

function stripHtmlToText(html: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()) : undefined;
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const contentHtml = articleMatch?.[1] || mainMatch?.[1] || bodyMatch?.[1] || html;
  const text = decodeHtmlEntities(
    contentHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(br|p|div|section|article|main|li|h[1-6])\b[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s+/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );

  return { title, text };
}

function isPrivateIpAddress(address: string) {
  const normalizedAddress = address.toLowerCase();
  const ipv4MappedMatch = normalizedAddress.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (ipv4MappedMatch) {
    return isPrivateIpAddress(ipv4MappedMatch[1]);
  }

  const ipVersion = isIP(address);
  if (ipVersion === 4) {
    const [a, b] = address.split('.').map((part) => Number(part));
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  if (ipVersion === 6) {
    return (
      normalizedAddress === '::' ||
      normalizedAddress === '::1' ||
      normalizedAddress.startsWith('fc') ||
      normalizedAddress.startsWith('fd') ||
      normalizedAddress.startsWith('fe80:')
    );
  }
  return false;
}

function isReadableWebContentType(contentType: string) {
  const type = contentType.split(';', 1)[0].trim().toLowerCase();
  return type === 'text/html' || type === 'application/xhtml+xml' || type === 'text/plain' || type.endsWith('+html');
}

async function readResponseTextWithLimit(response: Response) {
  const contentLength = response.headers.get('content-length');
  if (contentLength && Number(contentLength) > URL_MAX_RESPONSE_BYTES) {
    throw new SourceInputError('That webpage is too large to process. Try a shorter article or paste the text directly.');
  }

  if (!response.body) {
    return response.text();
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (!value) {
        continue;
      }
      received += value.byteLength;
      if (received > URL_MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new SourceInputError('That webpage is too large to process. Try a shorter article or paste the text directly.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return new TextDecoder('utf-8', { fatal: false }).decode(Buffer.concat(chunks, received));
}

async function assertPublicUrl(rawUrl: unknown) {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw new SourceInputError('Enter a public webpage URL before generating a presentation.');
  }

  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new SourceInputError('Enter a valid webpage URL that starts with http:// or https://.');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new SourceInputError('Only public http:// or https:// webpage URLs are supported.');
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || isPrivateIpAddress(hostname)) {
    throw new SourceInputError('Local or private network URLs are not supported. Use a public webpage URL.');
  }

  let addresses;
  try {
    addresses = await lookup(hostname, { all: true });
  } catch {
    throw new SourceInputError('Could not resolve that webpage URL. Check the address and try again.');
  }

  if (addresses.some((entry) => isPrivateIpAddress(entry.address))) {
    throw new SourceInputError('Private network URLs are not supported. Use a public webpage URL.');
  }

  return url;
}

async function extractUrlText(sourceUrl: unknown): Promise<NormalizedGenerationSource> {
  let url = await assertPublicUrl(sourceUrl);
  let response: Response | null = null;

  for (let redirectCount = 0; redirectCount <= URL_MAX_REDIRECTS; redirectCount += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), URL_FETCH_TIMEOUT_MS);
    try {
      response = await fetch(url.toString(), {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'StorylineBot/1.0 (+https://waqasobeidy.com)'
        }
      });
    } catch (err: any) {
      throw new SourceInputError(err?.name === 'AbortError'
        ? 'The webpage took too long to respond. Try a different public page.'
        : 'Could not fetch that webpage. It may block automated access or require login.');
    } finally {
      clearTimeout(timeout);
    }

    if (![301, 302, 303, 307, 308].includes(response.status)) {
      break;
    }

    if (redirectCount === URL_MAX_REDIRECTS) {
      throw new SourceInputError('That webpage redirects too many times. Try another public page.');
    }

    const location = response.headers.get('location');
    if (!location) {
      throw new SourceInputError('That webpage redirects without a readable destination. Try another public page.');
    }
    url = await assertPublicUrl(new URL(location, url).toString());
    response = null;
  }

  if (!response) {
    throw new SourceInputError('That webpage redirects too many times. Try another public page.');
  }

  if (!response.ok) {
    throw new SourceInputError(`Could not fetch that webpage. The server returned ${response.status}.`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType && !isReadableWebContentType(contentType)) {
    throw new SourceInputError('That URL does not look like a readable text or HTML webpage. Try an article page or paste the content directly.');
  }

  const html = await readResponseTextWithLimit(response);
  const { title, text: extractedText } = stripHtmlToText(html);
  const text = ensureUsefulSourceText(
    extractedText,
    'No readable text could be extracted from that webpage. Try a page with article-style text or paste the content directly.'
  );

  return {
    type: 'url',
    text,
    label: url.toString(),
    title: title || url.hostname
  };
}

async function normalizeGenerationSource(req: express.Request): Promise<NormalizedGenerationSource> {
  const sourceType = typeof req.body.sourceType === 'string' ? req.body.sourceType : 'pdf';
  if (sourceType === 'pdf') {
    return extractPdfText(req.file);
  }
  if (sourceType === 'text') {
    return extractRawText(req.body.sourceText);
  }
  if (sourceType === 'url') {
    return extractUrlText(req.body.sourceUrl);
  }
  throw new SourceInputError('Unsupported source type. Choose PDF, text, or webpage URL.');
}


function normalizeExecutiveVisualAsset(asset: any) {
  if (!asset || typeof asset !== 'object') return undefined;
  const key = typeof asset.key === 'string' ? asset.key.trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 48) : '';
  const prompt = typeof asset.prompt === 'string' ? asset.prompt.trim().slice(0, 900) : '';
  if (!key || !prompt) return undefined;
  const url = typeof asset.url === 'string' && /^(data:image\/(png|webp|svg\+xml);base64,|\/|https?:\/\/)/i.test(asset.url)
    ? asset.url.slice(0, 2000)
    : undefined;
  return {
    key,
    prompt: sanitizeRichTextHtml(prompt),
    ...(url ? { url } : {}),
    status: EXECUTIVE_ASSET_STATUSES.includes(asset.status) ? asset.status : (url ? 'ready' : 'pending'),
    alt: asset.alt ? sanitizeRichTextHtml(String(asset.alt)).slice(0, 180) : undefined,
  };
}

function normalizeExecutiveCard(card: any, index: number) {
  return {
    number: card?.number ? String(card.number).slice(0, 8) : String(index + 1).padStart(2, '0'),
    heading: card?.heading ? sanitizeRichTextHtml(String(card.heading)).slice(0, 90) : `Point ${index + 1}`,
    subheading: card?.subheading ? sanitizeRichTextHtml(String(card.subheading)).slice(0, 120) : undefined,
    points: Array.isArray(card?.points)
      ? card.points.slice(0, 4).map((point: any) => sanitizeRichTextHtml(String(point)).slice(0, 160))
      : [],
    takeaway: card?.takeaway ? sanitizeRichTextHtml(String(card.takeaway)).slice(0, 140) : undefined,
    accent: EXECUTIVE_ACCENTS.includes(card?.accent) ? card.accent : undefined,
    icon: card?.icon ? String(card.icon).slice(0, 40) : undefined,
    illustration: card?.illustration ? String(card.illustration).slice(0, 40) : undefined,
    visualAsset: normalizeExecutiveVisualAsset(card?.visualAsset)
  };
}

function normalizeSlideContent(slide: any, fallbackId: string, fallbackTitle: string) {
  const cards = Array.isArray(slide?.cards)
    ? slide.cards.slice(0, 6).map((card: any, index: number) => normalizeExecutiveCard(card, index))
    : undefined;

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
    videoUrl: slide?.videoUrl ? String(slide.videoUrl) : undefined,
    executiveMode: EXECUTIVE_MODES.includes(slide?.executiveMode) ? slide.executiveMode : undefined,
    layoutArchetype: EXECUTIVE_LAYOUTS.includes(slide?.layoutArchetype) ? slide.layoutArchetype : undefined,
    eyebrow: slide?.eyebrow ? sanitizeRichTextHtml(String(slide.eyebrow)).slice(0, 80) : undefined,
    framingStatement: slide?.framingStatement ? sanitizeRichTextHtml(String(slide.framingStatement)).slice(0, 260) : undefined,
    cards,
    bottomLine: slide?.bottomLine && typeof slide.bottomLine === 'object' && slide.bottomLine.text
      ? {
        label: slide.bottomLine.label ? sanitizeRichTextHtml(String(slide.bottomLine.label)).slice(0, 48) : undefined,
        text: sanitizeRichTextHtml(String(slide.bottomLine.text)).slice(0, 220),
        icon: slide.bottomLine.icon ? String(slide.bottomLine.icon).slice(0, 40) : undefined,
        visualAsset: normalizeExecutiveVisualAsset(slide.bottomLine.visualAsset)
      }
      : undefined,
    heroVisualAsset: normalizeExecutiveVisualAsset(slide?.heroVisualAsset),
    dominantColor: EXECUTIVE_COLORS.includes(slide?.dominantColor) ? slide.dominantColor : undefined
  };
}

function executiveSlideSchemaProperties() {
  return {
    executiveMode: {
      type: Type.STRING,
      description: 'Optional executive layout mode: executive-report or bold-infographic.'
    },
    layoutArchetype: {
      type: Type.STRING,
      description: 'Optional layout archetype: three-card-story, two-column-comparison, metric-dashboard, five-stage-model, formal-landscape, title-poster, or summary-dashboard.'
    },
    eyebrow: { type: Type.STRING, description: 'Optional short uppercase section label.' },
    framingStatement: { type: Type.STRING, description: 'Optional concise framing statement, maximum two short sentences.' },
    cards: {
      type: Type.ARRAY,
      description: 'Optional structured executive cards. Keep each card concise with no more than four points.',
      items: {
        type: Type.OBJECT,
        properties: {
          number: { type: Type.STRING },
          heading: { type: Type.STRING },
          subheading: { type: Type.STRING },
          points: { type: Type.ARRAY, items: { type: Type.STRING } },
          takeaway: { type: Type.STRING },
          accent: { type: Type.STRING },
          icon: { type: Type.STRING },
          illustration: { type: Type.STRING },
          visualAsset: { type: Type.OBJECT, properties: { key: { type: Type.STRING }, prompt: { type: Type.STRING }, url: { type: Type.STRING }, status: { type: Type.STRING }, alt: { type: Type.STRING } }, required: ['key', 'prompt'] }
        },
        required: ['heading', 'points']
      }
    },
    bottomLine: {
      type: Type.OBJECT,
      description: 'Optional bottom-line banner with one concise conclusion.',
      properties: {
        label: { type: Type.STRING },
        text: { type: Type.STRING },
        icon: { type: Type.STRING },
        visualAsset: { type: Type.OBJECT, properties: { key: { type: Type.STRING }, prompt: { type: Type.STRING }, url: { type: Type.STRING }, status: { type: Type.STRING }, alt: { type: Type.STRING } } }
      },
      required: ['text']
    },
    heroVisualAsset: { type: Type.OBJECT, description: 'Optional slide-level hero visual asset reference.', properties: { key: { type: Type.STRING }, prompt: { type: Type.STRING }, url: { type: Type.STRING }, status: { type: Type.STRING }, alt: { type: Type.STRING } } },
    dominantColor: {
      type: Type.STRING,
      description: 'Optional dominant slide color: blue, deep-blue, green, dark-green, white, or light.'
    }
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
          ...executiveSlideSchemaProperties(),
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
                    icon: { type: Type.STRING },
        visualAsset: { type: Type.OBJECT, properties: { key: { type: Type.STRING }, prompt: { type: Type.STRING }, url: { type: Type.STRING }, status: { type: Type.STRING }, alt: { type: Type.STRING } } }
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

function buildCreateSlideResponseSchema() {
  const schema = buildSlideResponseSchema();
  return {
    ...schema,
    properties: {
      ...schema.properties,
      slide: schema.properties.updatedSlide,
    },
    required: ['summary', 'slide'],
  };
}

export interface CreateAppOptions {
  mountFrontend?: boolean;
}

export async function createApp(options: CreateAppOptions = {}) {
  const app = express();
  const mountFrontend = options.mountFrontend ?? true;

  // Cloud Run and other reverse proxies need this so secure cookies and origin-aware links work correctly.
  app.set('trust proxy', 1);

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
  app.use('/api/share', shareRouter);


  app.use('/generated', express.static(path.join(process.cwd(), 'public', 'generated')));

  app.post('/api/assets/executive-illustration', requireAuth, async (req, res) => {
    try {
      const key = typeof req.body.key === 'string' ? req.body.key.trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 48) : '';
      if (!key) return res.status(400).json({ error: 'A semantic asset key is required.' });
      const palette = EXECUTIVE_VISUAL_PALETTES.includes(req.body.palette) ? req.body.palette : 'neutral';
      const prompt = buildExecutiveIllustrationPrompt({
        key,
        palette,
        slideTitle: typeof req.body.slideTitle === 'string' ? req.body.slideTitle.slice(0, 140) : undefined,
        cardHeading: typeof req.body.cardHeading === 'string' ? req.body.cardHeading.slice(0, 140) : undefined,
        cardTakeaway: typeof req.body.cardTakeaway === 'string' ? req.body.cardTakeaway.slice(0, 180) : undefined,
      });
      const userId = req.user?.id || 'dev-user';
      const deckId = typeof req.body.deckId === 'string' ? req.body.deckId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) : 'deck';
      const slideId = typeof req.body.slideId === 'string' ? req.body.slideId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) : 'slide';
      const cardIndex = Number.isInteger(req.body.cardIndex) ? req.body.cardIndex : 0;
      const hash = crypto.createHash('sha256').update(prompt).digest('hex').slice(0, 16);
      const relDir = path.join('generated', 'executive-assets', userId, deckId, slideId);
      const fileName = `${cardIndex}-${key}-${hash}.svg`;
      const outDir = path.join(process.cwd(), 'public', relDir);
      const outPath = path.join(outDir, fileName);
      await fs.mkdir(outDir, { recursive: true });
      try { await fs.access(outPath); } catch {
        const colors: Record<string, [string, string, string]> = {
          blue: ['#20AEEA', '#0455C9', '#DFF4FF'], green: ['#00CE68', '#014F36', '#E6FFF3'], 'dark-green': ['#014F36', '#00CE68', '#E6FFF3'], 'deep-blue': ['#0455C9', '#20AEEA', '#E8F3FF'], neutral: ['#64748B', '#20AEEA', '#F1F5F9']
        };
        const [primary, secondary, pale] = colors[palette];
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 384"><rect width="512" height="384" fill="none"/><ellipse cx="256" cy="318" rx="128" ry="22" fill="#0f172a" opacity=".12"/><rect x="156" y="80" width="200" height="180" rx="42" fill="${pale}"/><circle cx="256" cy="170" r="70" fill="${primary}"/><path d="M210 190c45-95 112-95 92 0" fill="none" stroke="${secondary}" stroke-width="28" stroke-linecap="round"/><rect x="206" y="172" width="100" height="82" rx="22" fill="${secondary}"/><circle cx="256" cy="214" r="12" fill="#fff"/></svg>`;
        await fs.writeFile(outPath, svg, 'utf8');
      }
      const alt = `${key.replace(/-/g, ' ')} executive illustration for ${req.body.cardHeading || req.body.slideTitle || 'slide'}`.slice(0, 180);
      res.json({ key, prompt, url: `/${relDir}/${fileName}`.replace(/\\/g, '/'), alt, status: 'ready', storagePath: `executive-assets/${userId}/${deckId}/${slideId}/${cardIndex}-${key}.png`, promptHash: hash });
    } catch (error: any) {
      console.error('Executive asset generation failed:', error);
      res.status(500).json({ error: error.message || 'Failed to generate executive asset.' });
    }
  });

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

  app.post('/api/ai/create-slide', requireAuth, async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not configured. Please add it to your settings.' });
      }

      const instruction = typeof req.body.instruction === 'string' ? req.body.instruction.trim().slice(0, 1000) : '';
      if (!instruction) {
        return res.status(400).json({ error: 'Describe the topic for the new slide.' });
      }

      const deckTitle = typeof req.body.deckTitle === 'string' && req.body.deckTitle.trim() ? req.body.deckTitle.trim() : 'Untitled Storyline';
      const insertionIndex = Number.isInteger(req.body.insertionIndex) ? Math.max(0, req.body.insertionIndex) : 0;
      const existingSlideTitles = Array.isArray(req.body.existingSlideTitles)
        ? req.body.existingSlideTitles.slice(0, 40).map((title: any) => String(title || '').slice(0, 160)).filter(Boolean)
        : [];
      const rawParsedText = typeof req.body.rawParsedText === 'string' ? req.body.rawParsedText.slice(0, 20000) : '';

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are Storyline's AI slide creator. Create exactly ONE new slide for an existing deck.

Rules:
- Use the user's requested topic and stay faithful to the source text. Do not invent unsupported facts.
- Fit the new slide into the existing deck structure and avoid duplicating existing slide titles.
- Keep bullet content concise, presentation-ready, and stored as strings.
- Include speaker notes that help the presenter explain the slide.
- Include one useful graphic using type process, comparison, metrics, hierarchy, or pie.
- If adding a quiz or links is useful, include them; otherwise omit them.
- Return JSON only using the requested schema.

Deck title: ${deckTitle}
Insert after slide position: ${insertionIndex}
Existing slide titles:
${existingSlideTitles.length ? existingSlideTitles.map((title, index) => `${index + 1}. ${title}`).join('\n') : 'None'}

User requested topic/instruction:
${instruction}

Source text excerpt for context:
${rawParsedText || 'No source text is available for this editing session.'}`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: buildCreateSlideResponseSchema(),
          },
        });
      } catch (geminiErr: any) {
        console.error('Gemini create slide failed:', geminiErr);
        let errorMsg = 'The AI model failed to create a slide. Please try again.';
        if (geminiErr.message?.includes('API_KEY')) {
          errorMsg = 'Invalid or missing GEMINI_API_KEY. Please verify your environment variables or key settings.';
        } else if (geminiErr.status === 429) {
          errorMsg = 'Rate limit exceeded for the AI model. Please wait a moment and try again.';
        } else if (geminiErr.message?.includes('safety')) {
          errorMsg = 'The slide request was blocked by content safety filters. Try a different topic.';
        } else if (geminiErr.message) {
          errorMsg = `AI slide creation error: ${geminiErr.message}`;
        }
        return res.status(500).json({ error: errorMsg });
      }

      const jsonStr = response.text?.trim() || '';
      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (err) {
        console.error('Failed to parse Gemini create slide JSON:', err, jsonStr);
        return res.status(500).json({ error: 'Failed to structure the AI-created slide.' });
      }

      const normalizedSlide = normalizeSlideContent(
        parsed.slide,
        `slide-ai-${Date.now()}`,
        instruction.length > 80 ? `${instruction.slice(0, 77)}...` : instruction
      );

      res.json({
        summary: typeof parsed.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : 'AI drafted a new slide.',
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map((warning: any) => String(warning)) : [],
        slide: normalizedSlide,
      });
    } catch (error: any) {
      console.error('Error creating slide with AI:', error);
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

      const source = await normalizeGenerationSource(req);
      const textToAnalyze = source.text;

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
      } else if (graphicStyle === 'executive_infographic') {
        styleGuidance = `The visual system MUST follow a brand-neutral "Executive Infographic" style. Do not mention or imitate any external company, logo, or brand. Build each slide around one conclusion. Alternate between clean executive-report slides for evidence, regulation, timelines, policy, and formal comparisons, and bold infographic slides for key messages, risks, principles, challenges, strategy, and calls to action. For every slide, provide executiveMode, layoutArchetype, framingStatement, concise structured cards, dominantColor, and a bottomLine. Use saturated blue or green backgrounds for bold infographic slides and white/light backgrounds for formal report slides. Cards must have short headings, no more than four concise points, and a takeaway where useful. Bottom lines must be one sentence and boardroom-ready.`;
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
      const prompt = `Please create a professional presentation slide deck based on the following source text.
First, identify and extract the most critical points and concepts. Use these to create a focused and professional summary that will serve as the primary content for the slides.
Make sure there's an introductory slide, several content slides, and a conclusion slide.

Source type: ${source.type}
Source label: ${source.label}
Source title: ${source.title || 'Not provided'}

Layout and Content Tone Expectations:
- Style Guideline: ${styleGuidance}
- Tone Guideline: ${toneGuidance}
- Presentation Type: ${presentationTypeGuidance}
- Target Audience: ${audienceGuidance}
- Narrative Variation: ${narrativeGuidance}
- ${focusGuidance}
- Slide Count Requirement: ${slideCountGuidance}

For each slide, you MUST define a highly graphical visual element in the 'graphic' property to turn the slide into a visually rich, template-driven layout instead of a text-only slide. Select the most appropriate graphic 'type' (e.g., 'process' for progressive steps, 'comparison' for bar/percentage metrics comparisons, 'metrics' for a bento-style grid of stats, 'hierarchy' for tree structures/layered information, or 'pie' for proportional breakdowns). You MUST also select a specific 'style' variation to match one of our 50 high-quality presentation graphic templates (Choose from: process: 'timeline', 'step-by-step', 'chevron-flow', 'zigzag', 'circular-process', 'numbered-vertical', 'arrow-flow', 'milestones', 'pipeline', 'workflow'; comparison: 'bar-chart', 'vs-card', 'split-progress', 'feature-table', 'side-by-side', 'pro-con', 'gauge-compare', 'parallel-meters', 'bullet-chart', 'percentage-bars'; metrics: 'bento-grid', 'stat-cards', 'kpi-dashboard', 'scoreboard', 'numbers-cloud', 'highlight-stat', 'counter-grid', 'bento-list', 'radial-progress', 'trend-indicators'; hierarchy: 'pyramid', 'org-tree', 'layered-stack', 'hub-and-spoke', 'nested-boxes', 'funnel-down', 'tree-map', 'concentric-rings', 'priority-stack', 'architecture-layers'; pie: 'donut-chart', 'semi-circle', 'radial-bars', 'segment-cards', 'concentric-arcs', 'pie-exploded', 'percentage-grid', 'legend-highlight', 'stacked-donut', 'proportional-bubbles'). Provide distinct labels, values, percentages, and relevant Lucide icon names (such as Cpu, TrendingUp, Users, Target, Shield, Globe, Zap, etc.).

If the selected style is Executive Infographic, keep Gemini responsible for choosing the semantic visual concept: add visualAsset to each major card and optional bottomLine/heroVisualAsset using keys such as shield-lock, server-hsm, network-nodes, roadmap-calendar, certificate, collaboration, target, bank-building, clipboard-magnifier, puzzle-interoperability. Each visualAsset must include key and a bitmap-generation prompt that says brand-neutral, no logos, no text, no watermark, soft 3D clay or isometric style, transparent background. The image-generation route will create the actual bitmap later; do not include final URLs. Also populate these optional slide fields: executiveMode, layoutArchetype, eyebrow, framingStatement, cards, bottomLine, and dominantColor. Choose one layout archetype per slide and keep the structure sparse, high-contrast, brand-neutral, and executive-readable. Never add external logos or brand references unless the source itself requires them.

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
                      ...executiveSlideSchemaProperties(),
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
        let errorMsg = 'The AI model failed to analyze the source. Please try again.';
        if (geminiErr.message?.includes('API_KEY')) {
          errorMsg = 'Invalid or missing GEMINI_API_KEY. Please verify your environment variables or key settings.';
        } else if (geminiErr.status === 429) {
          errorMsg = 'Rate limit exceeded for the AI model. Please wait a moment and try again.';
        } else if (geminiErr.message?.includes('safety')) {
          errorMsg = 'The source content was flagged by content safety filters. Please try different material.';
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
        return res.status(500).json({ error: 'AI failed to generate any slides from this source. Please try again with different material.' });
      }

      presentationData.slides = presentationData.slides.map((slide: any, index: number) => {
        return normalizeSlideContent(slide, slide.id || `slide-${index + 1}`, slide.title || `Key Point ${index + 1}`);
      });

      // Deduct 1 credit from user on successful generation
      const updatedUser = await decrementUserCredits(req.user!.id);

      presentationData.rawParsedText = textToAnalyze;
      presentationData.sourceContext = {
        sourceType: source.type,
        label: source.label,
        ...(source.title ? { title: source.title } : {}),
        text: textToAnalyze,
      };
      presentationData.orientation = orientation;

      res.json({
        ...presentationData,
        creditsRemaining: updatedUser.credits
      });
    } catch (error: any) {
      console.error('Error generating presentation:', error);
      if (error instanceof SourceInputError) {
        return res.status(error.status).json({ error: error.message });
      }
      res.status(500).json({ error: 'An unexpected internal error occurred: ' + (error.message || 'Unknown error') });
    }
  });

  // Vite middleware for development
  if (mountFrontend && process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (mountFrontend) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global JSON error handler
  app.use(sendError);

  return app;
}

export async function startServer() {
  const PORT = Number(process.env.PORT || 3000);
  const app = await createApp();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (process.env.VERCEL !== '1') {
  startServer();
}
