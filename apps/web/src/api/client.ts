import type {
  ApiResponse,
  BulkTextRequest,
  BulkTextResponse,
  CreateLinkRequest,
  CreateLinkResponse,
  LinkStatsResponse,
} from '@short-link/shared';
import { API_BASE_URL } from '../config/env';

export class ApiError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function createLink(payload: CreateLinkRequest): Promise<CreateLinkResponse> {
  const response = await fetch(`${API_BASE_URL}/api/links`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as ApiResponse<CreateLinkResponse>;

  if ('error' in body) {
    throw new ApiError(body.error.code, body.error.message);
  }

  return body.data;
}

export async function shortenBulkText(payload: BulkTextRequest): Promise<BulkTextResponse> {
  const response = await fetch(`${API_BASE_URL}/api/links/bulk-text`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as ApiResponse<BulkTextResponse>;

  if ('error' in body) {
    throw new ApiError(body.error.code, body.error.message);
  }

  return body.data;
}

export async function getLinkStats(secretToken: string): Promise<LinkStatsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/links/stats/${secretToken}`);

  const body = (await response.json()) as ApiResponse<LinkStatsResponse>;

  if ('error' in body) {
    throw new ApiError(body.error.code, body.error.message);
  }

  return body.data;
}
