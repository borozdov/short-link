import express from 'express';
import { errorHandler } from './middleware/error-handler.js';
import { HttpError } from './middleware/http-error.js';
import { linksRouter } from './domains/links/router.js';
import { redirectLink } from './domains/links/redirect.js';

export const app = express();

app.use(express.json());

app.use('/api/links', linksRouter);

app.use('/api', (_req, _res, next) => {
  next(new HttpError(404, 'NOT_FOUND', 'Not found'));
});

app.get('/:uid', redirectLink);

app.use(errorHandler);
