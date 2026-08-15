interface CookieBearingResponse {
  headers: Record<string, unknown>;
}

export function extractCookie(response: CookieBearingResponse, name: string): string {
  const setCookie = response.headers['set-cookie'] as unknown as string[] | undefined;
  const found = setCookie?.find((cookie) => cookie.startsWith(`${name}=`));
  if (!found) {
    throw new Error(`Cookie ${name} not found in response`);
  }
  return found.split(';')[0]!;
}
