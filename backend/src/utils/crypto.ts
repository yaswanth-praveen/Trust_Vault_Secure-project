import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSecureToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}

export function sha256(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function hashSessionToken(token: string): string {
  return sha256(token);
}

export function canonicalJsonString(obj: any): string {
  if (obj === null || obj === undefined) return '';
  if (typeof obj !== 'object') return String(obj);
  
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJsonString).join(',') + ']';
  }
  
  const sortedKeys = Object.keys(obj).sort();
  return '{' + sortedKeys.map(k => `${JSON.stringify(k)}:${canonicalJsonString(obj[k])}`).join(',') + '}';
}
