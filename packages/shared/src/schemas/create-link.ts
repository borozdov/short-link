import { z } from 'zod';

export const FORBIDDEN_SLUGS = [
  'admin',
  'api',
  'login',
  'register',
  'dashboard',
  'kitchen-sink',
  's',
  'stats',
  'qr',
];

const slugPattern = /^[a-zA-Z0-9_-]{3,32}$/;

export const CreateLinkRequestSchema = z.object({
  targetUrl: z.string().url(),
  customSlug: z
    .string()
    .regex(slugPattern, 'Use 3-32 characters: letters, numbers, _ or -')
    .refine((slug) => !FORBIDDEN_SLUGS.includes(slug.toLowerCase()), 'This slug is reserved')
    .optional(),
  expiresInHours: z.number().int().positive().optional(),
  utm: z
    .object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
    })
    .optional(),
});

export type CreateLinkRequest = z.infer<typeof CreateLinkRequestSchema>;

export const CreateLinkResponseSchema = z.object({
  shortUrl: z.string(),
  uid: z.string(),
  secretToken: z.string(),
  qrUrl: z.string(),
});

export type CreateLinkResponse = z.infer<typeof CreateLinkResponseSchema>;
