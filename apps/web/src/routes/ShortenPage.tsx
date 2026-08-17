import { Card } from '../primitives/Card';
import { ShortenForm } from '../features/shorten/ShortenForm';
import { ShortenResult } from '../features/shorten/ShortenResult';
import { useCreateLink } from '../features/shorten/useCreateLink';
import { useDocumentHead, DEFAULT_TITLE, DEFAULT_DESCRIPTION } from '../seo/useDocumentHead';
import styles from './ShortenPage.module.css';

export function ShortenPage() {
  const { result, loading, submit } = useCreateLink();

  useDocumentHead({ title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, canonicalPath: '/' });

  return (
    <div className={styles.page}>
      <h1 className="srOnly">Сократить ссылку — BOROZDOV LINK</h1>
      <Card padding="lg">
        <ShortenForm loading={loading} onSubmit={submit} />
      </Card>
      {result && (
        <Card padding="lg">
          <ShortenResult result={result} />
        </Card>
      )}
    </div>
  );
}
