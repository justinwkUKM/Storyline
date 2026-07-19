import { Router, type Request } from 'express';
import { requireAuth } from '../auth';
import {
  createDeckForUser,
  deleteDeckForUser,
  getDeckByIdForUser,
  listDecksForUser,
  updateDeckForUser,
} from '../db';
import { ApiError, asyncHandler } from '../http';
import { sanitizeRichTextHtml } from '../../lib/richText';
import {
  createOrRotateDeckShare,
  getActiveDeckSharePayload,
  revokeDeckShare,
} from '../share';

export const decksRouter = Router();

decksRouter.use(requireAuth);

const VALID_THEMES = new Set(['modern', 'limefrost', 'cosmic', 'minimal', 'sunset', 'ocean', 'lavender', 'rose', 'executiveInfographic', 'custom']);
const VALID_SOURCE_TYPES = new Set(['pdf', 'text', 'url']);
const MAX_SOURCE_CONTEXT_LENGTH = 120000;

function getRequestOrigin(req: Request) {
  return req.get('origin') || `${req.protocol}://${req.get('host')}`;
}

function parseJsonField<T>(value: string | null): T | undefined {
  if (!value) return undefined;
  return JSON.parse(value) as T;
}

function normalizeSourceContext(value: any, fallbackText?: string) {
  const source = value && typeof value === 'object' ? value : {};
  const rawText = typeof source.text === 'string' ? source.text : fallbackText;
  const text = typeof rawText === 'string' ? rawText.trim().slice(0, MAX_SOURCE_CONTEXT_LENGTH) : '';
  if (!text) return undefined;

  const sourceType = typeof source.sourceType === 'string' && VALID_SOURCE_TYPES.has(source.sourceType)
    ? source.sourceType
    : 'text';
  const label = typeof source.label === 'string' && source.label.trim()
    ? source.label.trim().slice(0, 500)
    : 'Saved source';
  const title = typeof source.title === 'string' && source.title.trim()
    ? source.title.trim().slice(0, 500)
    : undefined;

  return {
    sourceType,
    label,
    ...(title ? { title } : {}),
    text,
  };
}

function serializePresentationData(presentationData: any, sourceContext?: any) {
  const cleanPresentationData = presentationData && typeof presentationData === 'object'
    ? { ...presentationData }
    : presentationData;
  if (cleanPresentationData && typeof cleanPresentationData === 'object') {
    delete cleanPresentationData.rawParsedText;
    delete cleanPresentationData.sourceContext;
    if (sourceContext?.text) {
      cleanPresentationData.rawParsedText = sourceContext.text;
    }
  }
  return cleanPresentationData;
}

function normalizeDeckPayload(body: any) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const presentationData = body.presentationData;
  const theme = typeof body.theme === 'string' && VALID_THEMES.has(body.theme) ? body.theme : 'modern';

  if (!title) {
    throw new ApiError(400, 'Deck title is required.');
  }
  if (!presentationData || typeof presentationData !== 'object') {
    throw new ApiError(400, 'Presentation data is required.');
  }
  if (typeof presentationData.title !== 'string' || !Array.isArray(presentationData.slides) || presentationData.slides.length === 0) {
    throw new ApiError(400, 'Presentation data must include a title and at least one slide.');
  }

  const sourceContext = normalizeSourceContext(body.sourceContext, presentationData.rawParsedText);
  const sanitizedPresentationData = {
    ...presentationData,
    slides: presentationData.slides.map((slide: any) => ({
      ...slide,
      content: Array.isArray(slide.content)
        ? slide.content.map((point: any) => sanitizeRichTextHtml(String(point)))
        : [],
    })),
    rawParsedText: undefined,
    sourceContext: undefined,
  };
  delete sanitizedPresentationData.rawParsedText;
  delete sanitizedPresentationData.sourceContext;

  return {
    title,
    theme,
    presentationData: JSON.stringify(sanitizedPresentationData),
    customSettings: body.customSettings ? JSON.stringify(body.customSettings) : null,
    sourceContext: sourceContext ? JSON.stringify(sourceContext) : undefined,
  };
}

