import { beforeEach } from 'vitest';
import { prisma } from '../src/db/client.js';

beforeEach(async () => {
  await prisma.click.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.link.deleteMany();
  await prisma.user.deleteMany();
});
