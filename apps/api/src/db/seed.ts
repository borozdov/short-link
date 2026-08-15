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

  console.log('Seed complete.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
