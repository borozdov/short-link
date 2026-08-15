import type { User as PrismaUser } from '../../generated/prisma/client.js';
import type { User } from '@short-link/shared';

export function toPublicUser(user: PrismaUser): User {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
  };
}
