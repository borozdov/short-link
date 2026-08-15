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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function LinkStatsPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, notFound } = useUserLinkStats(id ?? '');

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

  const { link, dailyStats, clicks } = data;

  return (
    <div className={styles.page}>
      <Card padding="lg">
        <div className={styles.summary}>
          <div className={styles.summaryHeader}>
            <p className={styles.uid}>/{link.uid}</p>
            <Badge variant={STATUS_VARIANT[link.status]}>{link.status}</Badge>
          </div>
          <p className={styles.target}>{link.targetUrl}</p>
          <dl className={styles.meta}>
            <div>
              <dt>Created</dt>
              <dd>{formatDate(link.createdAt)}</dd>
            </div>
            <div>
              <dt>Expires</dt>
              <dd>{link.expiresAt ? formatDate(link.expiresAt) : 'Never'}</dd>
            </div>
          </dl>
        </div>
      </Card>

      <StatCard label="Clicks" value={link.clickCount} />

      <Card padding="lg">
        <ClickChart dailyStats={dailyStats} />
      </Card>

      <Card padding="lg">
        <Table<(typeof clicks)[number]>
          columns={[
            { key: 'occurredAt', header: 'Time', render: (click) => formatDate(click.occurredAt) },
            { key: 'referrer', header: 'Referrer', render: (click) => click.referrer ?? 'Direct' },
          ]}
          rows={clicks}
          emptyMessage="No clicks yet"
        />
      </Card>
    </div>
  );
}
