// Stub for Task 2. Real logic:
// UPDATE "Link" SET status = 'EXPIRED' WHERE status = 'ACTIVE' AND "expiresAt" < now()
export function runExpireSweep(): void {
  console.log(`[jobs] expire-sweep tick ${new Date().toISOString()}`);
}
