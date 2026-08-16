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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
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
          { key: 'links', label: 'Links' },
          { key: 'claim', label: 'Claim link' },
          { key: 'apiKeys', label: 'API keys' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'links' && (
        <Card padding="lg">
          {loading ? (
            <p className={styles.message}>Loading…</p>
          ) : links.length === 0 ? (
            <EmptyState message="No links yet. Create one, or claim an anonymous link by its secret token." />
          ) : (
            <Table<Link>
              columns={[
                {
                  key: 'uid',
                  header: 'Link',
                  render: (link) => (
                    <RouterLink className={styles.linkCell} to={`/dashboard/links/${link.id}`}>
                      /{link.uid}
                    </RouterLink>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (link) => <Badge variant={STATUS_VARIANT[link.status]}>{link.status}</Badge>,
                },
                { key: 'clickCount', header: 'Clicks', numeric: true, render: (link) => link.clickCount },
                { key: 'createdAt', header: 'Created', render: (link) => formatDate(link.createdAt) },
                {
                  key: 'actions',
                  header: '',
                  render: (link) => (
                    <Button size="sm" onClick={() => setPendingUnclaim(link)}>
                      Remove
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
          Remove <strong>/{pendingUnclaim?.uid}</strong> from your dashboard? The link keeps working — you just
          won&apos;t manage it here anymore. You can claim it again later with its secret token.
        </p>
        <div className={styles.confirmActions}>
          <Button onClick={() => setPendingUnclaim(null)}>Cancel</Button>
          <Button
            variant="inverted"
            loading={unclaim.loading}
            onClick={() => pendingUnclaim && unclaim.submit(pendingUnclaim.id)}
          >
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  );
}
