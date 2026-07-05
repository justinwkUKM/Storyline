import crypto from 'crypto';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  credits: number;
  creditsResetAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionRecord {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  user?: UserRecord;
}

export interface DeckRecord {
  id: string;
  title: string;
  presentationData: string;
  theme: string;
  customSettings: string | null;
  sourceContext: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  share?: DeckShareRecord | null;
}

export interface DeckShareRecord {
  id: string;
  deckId: string;
  tokenHash: string;
  tokenCiphertext: string;
  tokenIv: string;
  tokenTag: string;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class DuplicateEmailError extends Error {
  constructor() {
    super('An account with this email already exists.');
  }
}

function getFirebaseCredential() {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (encoded) {
    try {
      const trimmed = encoded.trim();
      const json = trimmed.startsWith('{')
        ? trimmed
        : Buffer.from(trimmed, 'base64').toString('utf8');
      const serviceAccount = JSON.parse(json);
      return cert(serviceAccount);
    } catch (error) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_BASE64 must be the full Firebase service account JSON encoded as Base64.',
      );
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return cert({ projectId, clientEmail, privateKey });
  }

  return applicationDefault();
}

if (!getApps().length) {
  initializeApp({
    credential: getFirebaseCredential(),
    ...(process.env.FIREBASE_PROJECT_ID ? { projectId: process.env.FIREBASE_PROJECT_ID } : {}),
  });
}

export const firestore = getFirestore();
firestore.settings({
  ignoreUndefinedProperties: true,
  preferRest: true,
});

const users = firestore.collection('users');
const userEmails = firestore.collection('userEmails');
const sessions = firestore.collection('sessions');
const decks = firestore.collection('decks');
const deckShares = firestore.collection('deckShares');

function now() {
  return new Date();
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return now();
}

