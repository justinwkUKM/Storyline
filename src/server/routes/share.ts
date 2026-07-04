import { Router } from 'express';
import { serializeDeck } from './decks';
import { ApiError, asyncHandler } from '../http';
import { findSharedDeckByToken } from '../share';

export const shareRouter = Router();

shareRouter.get('/:token', asyncHandler(async (req, res) => {
  const token = typeof req.params.token === 'string' ? req.params.token.trim() : '';
  if (!token) {
    throw new ApiError(404, 'Shared presentation not found.');
  }

  const share = await findSharedDeckByToken(token);
  if (!share) {
    throw new ApiError(404, 'Shared presentation not found.');
  }

  res.json({
    deck: serializeDeck(share.deck),
  });
}));
