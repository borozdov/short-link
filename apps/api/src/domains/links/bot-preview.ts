import { lookup } from 'node:dns/promises';
import { BlockList } from 'node:net';

export interface PreviewData {
  title: string;
  description: string | null;
  image: string | null;
}

const BOT_USER_AGENT_PATTERNS = [
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'telegrambot',
  'whatsapp',
  'linkedinbot',
  'slackbot',
  'discordbot',
  'vkshare',
  'viber',
  'skypeuripreview',
  'redditbot',
  'pinterest',
];

export function isBotUserAgent(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  const lowered = userAgent.toLowerCase();
  return BOT_USER_AGENT_PATTERNS.some((pattern) => lowered.includes(pattern));
}

// Blocks fetches into private/loopback/link-local/metadata address space — the target
// of a preview fetch is an attacker-controlled URL (anyone can create a link pointing
// anywhere), so this is the actual security boundary, not the bot-detection above it.
function buildBlockList(): BlockList {
  const blockList = new BlockList();

  const ipv4Subnets: Array<[string, number]> = [
    ['0.0.0.0', 8],
    ['10.0.0.0', 8],
    ['100.64.0.0', 10],
    ['127.0.0.0', 8],
    ['169.254.0.0', 16], // includes cloud metadata (169.254.169.254)
    ['172.16.0.0', 12],
    ['192.0.0.0', 24],
    ['192.0.2.0', 24],
    ['192.88.99.0', 24],
    ['192.168.0.0', 16],
    ['198.18.0.0', 15],
    ['198.51.100.0', 24],
    ['203.0.113.0', 24],
    ['224.0.0.0', 4],
    ['240.0.0.0', 4],
  ];
  for (const [address, prefix] of ipv4Subnets) {
    blockList.addSubnet(address, prefix, 'ipv4');
  }

  // No explicit rule for ::ffff:0:0/96 (IPv4-mapped): net.BlockList already matches an
  // IPv4-mapped address against the ipv4 rules above automatically (verified — adding
  // that subnet explicitly here blocks the entire IPv4 space, since ipv4 checks are
  // themselves matched via their ::ffff: form internally).
  const ipv6Subnets: Array<[string, number]> = [
    ['::1', 128],
    ['::', 128],
    ['64:ff9b::', 96], // NAT64
    ['fc00::', 7], // unique local
    ['fe80::', 10], // link-local
    ['ff00::', 8], // multicast
    ['2001:db8::', 32], // documentation
  ];
  for (const [address, prefix] of ipv6Subnets) {
    blockList.addSubnet(address, prefix, 'ipv6');
  }

  return blockList;
}

const blockList = buildBlockList();

export async function isSafeHost(hostname: string): Promise<boolean> {
  let addresses;
  try {
    addresses = await lookup(hostname, { all: true });
  } catch {
    return false;
  }
  if (addresses.length === 0) return false;
  return addresses.every((addr) => !blockList.check(addr.address, addr.family === 6 ? 'ipv6' : 'ipv4'));
}

const FETCH_TIMEOUT_MS = 6000;
const MAX_BODY_BYTES = 1_000_000;
const MAX_REDIRECTS = 3;
const PREVIEW_USER_AGENT = 'BorozdovLinkPreviewBot/1.0 (+https://link.borozdov.ru)';

const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX_SIZE = 2000;
const previewCache = new Map<string, { data: PreviewData | null; expiresAt: number }>();

export async function fetchTargetPreview(targetUrl: string): Promise<PreviewData | null> {
  const cached = previewCache.get(targetUrl);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const data = await fetchTargetPreviewUncached(targetUrl);

  if (previewCache.size >= CACHE_MAX_SIZE) previewCache.clear();
  previewCache.set(targetUrl, { data, expiresAt: Date.now() + CACHE_TTL_MS });

  return data;
}