export function serializeDeck(deck: {
  id: string;
  title: string;
  presentationData: string;
  theme: string;
  customSettings: string | null;
  sourceContext?: string | null;
  createdAt: Date;
  updatedAt: Date;
  share?: { revokedAt: Date | null } | null;
}, options: { includeSourceContext?: boolean } = {}) {
  const sourceContext = parseJsonField<any>(deck.sourceContext || null);
  const presentationData = parseJsonField<any>(deck.presentationData);
  const ownerPresentationData = options.includeSourceContext
    ? serializePresentationData(presentationData, sourceContext)
    : serializePresentationData(presentationData);

  return {
    id: deck.id,
    title: deck.title,
    presentationData: ownerPresentationData,
    theme: deck.theme,
    customSettings: parseJsonField(deck.customSettings),
    ...(options.includeSourceContext && sourceContext ? { sourceContext } : {}),
    createdAt: deck.createdAt.toISOString(),
    updatedAt: deck.updatedAt.toISOString(),
    hasShare: Boolean(deck.share && !deck.share.revokedAt),
  };
}

decksRouter.get('/', asyncHandler(async (req, res) => {
  const decks = await listDecksForUser(req.user!.id);

  res.json({
    decks: decks.map((deck) => ({
      id: deck.id,
      title: deck.title,
      createdAt: deck.createdAt.toISOString(),
      updatedAt: deck.updatedAt.toISOString(),
      hasShare: Boolean(deck.share && !deck.share.revokedAt),
    })),
  });
}));

decksRouter.post('/', asyncHandler(async (req, res) => {
  const payload = normalizeDeckPayload(req.body);
  const deck = await createDeckForUser(req.user!.id, payload);

  res.status(201).json({ deck: serializeDeck(deck, { includeSourceContext: true }) });
}));

decksRouter.get('/:id', asyncHandler(async (req, res) => {
  const deck = await getDeckByIdForUser(req.params.id, req.user!.id);

  if (!deck) {
    throw new ApiError(404, 'Deck not found.');
  }

  res.json({ deck: serializeDeck(deck, { includeSourceContext: true }) });
}));

decksRouter.put('/:id', asyncHandler(async (req, res) => {
  const payload = normalizeDeckPayload(req.body);
  const deck = await updateDeckForUser(req.params.id, req.user!.id, payload);

  if (!deck) {
    throw new ApiError(404, 'Deck not found.');
  }

  res.json({ deck: serializeDeck(deck, { includeSourceContext: true }) });
}));

decksRouter.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await deleteDeckForUser(req.params.id, req.user!.id);
  if (!deleted) {
    throw new ApiError(404, 'Deck not found.');
  }

  res.json({ ok: true });
}));

decksRouter.get('/:id/share', asyncHandler(async (req, res) => {
  const deck = await getDeckByIdForUser(req.params.id, req.user!.id);

  if (!deck) {
    throw new ApiError(404, 'Deck not found.');
  }

  const share = await getActiveDeckSharePayload(deck.id, getRequestOrigin(req));
  res.json({ share });
}));

decksRouter.post('/:id/share', asyncHandler(async (req, res) => {
  const deck = await getDeckByIdForUser(req.params.id, req.user!.id);

  if (!deck) {
    throw new ApiError(404, 'Deck not found.');
  }

  const share = await createOrRotateDeckShare(deck.id, getRequestOrigin(req));
  res.status(201).json({ share });
}));

decksRouter.delete('/:id/share', asyncHandler(async (req, res) => {
  const deck = await getDeckByIdForUser(req.params.id, req.user!.id);

  if (!deck) {
    throw new ApiError(404, 'Deck not found.');
  }

  await revokeDeckShare(deck.id);
  res.json({ ok: true });
}));
