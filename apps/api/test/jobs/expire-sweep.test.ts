import { describe, expect, it } from 'vitest';
import { prisma } from '../../src/db/client.js';
import { runExpireSweep } from '../../src/jobs/expire-sweep.js';

describe('runExpireSweep', () => {
  it('expires only ACTIVE links past expiresAt, idempotently', async () => {
    const past = new Date(Date.now() - 60 * 60 * 1000);
    const future = new Date(Date.now() + 60 * 60 * 1000);

    const expiredCandidate = await prisma.link.create({
      data: {
        uid: 'exp1',
        targetUrl: 'https://example.com/a',
        secretToken: 'secret-exp1',
        status: 'ACTIVE',
        expiresAt: past,
      },
    });
    const stillActive = await prisma.link.create({
      data: {
        uid: 'exp2',
        targetUrl: 'https://example.com/b',
        secretToken: 'secret-exp2',
        status: 'ACTIVE',
        expiresAt: future,
      },
    });
    const alreadyDisabled = await prisma.link.create({
      data: {
        uid: 'exp3',
        targetUrl: 'https://example.com/c',
        secretToken: 'secret-exp3',
        status: 'DISABLED',
        expiresAt: past,
      },
    });

    async function snapshot() {
      return Promise.all([
        prisma.link.findUniqueOrThrow({ where: { id: expiredCandidate.id } }),
        prisma.link.findUniqueOrThrow({ where: { id: stillActive.id } }),
        prisma.link.findUniqueOrThrow({ where: { id: alreadyDisabled.id } }),
      ]);
    }

    await runExpireSweep();
    const afterFirst = await snapshot();
    expect(afterFirst[0].status).toBe('EXPIRED');
    expect(afterFirst[1].status).toBe('ACTIVE');
    expect(afterFirst[2].status).toBe('DISABLED');

    await runExpireSweep();
    const afterSecond = await snapshot();
    expect(afterSecond).toEqual(afterFirst);
  });
});
