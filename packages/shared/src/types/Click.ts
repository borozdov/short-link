// Public projection of the Click model — no ipHash.
export interface Click {
  id: string;
  linkId: string;
  occurredAt: string;
  referrer: string | null;
  userAgent: string | null;
  country: string | null;
}
