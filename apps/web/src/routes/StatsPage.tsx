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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function StatsPage() {
  const { secretToken } = useParams<{ secretToken: string }>();
  const { data, loading, notFound } = useLinkStats(secretToken ?? '');

  if (loading) {
    return (
      <div className={styles.page}>
        <Card padding="lg">
          <p className={styles.message}>Loading…</p>
        </Card>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className={styles.page}>
        <Card padding="lg">
          <p className={styles.message}>Link not found.</p>
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
            <Badge variant={STATUS_VARIANT[data.status]}>{data.status}</Badge>
          </div>
          <p className={styles.target}>{data.targetUrl}</p>
          <dl className={styles.meta}>
            <div>
              <dt>Created</dt>
              <dd>{formatDate(data.createdAt)}</dd>
            </div>
            <div>
              <dt>Expires</dt>
              <dd>{data.expiresAt ? formatDate(data.expiresAt) : 'Never'}</dd>
            </div>
          </dl>
        </div>
      </Card>

      <StatCard label="Clicks" value={data.clickCount} />

      <Card padding="lg">
        <Table<LinkStatsResponse['clicks'][number]>
          columns={[
            { key: 'occurredAt', header: 'Time', render: (click) => formatDate(click.occurredAt) },
            { key: 'referrer', header: 'Referrer', render: (click) => click.referrer ?? 'Direct' },
          ]}
          rows={data.clicks}
          emptyMessage="No clicks yet"
        />
      </Card>
    </div>
  );
}
