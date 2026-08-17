import { useEffect } from 'react';

export const SITE_URL = 'https://link.borozdov.ru';
export const DEFAULT_TITLE = 'BOROZDOV LINK — сократить ссылку с QR-кодом и статистикой';
export const DEFAULT_DESCRIPTION =
  'Сократите длинный URL в фирменную короткую ссылку link.borozdov.ru: QR-код, UTM-метки и приватная статистика переходов по секретной ссылке. Без регистрации.';
const DEFAULT_ROBOTS = 'index, follow';

interface DocumentHeadOptions {
  title: string;
  description?: string;
  robots?: string;
  /** Path for the canonical link, e.g. "/bulk-text". Omit to leave the canonical tag untouched (noindex pages). */
  canonicalPath?: string;
}

function setMeta(name: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setProperty(property: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string): void {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useDocumentHead({
  title,
  description = DEFAULT_DESCRIPTION,
  robots = DEFAULT_ROBOTS,
  canonicalPath,
}: DocumentHeadOptions): void {
  useEffect(() => {
    document.title = title;
    setMeta('description', description);
    setMeta('robots', robots);
    setProperty('og:title', title);
    setProperty('og:description', description);
    if (canonicalPath !== undefined) {
      const href = `${SITE_URL}${canonicalPath}`;
      setCanonical(href);
      setProperty('og:url', href);
    }

    return () => {
      document.title = DEFAULT_TITLE;
      setMeta('description', DEFAULT_DESCRIPTION);
      setMeta('robots', DEFAULT_ROBOTS);
      setProperty('og:title', DEFAULT_TITLE);
      setProperty('og:description', DEFAULT_DESCRIPTION);
    };
  }, [title, description, robots, canonicalPath]);
}
