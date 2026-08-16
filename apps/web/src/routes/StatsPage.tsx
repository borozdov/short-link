import { useParams } from 'react-router';
import type { LinkStatsResponse, LinkStatus } from '@short-link/shared';
import { Card } from '../primitives/Card';
import { Badge } from '../primitives/Badge';
import { StatCard } from '../primitives/StatCard';
import { Table } from '../primitives/Table';
import { useLinkStats } from '../features/stats/useLinkStats';
import styles from './StatsPage.module.css';

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

export function StatsPage() {
  const { secretToken } = useParams<{ secretToken: string }>();
  const { data, loading, notFound } = useLinkStats(secretToken ?? '');

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

  return (
    <div className={styles.page}>
      <Card padding="lg">
        <div className={styles.summary}>
          <div className={styles.summaryHeader}>
            <p className={styles.shortUrl}>{data.shortUrl}</p>
            <Badge variant={STATUS_VARIANT[data.status]}>{STATUS_LABEL[data.status]}</Badge>
          </div>
          <p className={styles.target}>{data.targetUrl}</p>
          <dl className={styles.meta}>
            <div>
              <dt>Создана</dt>
              <dd>{formatDate(data.createdAt)}</dd>
            </div>
            <div>
              <dt>Истекает</dt>
              <dd>{data.expiresAt ? formatDate(data.expiresAt) : 'Бессрочно'}</dd>
            </div>
          </dl>
        </div>
      </Card>

      <StatCard label="Клики" value={data.clickCount} />

      <Card padding="lg">
        <Table<LinkStatsResponse['clicks'][number]>
          columns={[
            { key: 'occurredAt', header: 'Время', render: (click) => formatDate(click.occurredAt) },
            { key: 'referrer', header: 'Откуда', render: (click) => click.referrer ?? 'Напрямую' },
          ]}
          rows={data.clicks}
          emptyMessage="Кликов пока нет"
        />
      </Card>
    </div>
  );
}
