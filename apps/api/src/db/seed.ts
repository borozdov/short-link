import bcrypt from 'bcrypt';
import { prisma } from './client.js';
import { generateSecretToken } from '../domains/links/uid.js';

async function main() {
  const passwordHash = await bcrypt.hash('demo-admin-password', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@local.test' },
    update: {},
    create: {
      email: 'admin@local.test',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const demoUserPasswordHash = await bcrypt.hash('demo-user-password', 10);
  await prisma.user.upsert({
    where: { email: 'demo@local.test' },
    update: {},
    create: {
      email: 'demo@local.test',
      passwordHash: demoUserPasswordHash,
      role: 'USER',
    },
  });

  const activeLink = await prisma.link.upsert({
    where: { uid: 'demo001' },
    update: {},
    create: {
      uid: 'demo001',
      targetUrl: 'https://borozdov.ru',
      secretToken: generateSecretToken(),
      status: 'ACTIVE',
      ownerId: admin.id,
      clickCount: 2,
    },
  });

  const customSlugLink = await prisma.link.upsert({
    where: { uid: 'nikita' },
    update: {},
    create: {
      uid: 'nikita',
      targetUrl: 'https://borozdov.ru/about',
      secretToken: generateSecretToken(),
      isCustomSlug: true,
      status: 'ACTIVE',
      ownerId: admin.id,
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
      ownerId: admin.id,
    },
  });

  // Unclaimed — demos the Task 4 claim flow (its secretToken is logged below).
  const anonymousLink = await prisma.link.upsert({
    where: { uid: 'demo003' },
    update: {},
    create: {
      uid: 'demo003',
      targetUrl: 'https://borozdov.ru/anonymous',
      secretToken: generateSecretToken(),
      status: 'ACTIVE',
      ownerId: null,
    },
  });

  await prisma.click.deleteMany({
    where: { linkId: { in: [activeLink.id, customSlugLink.id] } },
  });
  await prisma.click.createMany({
    data: [
      { linkId: activeLink.id, referrer: 'https://twitter.com' },
      { linkId: activeLink.id, referrer: null },
      { linkId: customSlugLink.id, referrer: 'https://t.me/borozdov' },
    ],
  });

  const oneDayMs = 24 * 60 * 60 * 1000;
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const dailyCounts = [2, 0, 5, 3, 1, 4, 2];

  await prisma.dailyLinkStat.deleteMany({
    where: { linkId: { in: [activeLink.id, customSlugLink.id] } },
  });
  for (const [linkId, counts] of [
    [activeLink.id, dailyCounts],
    [customSlugLink.id, dailyCounts.map((count) => Math.max(0, count - 1))],
  ] as const) {
    await prisma.dailyLinkStat.createMany({
      data: counts.map((clickCount, dayIndex) => ({
        linkId,
        date: new Date(todayUtc.getTime() - (counts.length - dayIndex) * oneDayMs),
        clickCount,
      })),
    });
  }

  console.log(`Seed complete. Anonymous link secretToken (for claim demo): ${anonymousLink.secretToken}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
