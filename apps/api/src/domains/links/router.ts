import { Router } from 'express';
import { createLink } from './create.js';
import { getQrCode } from './qr.js';

export const linksRouter = Router();

linksRouter.post('/', createLink);
linksRouter.get('/:uid/qr', getQrCode);
