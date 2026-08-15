import express from 'express';
import { errorHandler } from './middleware/error-handler.js';
import { HttpError } from './middleware/http-error.js';

export const app = express();

app.use(express.json());

// Domain routers mount here, e.g. app.use('/api/links', linksRouter).
// The bare `GET /:uid` redirect handler mounts after all /api/* routes.

app.use('/api', (_req, _res, next) => {
  next(new HttpError(404, 'NOT_FOUND', 'Not found'));
});

app.use(errorHandler);
