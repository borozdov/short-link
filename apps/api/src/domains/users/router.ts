import { Router } from 'express';
import { authGuard } from '../../middleware/auth-guard.js';
import { listUserLinks } from './list-links.js';
import { getUserLinkStats } from './link-stats.js';
import { claimLink } from './claim.js';
import { unclaimLink } from './unclaim.js';

export const usersRouter = Router();

usersRouter.use(authGuard);

usersRouter.get('/links', listUserLinks);
usersRouter.get('/links/:id/stats', getUserLinkStats);
usersRouter.post('/links/claim', claimLink);
usersRouter.post('/links/:id/unclaim', unclaimLink);
