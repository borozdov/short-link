import { LinkifyIt } from 'linkify-it';

// fuzzyEmail defaults to true — without disabling it, a plain email address in
// pasted text (a signature block, "contact me at x@y.com") would get "shortened"
// too. fuzzyLink (bare domains without http://) defaults to false — enabling it
// is the whole reason tech.md picked linkify-it over a hand-rolled regex.
const linkify = new LinkifyIt({ fuzzyEmail: false, fuzzyLink: true });

export interface UrlMatch {
  url: string; // normalized absolute URL — used for targetUrl and the own-domain check
  raw: string; // exact substring as it appears in the source text
  index: number;
  lastIndex: number;
}

export function extractUrls(text: string): UrlMatch[] {
  const matches = linkify.match(text) ?? [];
  return matches.map((match) => ({
    url: match.url,
    raw: match.raw,
    index: match.index,
    lastIndex: match.lastIndex,
  }));
}

export function replaceUrls(
  text: string,
  matches: UrlMatch[],
  resolve: (match: UrlMatch) => string | undefined,
): string {
  let result = '';
  let cursor = 0;

  for (const match of matches) {
    result += text.slice(cursor, match.index);
    result += resolve(match) ?? match.raw;
    cursor = match.lastIndex;
  }

  return result + text.slice(cursor);
}

export function isOwnDomainUrl(url: string, baseLinkDomain: string): boolean {
  try {
    return new URL(url).host === new URL(baseLinkDomain).host;
  } catch {
    return false;
  }
}
