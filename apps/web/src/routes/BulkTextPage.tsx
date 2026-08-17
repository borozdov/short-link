import { Card } from '../primitives/Card';
import { BulkTextForm } from '../features/bulk-text/BulkTextForm';
import { BulkTextResult } from '../features/bulk-text/BulkTextResult';
import { useBulkText } from '../features/bulk-text/useBulkText';
import { useDocumentHead } from '../seo/useDocumentHead';
import styles from './BulkTextPage.module.css';

const TITLE = 'Массовое сокращение ссылок — BOROZDOV LINK';
const DESCRIPTION =
  'Вставьте текст со ссылками — получите тот же текст с заменой всех URL на короткие link.borozdov.ru. Остальной текст не меняется.';

export function BulkTextPage() {
  const { result, loading, submit } = useBulkText();

  useDocumentHead({ title: TITLE, description: DESCRIPTION, canonicalPath: '/bulk-text' });

  return (
    <div className={styles.page}>
      <h1 className="srOnly">Массовое сокращение ссылок</h1>
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
