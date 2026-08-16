import { z } from 'zod';

// Shaped differently from the stored/public ApiKey — this is the one response that carries
// the raw key, mirroring why CreateLinkResponse has its own schema instead of reusing Link.
export const ApiKeyGenerateResponseSchema = z.object({
  id: z.string(),
  rawKey: z.string(),
  createdAt: z.string(),
});

export type ApiKeyGenerateResponse = z.infer<typeof ApiKeyGenerateResponseSchema>;