async function fetchTargetPreviewUncached(targetUrl: string): Promise<PreviewData | null> {
  let currentUrl: URL;
  try {
    currentUrl = new URL(targetUrl);
  } catch {
    return null;
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (currentUrl.protocol !== 'http:' && currentUrl.protocol !== 'https:') return null;
    if (!(await isSafeHost(currentUrl.hostname))) return null;

    let response: Response;
    try {
      response = await fetch(currentUrl, {
        redirect: 'manual',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { 'user-agent': PREVIEW_USER_AGENT, accept: 'text/html' },
      });
    } catch {
      return null;
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) return null;
      try {
        currentUrl = new URL(location, currentUrl);
      } catch {
        return null;
      }
      continue;
    }

    if (response.status !== 200) return null;
    if (!(response.headers.get('content-type') ?? '').includes('text/html')) return null;

    const html = await readHeadSection(response);
    return parsePreview(html, currentUrl);
  }

  return null;
}

// OG tags are guaranteed (by spec) to live in <head>, but real pages vary wildly in
// how much markup/inline script precedes it (a fixed byte cap missed YouTube's og:title,
// which sits past 200KB of decompressed HTML) — so read until </head> shows up, with a
// generous backstop for pages that never close it.
async function readHeadSection(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';

  const decoder = new TextDecoder('utf-8');
  let text = '';
  let total = 0;
  try {
    while (total < MAX_BODY_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      text += decoder.decode(value, { stream: true });
      if (/<\/head>/i.test(text)) break;
    }
  } catch {
    // Timed out or connection dropped mid-stream — fall through with whatever we
    // read so far (parsePreview may still find a title if we got far enough).
  } finally {
    await reader.cancel().catch(() => {});
  }

  return text;
}

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
};

function decodeEntities(text: string): string {
  return text.replace(/&(?:amp|lt|gt|quot|#39|apos|nbsp);/g, (entity) => HTML_ENTITIES[entity] ?? entity);
}

function extractMeta(html: string, propertyOrName: string): string | null {
  const escaped = propertyOrName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${escaped}["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeEntities(match[1].trim());
  }
  return null;
}

function extractTitleTag(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1] ? decodeEntities(match[1].trim()) : null;
}

function resolveUrl(possiblyRelative: string, base: URL): string | null {
  try {
    return new URL(possiblyRelative, base).toString();
  } catch {
    return null;
  }
}

function parsePreview(html: string, baseUrl: URL): PreviewData | null {
  const title = extractMeta(html, 'og:title') ?? extractMeta(html, 'twitter:title') ?? extractTitleTag(html);
  if (!title) return null;

  const description = extractMeta(html, 'og:description') ?? extractMeta(html, 'twitter:description') ?? extractMeta(html, 'description');
  const rawImage = extractMeta(html, 'og:image') ?? extractMeta(html, 'twitter:image');

  return {
    title,
    description,
    image: rawImage ? resolveUrl(rawImage, baseUrl) : null,
  };
}

function escapeHtml(text: string): string {
  const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return text.replace(/[&<>"']/g, (char) => ESCAPES[char]!);
}

export interface RenderPreviewInput extends PreviewData {
  shortUrl: string;
  targetUrl: string;
}

export function renderPreviewHtml({ title, description, image, shortUrl, targetUrl }: RenderPreviewInput): string {
  const safeTitle = escapeHtml(title);
  const safeTargetUrl = escapeHtml(targetUrl);

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>${safeTitle}</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="BOROZDOV LINK">
<meta property="og:url" content="${escapeHtml(shortUrl)}">
<meta property="og:title" content="${safeTitle}">
${description ? `<meta property="og:description" content="${escapeHtml(description)}">` : ''}
${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ''}
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${safeTitle}">
${description ? `<meta name="twitter:description" content="${escapeHtml(description)}">` : ''}
${image ? `<meta name="twitter:image" content="${escapeHtml(image)}">` : ''}
<meta http-equiv="refresh" content="0; url=${safeTargetUrl}">
</head>
<body><a href="${safeTargetUrl}">${safeTargetUrl}</a></body>
</html>`;
}
