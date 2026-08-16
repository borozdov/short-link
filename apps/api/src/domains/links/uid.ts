import { customAlphabet, nanoid } from 'nanoid';

const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// tech.md "Правила генерации uid": up to 5 retries on a collision, then give up.
export const MAX_UID_ATTEMPTS = 5;

export const generateUid = customAlphabet(BASE62_ALPHABET, 7);

export function generateSecretToken(): string {
  return nanoid(24);
}
