import { useState } from 'react';
import type { ApiKey } from '@short-link/shared';
import { Card } from '../../primitives/Card';
import { Table } from '../../primitives/Table';
import { Badge } from '../../primitives/Badge';
import { Button } from '../../primitives/Button';
import { Modal } from '../../primitives/Modal';
import { Input } from '../../primitives/Input';
import { CopyButton } from '../../primitives/CopyButton';
import { EmptyState } from '../../primitives/EmptyState';
import { useApiKeys } from './useApiKeys';
import { useGenerateApiKey } from './useGenerateApiKey';
import { useRevokeApiKey } from './useRevokeApiKey';
import styles from './ApiKeysSection.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

export function ApiKeysSection() {
  const { apiKeys, loading, refresh } = useApiKeys();
  const [pendingRevoke, setPendingRevoke] = useState<ApiKey | null>(null);

  const generate = useGenerateApiKey(() => void refresh());
  const revoke = useRevokeApiKey(() => {
    setPendingRevoke(null);
    void refresh();
  });

  return (
    <div className={styles.section}>
      <Button
        variant="inverted"
        loading={generate.loading}
        onClick={() => void generate.submit()}
        className={styles.generateButton}
      >
        Generate new key
      </Button>

      {generate.generated && (
        <Card padding="md">
          <p className={styles.note}>Copy this now — you won&apos;t see it again</p>
          <div className={styles.row}>
            <Input readOnly monospace value={generate.generated.rawKey} />
            <CopyButton value={generate.generated.rawKey} />
          </div>
        </Card>
      )}

      {loading ? (
        <p className={styles.message}>Loading…</p>
      ) : apiKeys.length === 0 ? (
        <EmptyState message="No API keys yet. Generate one to use the public API." />
      ) : (
        <Table<ApiKey>
          columns={[
            { key: 'createdAt', header: 'Created', render: (key) => formatDate(key.createdAt) },
            {
              key: 'status',
              header: 'Status',
              render: (key) => (
                <Badge variant={key.revokedAt ? 'default' : 'inverted'}>
                  {key.revokedAt ? 'Revoked' : 'Active'}
                </Badge>
              ),
            },
            {
              key: 'actions',
              header: '',
              render: (key) =>
                key.revokedAt ? null : (
                  <Button size="sm" onClick={() => setPendingRevoke(key)}>
                    Revoke
                  </Button>
                ),
            },
          ]}
          rows={apiKeys}
        />
      )}

      <Modal open={pendingRevoke !== null} onClose={() => setPendingRevoke(null)}>
        <p className={styles.confirmText}>Revoke this API key? Any script using it will stop working immediately.</p>
        <div className={styles.confirmActions}>
          <Button onClick={() => setPendingRevoke(null)}>Cancel</Button>
          <Button
            variant="inverted"
            loading={revoke.loading}
            onClick={() => pendingRevoke && void revoke.submit(pendingRevoke.id)}
          >
            Revoke
          </Button>
        </div>
      </Modal>
    </div>
  );
}
