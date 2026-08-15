import type {
  ApiResponse,
  ClaimLinkRequest,
  Click,
  CreateLinkRequest,
  CreateLinkResponse,
  DailyLinkStat,
  Link,
  LinkStatsResponse,
  LoginRequest,
  RegisterRequest,
  User,
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

export async function getLinkStats(secretToken: string): Promise<LinkStatsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/links/stats/${secretToken}`);

  const body = (await response.json()) as ApiResponse<LinkStatsResponse>;

  if ('error' in body) {
    throw new ApiError(body.error.code, body.error.message);
  }

  return body.data;
}

export async function register(payload: RegisterRequest): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as ApiResponse<User>;

  if ('error' in body) {
    throw new ApiError(body.error.code, body.error.message);
  }

  return body.data;
}

export async function login(payload: LoginRequest): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as ApiResponse<User>;

  if ('error' in body) {
    throw new ApiError(body.error.code, body.error.message);
  }

  return body.data;
}

export async function logout(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  const body = (await response.json()) as ApiResponse<null>;

  if ('error' in body) {
    throw new ApiError(body.error.code, body.error.message);
  }
}

export async function getCurrentUser(): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    credentials: 'include',
  });

  const body = (await response.json()) as ApiResponse<User>;

  if ('error' in body) {
    throw new ApiError(body.error.code, body.error.message);
  }

  return body.data;
}

export async function getUserLinks(): Promise<Link[]> {
  const response = await fetch(`${API_BASE_URL}/api/users/links`, {
    credentials: 'include',
  });

  const body = (await response.json()) as ApiResponse<Link[]>;

  if ('error' in body) {
    throw new ApiError(body.error.code, body.error.message);
  }

  return body.data;
}

export interface UserLinkStats {
  link: Link;
  dailyStats: DailyLinkStat[];
  clicks: Click[];
}

export async function getUserLinkStats(id: string): Promise<UserLinkStats> {
  const response = await fetch(`${API_BASE_URL}/api/users/links/${id}/stats`, {
    credentials: 'include',
  });

  const body = (await response.json()) as ApiResponse<UserLinkStats>;

  if ('error' in body) {
    throw new ApiError(body.error.code, body.error.message);
  }

  return body.data;
}

export async function claimLink(payload: ClaimLinkRequest): Promise<Link> {
  const response = await fetch(`${API_BASE_URL}/api/users/links/claim`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as ApiResponse<Link>;

  if ('error' in body) {
    throw new ApiError(body.error.code, body.error.message);
  }

  return body.data;
}

export async function unclaimLink(id: string): Promise<Link> {
  const response = await fetch(`${API_BASE_URL}/api/users/links/${id}/unclaim`, {
    method: 'POST',
    credentials: 'include',
  });

  const body = (await response.json()) as ApiResponse<Link>;

  if ('error' in body) {
    throw new ApiError(body.error.code, body.error.message);
  }

  return body.data;
}
