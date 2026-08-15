import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import { Prisma } from '../../generated/prisma/client.js';
import { env } from '../../config/env.js';
import { HttpError } from '../../middleware/http-error.js';
import { generateSecretToken, generateUid } from './uid.js';

const MAX_UID_ATTEMPTS = 5;

// Minimal shape for the skeleton's reference slice — no customSlug/expiresInHours/utm/qr yet.
const createLinkSchema = z.object({
  targetUrl: z.string().url(),
});

function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export async function createLink(req: Request, res: Response): Promise<void> {
  const parsed = createLinkSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_TARGET_URL', 'targetUrl must be a valid URL');
  }
  const { targetUrl } = parsed.data;

  for (let attempt = 0; attempt < MAX_UID_ATTEMPTS; attempt++) {
    try {
      const link = await prisma.link.create({
        data: {
          uid: generateUid(),
          targetUrl,
          secretToken: generateSecretToken(),
        },
      });

      res.status(201).json({
        data: {
          shortUrl: `${env.BASE_LINK_DOMAIN}/${link.uid}`,
          uid: link.uid,
          secretToken: link.secretToken,
        },
      });
      return;
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        continue;
      }
      throw error;
    }
  }

  throw new HttpError(500, 'UID_EXHAUSTED', 'Could not generate a unique link id');
}
