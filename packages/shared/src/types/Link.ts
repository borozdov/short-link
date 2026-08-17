export type LinkStatus = 'ACTIVE' | 'EXPIRED' | 'DISABLED';

// Public projection of the Link model — no secretToken.
export interface Link {
  id: string;
  uid: string;
  targetUrl: string;
  status: LinkStatus;
  expiresAt: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  clickCount: number;
  createdAt: string;
}
