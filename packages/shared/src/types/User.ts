export type Role = 'USER' | 'ADMIN';

// Public projection of the User model — no passwordHash.
export interface User {
  id: string;
  email: string;
  role: Role;
  emailVerifiedAt: string | null;
  createdAt: string;
}
