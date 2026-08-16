import type { Request, Response } from 'express';
import { BULK_TEXT_MAX_LINKS, BulkTextRequestSchema } from '@short-link/shared';
import { prisma } from '../../db/client.js';
import { Prisma } from '../../generated/prisma/client.js';
import { env } from '../../config/env.js';
import { HttpError } from '../../middleware/http-error.js';
import { generateSecretToken, generateUid, MAX_UID_ATTEMPTS } from './uid.js';
import { extractUrls, isOwnDomainUrl, replaceUrls, type UrlMatch } from './url-extraction.js';

function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

async function createLinkWithRetry(tx: Prisma.TransactionClient, targetUrl: string) {
  for (let attempt = 0; attempt < MAX_UID_ATTEMPTS; attempt++) {
    try {
      return await tx.link.create({
        data: { targetUrl, uid: generateUid(), secretToken: generateSecretToken() },
      });
    } catch (error) {
      if (!isUniqueConstraintViolation(error) || attempt === MAX_UID_ATTEMPTS - 1) {
        throw new HttpError(500, 'UID_EXHAUSTED', 'Could not generate a unique link id');
      }
    }
  }
  // Unreachable — the loop above always either returns or throws.
  throw new HttpError(500, 'UID_EXHAUSTED', 'Could not generate a unique link id');
}

export async function shortenBulkText(req: Request, res: Response): Promise<void> {
  const parsed = BulkTextRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_TEXT', parsed.error.issues[0]?.message ?? 'Invalid request');
  }
  const { text } = parsed.data;

  const matches = extractUrls(text);
  if (matches.length > BULK_TEXT_MAX_LINKS) {
    throw new HttpError(400, 'TOO_MANY_LINKS', `Text contains more than ${BULK_TEXT_MAX_LINKS} links`);
  }

  const externalMatches = matches.filter((match) => !isOwnDomainUrl(match.url, env.BASE_LINK_DOMAIN));

  // Interactive form, not the array/batch form used elsewhere (redirect.ts) — a
  // batch of pre-built queries can't express "retry this one create on a uid
  // collision." Explicit timeout: the 5000ms default is tight for up to
  // BULK_TEXT_MAX_LINKS sequential creates plus occasional retries.
  const created = await prisma.$transaction(
    async (tx) => {
      const results: Array<{ match: UrlMatch; short: string }> = [];
      for (const match of externalMatches) {
        const link = await createLinkWithRetry(tx, match.url);
        results.push({ match, short: `${env.BASE_LINK_DOMAIN}/${link.uid}` });
      }
      return results;
    },
    { timeout: 20_000 },
  );

  // Keyed by match position, not URL string — the same URL can appear more than
  // once (no dedup, see plan), and a string key would collapse every repeat onto
  // the same short link while still creating N separate rows for it, silently
  // orphaning N-1 of them from the rewritten text.
  const shortByIndex = new Map(created.map(({ match, short }) => [match.index, short]));
  const rewritten = replaceUrls(text, matches, (match) => shortByIndex.get(match.index));

  res.status(200).json({
    data: {
      text: rewritten,
      created: created.map(({ match, short }) => ({ original: match.raw, short })),
    },
  });
}
