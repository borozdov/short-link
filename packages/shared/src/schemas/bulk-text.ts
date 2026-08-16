import { z } from 'zod';

export const BULK_TEXT_MAX_CHARS = 50_000;
export const BULK_TEXT_MAX_LINKS = 200;

export const BulkTextRequestSchema = z.object({
  text: z
    .string()
    .min(1, 'Введите текст')
    .max(BULK_TEXT_MAX_CHARS, `Текст не должен превышать ${BULK_TEXT_MAX_CHARS} символов`),
});

export type BulkTextRequest = z.infer<typeof BulkTextRequestSchema>;

export const BulkTextResponseSchema = z.object({
  text: z.string(),
  created: z.array(
    z.object({
      original: z.string(),
      short: z.string(),
    }),
  ),
});

export type BulkTextResponse = z.infer<typeof BulkTextResponseSchema>;
