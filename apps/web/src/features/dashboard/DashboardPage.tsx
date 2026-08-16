import { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import type { Link, LinkStatus } from '@short-link/shared';
import { Card } from '../../primitives/Card';
import { Table } from '../../primitives/Table';
import { Tabs } from '../../primitives/Tabs';
import { Badge } from '../../primitives/Badge';
import { Button } from '../../primitives/Button';
import { Modal } from '../../primitives/Modal';
import { EmptyState } from '../../primitives/EmptyState';
import { useUserLinks } from './useUserLinks';
import { useClaimLink } from './useClaimLink';
import { useUnclaimLink } from './useUnclaimLink';
import { ClaimLinkForm } from './ClaimLinkForm';
import { ApiKeysSection } from './ApiKeysSection';
import styles from './DashboardPage.module.css';

const STATUS_VARIANT: Record<LinkStatus, 'default' | 'inverted'> = {
  ACTIVE: 'inverted',
  EXPIRED: 'default',
  DISABLED: 'default',
};

const STATUS_LABEL: Record<LinkStatus, string> = {
  ACTIVE: 'Активна',
  EXPIRED: 'Истекла',
  DISABLED: 'Отключена',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU');
}

export function DashboardPage() {
  const { links, loading, refresh } = useUserLinks();
  const [tab, setTab] = useState('links');
  const [pendingUnclaim, setPendingUnclaim] = useState<Link | null>(null);

  const claim = useClaimLink(() => {
    void refresh();
    setTab('links');
  });

  const unclaim = useUnclaimLink(() => {
    setPendingUnclaim(null);
    void refresh();
  });

  return (
    <div className={styles.page}>
      <Tabs
        tabs={[
          { key: 'links', label: 'Ссылки' },
          { key: 'claim', label: 'Забрать ссылку' },
          { key: 'apiKeys', label: 'API-ключи' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'links' && (
        <Card padding="lg">
          {loading ? (
            <p className={styles.message}>Загрузка…</p>
          ) : links.length === 0 ? (
            <EmptyState message="Пока нет ссылок. Создайте новую или заберите анонимную ссылку по её секретному токену." />
          ) : (
            <Table<Link>
              columns={[
                {
                  key: 'uid',
                  header: 'Ссылка',
                  render: (link) => (
                    <RouterLink className={styles.linkCell} to={`/dashboard/links/${link.id}`}>
                      /{link.uid}
                    </RouterLink>
                  ),
                },
                {
                  key: 'status',
                  header: 'Статус',
                  render: (link) => <Badge variant={STATUS_VARIANT[link.status]}>{STATUS_LABEL[link.status]}</Badge>,
                },
                { key: 'clickCount', header: 'Клики', numeric: true, render: (link) => link.clickCount },
                { key: 'createdAt', header: 'Создана', render: (link) => formatDate(link.createdAt) },
                {
                  key: 'actions',
                  header: '',
                  render: (link) => (
                    <Button size="sm" onClick={() => setPendingUnclaim(link)}>
                      Убрать
                    </Button>
                  ),
                },
              ]}
              rows={links}
            />
          )}
        </Card>
      )}

      {tab === 'claim' && (
        <Card padding="lg">
          <ClaimLinkForm loading={claim.loading} onSubmit={claim.submit} />
        </Card>
      )}

      {tab === 'apiKeys' && (
        <Card padding="lg">
          <ApiKeysSection />
        </Card>
      )}

      <Modal open={pendingUnclaim !== null} onClose={() => setPendingUnclaim(null)}>
        <p className={styles.confirmText}>
          Убрать <strong>/{pendingUnclaim?.uid}</strong> из личного кабинета? Ссылка продолжит работать — вы просто
          больше не будете управлять ей здесь. Позже её можно забрать снова по секретному токену.
        </p>
        <div className={styles.confirmActions}>
          <Button onClick={() => setPendingUnclaim(null)}>Отмена</Button>
          <Button
            variant="inverted"
            loading={unclaim.loading}
            onClick={() => pendingUnclaim && unclaim.submit(pendingUnclaim.id)}
          >
            Убрать
          </Button>
        </div>
      </Modal>
    </div>
  );
}
