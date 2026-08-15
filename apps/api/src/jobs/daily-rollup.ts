import { prisma } from '../db/client.js';

function truncateToUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function yesterdayUtc(): Date {
  const today = truncateToUtcDay(new Date());
  return new Date(today.getTime() - 24 * 60 * 60 * 1000);
}

// Aggregates Click rows by linkId for a given UTC day and upserts DailyLinkStat
// on the (linkId, date) key. Payload: date (defaults to yesterday, UTC).
// Idempotent — always recomputes and overwrites clickCount, never increments it.
export async function runDailyRollup(date?: string): Promise<void> {
  const day = date ? truncateToUtcDay(new Date(date)) : yesterdayUtc();
  const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);

  const grouped = await prisma.click.groupBy({
    by: ['linkId'],
    where: { occurredAt: { gte: day, lt: nextDay } },
    _count: { _all: true },
  });

  for (const group of grouped) {
    await prisma.dailyLinkStat.upsert({
      where: { linkId_date: { linkId: group.linkId, date: day } },
      create: { linkId: group.linkId, date: day, clickCount: group._count._all },
      update: { clickCount: group._count._all },
    });
  }

  console.log(`[jobs] daily-rollup: ${grouped.length} link(s) rolled up for ${day.toISOString().slice(0, 10)}`);
}
