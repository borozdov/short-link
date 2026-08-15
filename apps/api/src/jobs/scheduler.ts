import { schedule } from 'node-cron';
import { runExpireSweep } from './expire-sweep.js';
import { runDailyRollup } from './daily-rollup.js';

export function startScheduler(): void {
  // Proves the cron infra is wired up; visible in logs independent of the real jobs below.
  schedule('* * * * *', () => {
    console.log(`[jobs] scheduler heartbeat ${new Date().toISOString()}`);
  });

  schedule('0 * * * *', runExpireSweep);

  schedule('10 0 * * *', runDailyRollup, { timezone: 'UTC' });
}
