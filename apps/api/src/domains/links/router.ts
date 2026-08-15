import { Router } from 'express';
import { createLink } from './create.js';

export const linksRouter = Router();

linksRouter.post('/', createLink);
