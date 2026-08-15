import type { Request, Response } from 'express';
import type { z } from 'zod';
import { CreateLinkRequestSchema } from '@short-link/shared';
import { prisma } from '../../db/client.js';
import { Prisma, type Link } from '../../generated/prisma/client.js';
import { env } from '../../config/env.js';
import { HttpError } from '../../middleware/http-error.js';
import { generateSecretToken, generateUid } from './uid.js';

const MAX_UID_ATTEMPTS = 5;

function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function throwForValidationError(error: z.ZodError): never {
  const field = error.issues[0]?.path[0];
  const message = error.issues[0]?.message ?? 'Invalid request';

  if (field === 'customSlug') {
    throw new HttpError(400, 'INVALID_CUSTOM_SLUG', message);
  }
  if (field === 'expiresInHours') {
    throw new HttpError(400, 'INVALID_EXPIRES_IN_HOURS', message);
  }
  throw new HttpError(400, 'INVALID_TARGET_URL', 'targetUrl must be a valid URL');
}

function sendLink(res: Response, link: Link): void {
  res.status(201).json({
    data: {
      shortUrl: `${env.BASE_LINK_DOMAIN}/${link.uid}`,
      uid: link.uid,
      secretToken: link.secretToken,
    },
  });
}

export async function createLink(req: Request, res: Response): Promise<void> {
  const parsed = CreateLinkRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throwForValidationError(parsed.error);
  }
  const { targetUrl, customSlug } = parsed.data;

  if (customSlug) {
    try {
      const link = await prisma.link.create({
        data: {
          uid: customSlug,
          targetUrl,
          secretToken: generateSecretToken(),
          isCustomSlug: true,
        },
      });
      sendLink(res, link);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new HttpError(409, 'SLUG_TAKEN', 'This slug is already in use');
      }
      throw error;
    }
    return;
  }

  for (let attempt = 0; attempt < MAX_UID_ATTEMPTS; attempt++) {
    try {
      const link = await prisma.link.create({
        data: {
          uid: generateUid(),
          targetUrl,
          secretToken: generateSecretToken(),
        },
      });
      sendLink(res, link);
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
