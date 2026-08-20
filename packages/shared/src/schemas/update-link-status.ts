import { z } from 'zod';

export const UpdateLinkStatusRequestSchema = z.object({
  status: z.enum(['ACTIVE', 'DISABLED']),
});

export type UpdateLinkStatusRequest = z.infer<typeof UpdateLinkStatusRequestSchema>;

export const UpdateLinkStatusResponseSchema = z.object({
  uid: z.string(),
  status: z.enum(['ACTIVE', 'DISABLED', 'EXPIRED']),
});

export type UpdateLinkStatusResponse = z.infer<typeof UpdateLinkStatusResponseSchema>;
