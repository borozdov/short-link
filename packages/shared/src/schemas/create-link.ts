import { z } from 'zod';

export const CreateLinkRequestSchema = z.object({
  targetUrl: z.string().url(),
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
