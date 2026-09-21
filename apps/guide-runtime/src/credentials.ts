import { createHash, randomBytes } from 'node:crypto';

export function createOpaqueCredential(prefix: 'atm_tmp' | 'atm_mcp') {
  const token = `${prefix}_${randomBytes(32).toString('base64url')}`;
  return { token, hash: hashCredential(token), tokenPrefix: token.slice(0, 12) };
}

export function hashCredential(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
