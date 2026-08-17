import { Router } from 'express';
import { createLink } from './create.js';
import { getQrCode } from './qr.js';
import { getLinkStats } from './stats.js';
import { shortenBulkText } from './bulk-text.js';

export const linksRouter = Router();

linksRouter.post('/', createLink);
linksRouter.post('/bulk-text', shortenBulkText);
linksRouter.get('/:uid/qr', getQrCode);
linksRouter.get('/stats/:secretToken', getLinkStats);
