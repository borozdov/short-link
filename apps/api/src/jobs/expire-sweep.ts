import { prisma } from '../db/client.js';

export async function runExpireSweep(): Promise<void> {
  const { count } = await prisma.link.updateMany({
    where: { status: 'ACTIVE', expiresAt: { lt: new Date() } },
    data: { status: 'EXPIRED' },
  });
  console.log(`[jobs] expire-sweep: ${count} link(s) expired`);
}
