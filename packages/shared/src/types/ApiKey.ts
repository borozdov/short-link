// Public projection of the ApiKey model — no keyHash.
export interface ApiKey {
  id: string;
  ownerId: string;
  createdAt: string;
  revokedAt: string | null;
}
