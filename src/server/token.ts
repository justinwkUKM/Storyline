import crypto from 'crypto';

export function createOpaqueToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashOpaqueToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
