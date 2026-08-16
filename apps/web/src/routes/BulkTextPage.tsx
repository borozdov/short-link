import { Card } from '../primitives/Card';
import { BulkTextForm } from '../features/bulk-text/BulkTextForm';
import { BulkTextResult } from '../features/bulk-text/BulkTextResult';
import { useBulkText } from '../features/bulk-text/useBulkText';
import styles from './BulkTextPage.module.css';

export function BulkTextPage() {
  const { result, loading, submit } = useBulkText();

  return (
    <div className={styles.page}>
      <Card padding="lg">
        <BulkTextForm loading={loading} onSubmit={submit} />
      </Card>
      {result && (
        <Card padding="lg">
          <BulkTextResult result={result} />
        </Card>
      )}
    </div>
  );
}
