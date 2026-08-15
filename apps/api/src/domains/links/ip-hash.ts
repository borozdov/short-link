import { createHash } from 'node:crypto';
import { env } from '../../config/env.js';

export function hashIp(ip: string): string {
  return createHash('sha256').update(ip + env.IP_HASH_SALT).digest('hex');
}
