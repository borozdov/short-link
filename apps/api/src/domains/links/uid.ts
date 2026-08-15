import { customAlphabet, nanoid } from 'nanoid';

const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export const generateUid = customAlphabet(BASE62_ALPHABET, 7);

export function generateSecretToken(): string {
  return nanoid(24);
}
