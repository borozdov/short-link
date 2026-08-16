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
  return new Date(iso).toLocaleDateString('ru-RU');
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
        Сгенерировать ключ
      </Button>

      {generate.generated && (
        <Card padding="md">
          <p className={styles.note}>Скопируйте сейчас — повторно ключ не показывается</p>
          <div className={styles.row}>
            <Input readOnly monospace value={generate.generated.rawKey} />
            <CopyButton value={generate.generated.rawKey} />
          </div>
        </Card>
      )}

      {loading ? (
        <p className={styles.message}>Загрузка…</p>
      ) : apiKeys.length === 0 ? (
        <EmptyState message="Пока нет API-ключей. Сгенерируйте ключ, чтобы пользоваться публичным API." />
      ) : (
        <Table<ApiKey>
          columns={[
            { key: 'createdAt', header: 'Создан', render: (key) => formatDate(key.createdAt) },
            {
              key: 'status',
              header: 'Статус',
              render: (key) => (
                <Badge variant={key.revokedAt ? 'default' : 'inverted'}>
                  {key.revokedAt ? 'Отозван' : 'Активен'}
                </Badge>
              ),
            },
            {
              key: 'actions',
              header: '',
              render: (key) =>
                key.revokedAt ? null : (
                  <Button size="sm" onClick={() => setPendingRevoke(key)}>
                    Отозвать
                  </Button>
                ),
            },
          ]}
          rows={apiKeys}
        />
      )}

      <Modal open={pendingRevoke !== null} onClose={() => setPendingRevoke(null)}>
        <p className={styles.confirmText}>Отозвать этот API-ключ? Любой скрипт, использующий его, сразу перестанет работать.</p>
        <div className={styles.confirmActions}>
          <Button onClick={() => setPendingRevoke(null)}>Отмена</Button>
          <Button
            variant="inverted"
            loading={revoke.loading}
            onClick={() => pendingRevoke && void revoke.submit(pendingRevoke.id)}
          >
            Отозвать
          </Button>
        </div>
      </Modal>
    </div>
  );
}
