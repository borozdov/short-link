import { useParams } from 'react-router';
import type { LinkStatus } from '@short-link/shared';
import { Card } from '../../primitives/Card';
import { Badge } from '../../primitives/Badge';
import { StatCard } from '../../primitives/StatCard';
import { Table } from '../../primitives/Table';
import { useUserLinkStats } from './useUserLinkStats';
import { ClickChart } from './ClickChart';
import styles from './LinkStatsPage.module.css';

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
  return new Date(iso).toLocaleString('ru-RU');
}

export function LinkStatsPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, notFound } = useUserLinkStats(id ?? '');

  if (loading) {
    return (
      <div className={styles.page}>
        <Card padding="lg">
          <p className={styles.message}>Загрузка…</p>
        </Card>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className={styles.page}>
        <Card padding="lg">
          <p className={styles.message}>Ссылка не найдена.</p>
        </Card>
      </div>
    );
  }

  const { link, dailyStats, clicks } = data;

  return (
    <div className={styles.page}>
      <Card padding="lg">
        <div className={styles.summary}>
          <div className={styles.summaryHeader}>
            <p className={styles.uid}>/{link.uid}</p>
            <Badge variant={STATUS_VARIANT[link.status]}>{STATUS_LABEL[link.status]}</Badge>
          </div>
          <p className={styles.target}>{link.targetUrl}</p>
          <dl className={styles.meta}>
            <div>
              <dt>Создана</dt>
              <dd>{formatDate(link.createdAt)}</dd>
            </div>
            <div>
              <dt>Истекает</dt>
              <dd>{link.expiresAt ? formatDate(link.expiresAt) : 'Бессрочно'}</dd>
            </div>
          </dl>
        </div>
      </Card>

      <StatCard label="Клики" value={link.clickCount} />

      <Card padding="lg">
        <ClickChart dailyStats={dailyStats} />
      </Card>

      <Card padding="lg">
        <Table<(typeof clicks)[number]>
          columns={[
            { key: 'occurredAt', header: 'Время', render: (click) => formatDate(click.occurredAt) },
            { key: 'referrer', header: 'Откуда', render: (click) => click.referrer ?? 'Напрямую' },
          ]}
          rows={clicks}
          emptyMessage="Кликов пока нет"
        />
      </Card>
    </div>
  );
}
