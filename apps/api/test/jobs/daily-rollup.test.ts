import { describe, expect, it } from 'vitest';
import { prisma } from '../../src/db/client.js';
import { runDailyRollup } from '../../src/jobs/daily-rollup.js';

describe('runDailyRollup', () => {
  it('aggregates Click rows into DailyLinkStat idempotently', async () => {
    const link = await prisma.link.create({
      data: { uid: 'rollup1', targetUrl: 'https://example.com/rollup', secretToken: 'rollup-secret' },
    });

    const targetDate = '2026-08-10';
    const dayStart = new Date('2026-08-10T00:00:00.000Z');

    await prisma.click.createMany({
      data: [
        { linkId: link.id, occurredAt: new Date('2026-08-10T12:00:00.000Z') },
        { linkId: link.id, occurredAt: new Date('2026-08-10T23:59:00.000Z') },
        { linkId: link.id, occurredAt: new Date('2026-08-11T00:00:00.000Z') }, // outside the target day
      ],
    });

    await runDailyRollup(targetDate);
    const afterFirst = await prisma.dailyLinkStat.findUniqueOrThrow({
      where: { linkId_date: { linkId: link.id, date: dayStart } },
    });
    expect(afterFirst.clickCount).toBe(2);

    await runDailyRollup(targetDate);
    const afterSecond = await prisma.dailyLinkStat.findUniqueOrThrow({
      where: { linkId_date: { linkId: link.id, date: dayStart } },
    });
    expect(afterSecond.clickCount).toBe(2);
  });

  it('defaults to yesterday (UTC) when no date is given', async () => {
    const link = await prisma.link.create({
      data: { uid: 'rollup2', targetUrl: 'https://example.com/rollup2', secretToken: 'rollup-secret-2' },
    });

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayUtcStart = new Date(
      Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate()),
    );

    await prisma.click.create({
      data: { linkId: link.id, occurredAt: new Date(yesterdayUtcStart.getTime() + 60 * 60 * 1000) },
    });

    await runDailyRollup();

    const stat = await prisma.dailyLinkStat.findUniqueOrThrow({
      where: { linkId_date: { linkId: link.id, date: yesterdayUtcStart } },
    });
    expect(stat.clickCount).toBe(1);
  });
});
