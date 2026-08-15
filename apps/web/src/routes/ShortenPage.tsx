import { Card } from '../primitives/Card';
import { ShortenForm } from '../features/shorten/ShortenForm';
import { ShortenResult } from '../features/shorten/ShortenResult';
import { useCreateLink } from '../features/shorten/useCreateLink';
import styles from './ShortenPage.module.css';

export function ShortenPage() {
  const { result, loading, submit } = useCreateLink();

  return (
    <div className={styles.page}>
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
