import { prisma } from './client.js';
import { generateSecretToken } from '../domains/links/uid.js';

async function main() {
  const activeLink = await prisma.link.upsert({
    where: { uid: 'demo001' },
    update: {},
    create: {
      uid: 'demo001',
      targetUrl: 'https://borozdov.ru',
      secretToken: generateSecretToken(),
      status: 'ACTIVE',
      clickCount: 2,
    },
  });

  const secondLink = await prisma.link.upsert({
    where: { uid: 'demo004' },
    update: {},
    create: {
      uid: 'demo004',
      targetUrl: 'https://borozdov.ru/about',
      secretToken: generateSecretToken(),
      status: 'ACTIVE',
      clickCount: 1,
    },
  });

  await prisma.link.upsert({
    where: { uid: 'demo002' },
    update: {},
    create: {
      uid: 'demo002',
      targetUrl: 'https://borozdov.ru/old-post',
      secretToken: generateSecretToken(),
      status: 'EXPIRED',
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });

  const anonymousLink = await prisma.link.upsert({
    where: { uid: 'demo003' },
    update: {},
    create: {
      uid: 'demo003',
      targetUrl: 'https://borozdov.ru/anonymous',
      secretToken: generateSecretToken(),
      status: 'ACTIVE',
    },
  });

  await prisma.click.deleteMany({
    where: { linkId: { in: [activeLink.id, secondLink.id] } },
  });
  await prisma.click.createMany({
    data: [
      { linkId: activeLink.id, referrer: 'https://twitter.com' },
      { linkId: activeLink.id, referrer: null },
      { linkId: secondLink.id, referrer: 'https://t.me/borozdov' },
    ],
  });

  const oneDayMs = 24 * 60 * 60 * 1000;
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const dailyCounts = [2, 0, 5, 3, 1, 4, 2];

  await prisma.dailyLinkStat.deleteMany({
    where: { linkId: { in: [activeLink.id, secondLink.id] } },
  });
  for (const [linkId, counts] of [
    [activeLink.id, dailyCounts],
    [secondLink.id, dailyCounts.map((count) => Math.max(0, count - 1))],
  ] as const) {
    await prisma.dailyLinkStat.createMany({
      data: counts.map((clickCount, dayIndex) => ({
        linkId,
        date: new Date(todayUtc.getTime() - (counts.length - dayIndex) * oneDayMs),
        clickCount,
      })),
    });
  }

  console.log(`Seed complete. Anonymous link secretToken: ${anonymousLink.secretToken}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
