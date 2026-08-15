import { app } from './app.js';
import { env } from './config/env.js';
import { startScheduler } from './jobs/scheduler.js';

app.listen(env.PORT, () => {
  console.log(`API listening on port ${env.PORT}`);
});

startScheduler();
