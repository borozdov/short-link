import type { Request, Response } from 'express';
import { UpdateLinkStatusRequestSchema } from '@short-link/shared';
import { prisma } from '../../db/client.js';
import { HttpError } from '../../middleware/http-error.js';

export async function updateLinkStatus(req: Request<{ secretToken: string }>, res: Response): Promise<void> {
  const parsed = UpdateLinkStatusRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_STATUS', 'status должен быть ACTIVE или DISABLED');
  }

  const link = await prisma.link.findUnique({ where: { secretToken: req.params.secretToken } });
  if (!link) {
    throw new HttpError(404, 'NOT_FOUND', 'Не найдено');
  }
  if (link.status === 'EXPIRED') {
    throw new HttpError(409, 'LINK_EXPIRED', 'Ссылка истекла, статус нельзя изменить вручную');
  }

  const updated = await prisma.link.update({
    where: { secretToken: req.params.secretToken },
    data: { status: parsed.data.status },
  });

  res.json({ data: { uid: updated.uid, status: updated.status } });
}
