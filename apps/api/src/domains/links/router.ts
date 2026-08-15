import { Router } from 'express';
import { createLink } from './create.js';
import { getQrCode } from './qr.js';
import { getLinkStats } from './stats.js';

export const linksRouter = Router();

linksRouter.post('/', createLink);
linksRouter.get('/:uid/qr', getQrCode);
linksRouter.get('/stats/:secretToken', getLinkStats);
