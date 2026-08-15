// Stub. Real logic: aggregate Click rows by linkId for a given UTC day and
// upsert DailyLinkStat on the (linkId, date) key. Payload: { date: string }.
export function runDailyRollup(): void {
  console.log(`[jobs] daily-rollup tick ${new Date().toISOString()}`);
}