function nullableDate(value: unknown): Date | null {
  return value ? toDate(value) : null;
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export function emailLookupId(email: string) {
  return crypto.createHash('sha256').update(email).digest('hex');
}

function userFromDoc(doc: FirebaseFirestore.DocumentSnapshot): UserRecord | null {
  if (!doc.exists) return null;
  const data = doc.data() || {};
  return {
    id: doc.id,
    email: normalizeString(data.email),
    passwordHash: normalizeString(data.passwordHash),
    credits: typeof data.credits === 'number' ? data.credits : 100,
    creditsResetAt: toDate(data.creditsResetAt),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function sessionFromDoc(doc: FirebaseFirestore.DocumentSnapshot): SessionRecord | null {
  if (!doc.exists) return null;
  const data = doc.data() || {};
  return {
    id: doc.id,
    tokenHash: normalizeString(data.tokenHash || doc.id),
    userId: normalizeString(data.userId),
    expiresAt: toDate(data.expiresAt),
    createdAt: toDate(data.createdAt),
  };
}

function deckShareFromDoc(doc: FirebaseFirestore.DocumentSnapshot): DeckShareRecord | null {
  if (!doc.exists) return null;
  const data = doc.data() || {};
  return {
    id: doc.id,
    deckId: normalizeString(data.deckId || doc.id),
    tokenHash: normalizeString(data.tokenHash),
    tokenCiphertext: normalizeString(data.tokenCiphertext),
    tokenIv: normalizeString(data.tokenIv),
    tokenTag: normalizeString(data.tokenTag),
    revokedAt: nullableDate(data.revokedAt),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function deckFromDoc(doc: FirebaseFirestore.DocumentSnapshot, share?: DeckShareRecord | null): DeckRecord | null {
  if (!doc.exists) return null;
  const data = doc.data() || {};
  return {
    id: doc.id,
    title: normalizeString(data.title),
    presentationData: normalizeString(data.presentationData),
    theme: normalizeString(data.theme || 'modern'),
    customSettings: typeof data.customSettings === 'string' ? data.customSettings : null,
    sourceContext: typeof data.sourceContext === 'string' ? data.sourceContext : null,
    userId: normalizeString(data.userId),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    share,
  };
}

export async function createUser(email: string, passwordHash: string) {
  const userRef = users.doc();
  const emailRef = userEmails.doc(emailLookupId(email));
  const createdAt = now();

  await firestore.runTransaction(async (transaction) => {
    const emailDoc = await transaction.get(emailRef);
    if (emailDoc.exists) {
      throw new DuplicateEmailError();
    }

    transaction.set(userRef, {
      email,
      passwordHash,
      credits: 100,
      creditsResetAt: createdAt,
      createdAt,
      updatedAt: createdAt,
    });
    transaction.set(emailRef, {
      userId: userRef.id,
      email,
      createdAt,
    });
  });

  const user = await getUserById(userRef.id);
  if (!user) {
    throw new Error('Failed to create user.');
  }
  return user;
}

export async function getUserByEmail(email: string) {
  const emailDoc = await userEmails.doc(emailLookupId(email)).get();
  if (!emailDoc.exists) return null;
  const userId = normalizeString(emailDoc.data()?.userId);
  return userId ? getUserById(userId) : null;
}

export async function getUserById(userId: string) {
  return userFromDoc(await users.doc(userId).get());
}

export async function createSessionRecord(tokenHash: string, userId: string, expiresAt: Date) {
  const createdAt = now();
  await sessions.doc(tokenHash).set({
    tokenHash,
    userId,
    expiresAt,
    createdAt,
  });
}

export async function deleteSessionRecord(tokenHashOrId: string) {
  await sessions.doc(tokenHashOrId).delete();
}

export async function deleteExpiredSessions(before: Date) {
  const snapshot = await sessions.where('expiresAt', '<', before).limit(100).get();
  const batch = firestore.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  if (!snapshot.empty) {
    await batch.commit();
  }
}

export async function getSessionWithUser(tokenHash: string) {
  const session = sessionFromDoc(await sessions.doc(tokenHash).get());
  if (!session) return null;
  const user = await getUserById(session.userId);
  return user ? { ...session, user } : null;
}

export async function resetUserCredits(userId: string, creditsResetAt: Date) {
  await users.doc(userId).update({
    credits: 100,
    creditsResetAt,
    updatedAt: now(),
  });
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found.');
  return user;
}

export async function decrementUserCredits(userId: string) {
  const userRef = users.doc(userId);
  const updated = await firestore.runTransaction(async (transaction) => {
    const user = userFromDoc(await transaction.get(userRef));
    if (!user) {
      throw new Error('User not found.');
    }
    const credits = Math.max(0, user.credits - 1);
    transaction.update(userRef, {
      credits,
      updatedAt: now(),
    });
    return { ...user, credits, updatedAt: now() };
  });
  return updated;
}

export async function listDecksForUser(userId: string) {
  const snapshot = await decks.where('userId', '==', userId).orderBy('updatedAt', 'desc').get();
  const shareDocs = await Promise.all(snapshot.docs.map((doc) => deckShares.doc(doc.id).get()));
  return snapshot.docs
    .map((doc, index) => deckFromDoc(doc, deckShareFromDoc(shareDocs[index])))
    .filter((deck): deck is DeckRecord => Boolean(deck));
}

export async function createDeckForUser(userId: string, payload: Pick<DeckRecord, 'title' | 'presentationData' | 'theme' | 'customSettings'> & { sourceContext?: string | null }) {
  const createdAt = now();
  const ref = decks.doc();
  await ref.set({
    ...payload,
    userId,
    createdAt,
    updatedAt: createdAt,
  });
  const deck = await getDeckByIdForUser(ref.id, userId);
  if (!deck) throw new Error('Failed to create deck.');
  return deck;
}

export async function getDeckByIdForUser(deckId: string, userId: string) {
  const [deckDoc, shareDoc] = await Promise.all([
    decks.doc(deckId).get(),
    deckShares.doc(deckId).get(),
  ]);
  const deck = deckFromDoc(deckDoc, deckShareFromDoc(shareDoc));
  if (!deck || deck.userId !== userId) return null;
  return deck;
}

export async function updateDeckForUser(deckId: string, userId: string, payload: Pick<DeckRecord, 'title' | 'presentationData' | 'theme' | 'customSettings'> & { sourceContext?: string | null }) {
  const existing = await getDeckByIdForUser(deckId, userId);
  if (!existing) return null;

  const nextPayload = {
    ...payload,
    sourceContext: payload.sourceContext === undefined ? existing.sourceContext : payload.sourceContext,
    updatedAt: now(),
  };

  await decks.doc(deckId).update(nextPayload);
  return getDeckByIdForUser(deckId, userId);
}

export async function deleteDeckForUser(deckId: string, userId: string) {
  const existing = await getDeckByIdForUser(deckId, userId);
  if (!existing) return false;

  const batch = firestore.batch();
  batch.delete(decks.doc(deckId));
  batch.delete(deckShares.doc(deckId));
  await batch.commit();
  return true;
}

export async function getDeckShare(deckId: string) {
  return deckShareFromDoc(await deckShares.doc(deckId).get());
}

export async function upsertDeckShare(deckId: string, payload: Pick<DeckShareRecord, 'tokenHash' | 'tokenCiphertext' | 'tokenIv' | 'tokenTag' | 'revokedAt'>) {
  const ref = deckShares.doc(deckId);
  const existing = await ref.get();
  const createdAt = existing.exists ? toDate(existing.data()?.createdAt) : now();
  const updatedAt = now();

  await ref.set({
    ...payload,
    deckId,
    createdAt,
    updatedAt,
  });

  const share = await getDeckShare(deckId);
  if (!share) throw new Error('Failed to save deck share.');
  return share;
}

export async function revokeDeckShare(deckId: string) {
  const share = await getDeckShare(deckId);
  if (!share) return null;

  await deckShares.doc(deckId).update({
    revokedAt: now(),
    updatedAt: now(),
  });
  return getDeckShare(deckId);
}

export async function findDeckShareByTokenHash(tokenHash: string) {
  const snapshot = await deckShares.where('tokenHash', '==', tokenHash).where('revokedAt', '==', null).limit(1).get();
  if (snapshot.empty) return null;

  const share = deckShareFromDoc(snapshot.docs[0]);
  if (!share) return null;
  const deck = deckFromDoc(await decks.doc(share.deckId).get());
  return deck ? { ...share, deck } : null;
}
