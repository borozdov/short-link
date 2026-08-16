import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { Card } from '../primitives/Card';
import { Input } from '../primitives/Input';
import { CopyButton } from '../primitives/CopyButton';
import { ShortenResult } from '../features/shorten/ShortenResult';
import { useCreateLink } from '../features/shorten/useCreateLink';
import styles from './BookmarkletPage.module.css';

function buildBookmarkletCode(origin: string): string {
  return `javascript:(function(){window.open('${origin}/bookmarklet?url='+encodeURIComponent(location.href),'_blank','noopener')})()`;
}

export function BookmarkletPage() {
  const [searchParams] = useSearchParams();
  const url = searchParams.get('url');
  const { result, loading, submit } = useCreateLink();
  const submitted = useRef(false);

  useEffect(() => {
    if (url && !submitted.current) {
      submitted.current = true;
      void submit({ targetUrl: url });
    }
  }, [url, submit]);

  if (url) {
    return (
      <div className={styles.page}>
        <Card padding="lg">
          {loading && <p className={styles.message}>Shortening…</p>}
          {result && <ShortenResult result={result} />}
        </Card>
      </div>
    );
  }

  const bookmarkletCode = buildBookmarkletCode(window.location.origin);

  return (
    <div className={styles.page}>
      <Card padding="lg">
        <h1 className={styles.title}>Bookmarklet</h1>
        <p className={styles.description}>
          Drag this link to your bookmarks bar. Click it on any page to shorten that page&apos;s URL.
        </p>
        <a href={bookmarkletCode} className={styles.bookmarklet} onClick={(event) => event.preventDefault()}>
          Shorten this page
        </a>
        <p className={styles.note}>Or copy the code and create the bookmark manually</p>
        <div className={styles.row}>
          <Input readOnly monospace value={bookmarkletCode} />
          <CopyButton value={bookmarkletCode} />
        </div>
      </Card>
    </div>
  );
}
