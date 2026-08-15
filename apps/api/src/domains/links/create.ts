import type { Request, Response } from 'express';
import type { z } from 'zod';
import { CreateLinkRequestSchema, type CreateLinkRequest } from '@short-link/shared';
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

// Fields shared by both the custom-slug and generated-uid create paths below.
function baseLinkData(input: CreateLinkRequest) {
  const expiresAt = input.expiresInHours
    ? new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000)
    : null;

  return {
    targetUrl: input.targetUrl,
    secretToken: generateSecretToken(),
    expiresAt,
    // Accepted and stored even though the Task 1 form has no UTM inputs yet (Task 7's job) —
    // keeps the frozen request contract genuinely implemented server-side.
    utmSource: input.utm?.source ?? null,
    utmMedium: input.utm?.medium ?? null,
    utmCampaign: input.utm?.campaign ?? null,
  };
}

export async function createLink(req: Request, res: Response): Promise<void> {
  const parsed = CreateLinkRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throwForValidationError(parsed.error);
  }
  const input = parsed.data;

  if (input.customSlug) {
    try {
      const link = await prisma.link.create({
        data: {
          ...baseLinkData(input),
          uid: input.customSlug,
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
          ...baseLinkData(input),
          uid: generateUid(),
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
