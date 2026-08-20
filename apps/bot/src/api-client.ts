import type {
  ApiResponse,
  CreateLinkRequest,
  CreateLinkResponse,
  LinkStatsResponse,
  UpdateLinkStatusRequest,
  UpdateLinkStatusResponse,
} from '@short-link/shared';
import { env } from './config/env.js';

export class ApiError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function unwrap<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiResponse<T>;
  if ('error' in body) {
    throw new ApiError(body.error.code, body.error.message);
  }
  return body.data;
}

export async function createLink(payload: CreateLinkRequest): Promise<CreateLinkResponse> {
  const response = await fetch(`${env.BOT_API_BASE_URL}/api/links`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return unwrap<CreateLinkResponse>(response);
}

export async function getLinkStats(secretToken: string): Promise<LinkStatsResponse> {
  const response = await fetch(`${env.BOT_API_BASE_URL}/api/links/stats/${secretToken}`);
  return unwrap<LinkStatsResponse>(response);
}

export async function updateLinkStatus(
  secretToken: string,
  status: UpdateLinkStatusRequest['status'],
): Promise<UpdateLinkStatusResponse> {
  const response = await fetch(`${env.BOT_API_BASE_URL}/api/links/stats/${secretToken}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return unwrap<UpdateLinkStatusResponse>(response);
}
