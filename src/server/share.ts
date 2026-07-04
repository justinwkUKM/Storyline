import crypto from 'crypto';
import { prisma } from './db';
import { createOpaqueToken, hashOpaqueToken } from './token';

export interface ShareLinkPayload {
  token: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

function getShareKey() {
  const secret = process.env.SHARE_TOKEN_SECRET || process.env.SESSION_SECRET || 'dev-share-secret-change-me';
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptToken(token: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getShareKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    tokenCiphertext: ciphertext.toString('base64url'),
    tokenIv: iv.toString('base64url'),
    tokenTag: tag.toString('base64url'),
  };
}

function decryptToken(tokenCiphertext: string, tokenIv: string, tokenTag: string) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getShareKey(),
    Buffer.from(tokenIv, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tokenTag, 'base64url'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(tokenCiphertext, 'base64url')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

function buildSharePayload(token: string, createdAt: Date, updatedAt: Date, origin?: string): ShareLinkPayload {
  return {
    token,
    url: buildShareUrl(token, origin),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

export function buildShareUrl(token: string, origin?: string) {
  const base = origin ? origin.replace(/\/$/, '') : '';
  return `${base}/share/${token}`;
}

export async function getDeckShare(deckId: string) {
  return prisma.deckShare.findUnique({
    where: { deckId },
  });
}

export async function getActiveDeckSharePayload(deckId: string, origin?: string) {
  const share = await prisma.deckShare.findUnique({
    where: { deckId },
  });

  if (!share || share.revokedAt) {
    return null;
  }

  const token = decryptToken(share.tokenCiphertext, share.tokenIv, share.tokenTag);
  return buildSharePayload(token, share.createdAt, share.updatedAt, origin);
}

export async function createOrRotateDeckShare(deckId: string, origin?: string) {
  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const encrypted = encryptToken(token);

  const share = await prisma.deckShare.upsert({
    where: { deckId },
    create: {
      deckId,
      tokenHash,
      ...encrypted,
      revokedAt: null,
    },
    update: {
      tokenHash,
      ...encrypted,
      revokedAt: null,
    },
  });

  return buildSharePayload(token, share.createdAt, share.updatedAt, origin);
}

export async function revokeDeckShare(deckId: string) {
  const share = await prisma.deckShare.findUnique({
    where: { deckId },
    select: { id: true },
  });

  if (!share) {
    return null;
  }

  return prisma.deckShare.update({
    where: { id: share.id },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function findSharedDeckByToken(token: string) {
  const tokenHash = hashOpaqueToken(token);
  return prisma.deckShare.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
    },
    include: {
      deck: true,
    },
  });
}
