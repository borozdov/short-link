import type { BulkTextResponse } from '@short-link/shared';
import { Textarea } from '../../primitives/Textarea';
import { CopyButton } from '../../primitives/CopyButton';
import { EmptyState } from '../../primitives/EmptyState';
import styles from './BulkTextResult.module.css';

export interface BulkTextResultProps {
  result: BulkTextResponse;
}

export function BulkTextResult({ result }: BulkTextResultProps) {
  return (
    <div className={styles.result}>
      <div>
        <p className={styles.note}>Rewritten text</p>
        <div className={styles.row}>
          <Textarea readOnly monospace rows={12} value={result.text} />
          <CopyButton value={result.text} />
        </div>
      </div>

      <div>
        <p className={styles.note}>Created links</p>
        {result.created.length === 0 ? (
          <EmptyState message="No links found in this text" />
        ) : (
          <ul className={styles.list}>
            {result.created.map((item) => (
              <li key={item.short} className={styles.listItem}>
                <span className={styles.original}>{item.original}</span>
                <span className={styles.short}>{item.short}</span>
                <CopyButton value={item.short} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
