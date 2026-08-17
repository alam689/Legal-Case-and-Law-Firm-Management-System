import { ArrowLeft, Mail, MapPin, Pencil, Phone, Ticket } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import { Can } from '@/shared/auth/Can';
import { pickBilingual } from '@/shared/i18n/bilingual';
import { useLocale } from '@/shared/i18n/use-locale';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card, CardHeader } from '@/shared/ui/Card';
import { CaseStatusChip } from '@/shared/ui/CaseStatusChip';
import { DateText, Money } from '@/shared/ui/DateText';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState, NotFoundState } from '@/shared/ui/states';

import { useClient } from '../api/use-clients';
import { ClientEditDialog } from '../components/ClientFormDialog';
import { InvitationDialog } from '../components/InvitationDialog';

export default function ClientDetailPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { clientId = '' } = useParams();
  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: client, isPending, isError, error, refetch } = useClient(clientId);

  if (isPending) return <SkeletonList rows={4} />;
  if (isError) {
    const notFound = (error as { status?: number } | null)?.status === 404;
    return notFound ? (
      <NotFoundState />
    ) : (
      <ErrorState error={error} onRetry={() => void refetch()} />
    );
  }

  const name = pickBilingual(client.full_name, client.full_name_bn, locale);

  return (
    <div className="space-y-6">
      <Link
        to="/clients"
        className="inline-flex items-center gap-2 text-sm font-medium text-fg-muted hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
        {t('clients.backToList')}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">{name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={client.is_linked ? 'success' : 'neutral'}>
              {client.is_linked ? t('clients.linked') : t('clients.notLinked')}
            </Badge>
            {client.client_code ? (
              <span className="font-latin text-xs text-fg-subtle">{client.client_code}</span>
            ) : null}
          </div>
        </div>

        <Can do="case.create">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" aria-hidden />
              {t('clients.edit')}
            </Button>
            <Button onClick={() => setInviteOpen(true)}>
              <Ticket className="h-4 w-4" aria-hidden />
              {t('clients.invitation.title')}
            </Button>
          </div>
        </Can>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title={t('clients.detail.contact')} />
          <dl className="space-y-3 text-sm">
            <Row icon={<Phone className="h-4 w-4" aria-hidden />} label={t('clients.form.mobile')}>
              <span className="font-latin tabular-nums">{client.mobile}</span>
              {client.alt_mobile ? (
                <span className="font-latin ms-2 text-fg-subtle">{client.alt_mobile}</span>
              ) : null}
            </Row>
            {client.email ? (
              <Row icon={<Mail className="h-4 w-4" aria-hidden />} label={t('clients.form.email')}>
                <span className="font-latin">{client.email}</span>
              </Row>
            ) : null}
            {client.address || client.district ? (
              <Row
                icon={<MapPin className="h-4 w-4" aria-hidden />}
                label={t('clients.form.address')}
              >
                {[client.address, client.district].filter(Boolean).join(', ')}
              </Row>
            ) : null}
          </dl>

          <div className="mt-4 border-t border-border pt-4 text-xs text-fg-subtle">
            {t('clients.detail.addedOn')} <DateText value={client.created_at} />
          </div>

          {client.notes ? (
            <div className="mt-4 rounded-md border border-warning/30 bg-warning-bg px-3 py-2 text-xs leading-relaxed text-warning">
              <p className="font-semibold">{t('clients.form.notes')}</p>
              <p className="mt-1">{client.notes}</p>
            </div>
          ) : null}
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-fg">{t('clients.detail.cases')}</h2>
            <Money value={client.outstanding_amount} decimals={false} className="text-sm" />
          </div>

          {client.cases.length === 0 ? (
            <EmptyState body={t('clients.detail.noCases')} />
          ) : (
            <ul className="space-y-2">
              {client.cases.map((item) => (
                <li key={item.id}>
                  <Link
                    to={`/cases/${item.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-primary/40 hover:bg-surface-muted/60"
                  >
                    <span className="font-latin text-sm font-semibold tabular-nums">
                      {item.display_number}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
                    <CaseStatusChip status={item.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ClientEditDialog client={client} open={editOpen} onOpenChange={setEditOpen} />
      <InvitationDialog client={client} open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 shrink-0 text-fg-subtle">{icon}</span>
      <span>
        <dt className="text-xs text-fg-subtle">{label}</dt>
        <dd className="mt-0.5 text-fg">{children}</dd>
      </span>
    </div>
  );
}
