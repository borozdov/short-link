import type { Request, Response } from 'express';
import { z } from 'zod';
import QRCode from 'qrcode';
import { prisma } from '../../db/client.js';
import { env } from '../../config/env.js';
import { HttpError } from '../../middleware/http-error.js';

const formatSchema = z.enum(['svg', 'png']).default('svg');

// BRAND.md's closed exception list: QR modules are always #0d0d0d on #fafafa,
// regardless of the active theme — inverted QR codes don't scan reliably.
const QR_COLOR = { dark: '#0d0d0dff', light: '#fafafaff' };

export async function getQrCode(req: Request<{ uid: string }>, res: Response): Promise<void> {
  const parsedFormat = formatSchema.safeParse(req.query.format);
  if (!parsedFormat.success) {
    throw new HttpError(400, 'INVALID_FORMAT', 'format должен быть svg или png');
  }

  const link = await prisma.link.findUnique({ where: { uid: req.params.uid } });
  if (!link) {
    throw new HttpError(404, 'NOT_FOUND', 'Не найдено');
  }

  const shortUrl = `${env.BASE_LINK_DOMAIN}/${link.uid}`;

  if (parsedFormat.data === 'png') {
    const buffer = await QRCode.toBuffer(shortUrl, { color: QR_COLOR });
    res.type('image/png').send(buffer);
    return;
  }

  const svg = await QRCode.toString(shortUrl, { type: 'svg', color: QR_COLOR });
  res.type('image/svg+xml').send(svg);
}
