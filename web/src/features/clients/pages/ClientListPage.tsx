import { Plus, Upload, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Can } from '@/shared/auth/Can';
import { formatNumber } from '@/shared/i18n/formatters';
import { pickBilingual } from '@/shared/i18n/bilingual';
import { useLocale } from '@/shared/i18n/use-locale';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Money } from '@/shared/ui/DateText';
import { SearchInput } from '@/shared/ui/SearchInput';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/states';

import { useClients } from '../api/use-clients';
import { ClientFormDialog } from '../components/ClientFormDialog';
import { CsvImportDialog } from '../components/CsvImportDialog';

export default function ClientListPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data, isPending, isError, error, refetch } = useClients(search);
  const clients = data?.results ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">{t('clients.title')}</h1>
          {!isPending && !isError ? (
            <p className="mt-1 text-sm text-fg-muted">
              {t('clients.count', { value: formatNumber(clients.length, locale) })}
            </p>
          ) : null}
        </div>

        {/*
          RBAC matrix-এ (docs/01-scope §5) "মক্কেল যোগ" আলাদা সারি নেই — যিনি
          মামলা তৈরি করতে পারেন, মক্কেলও তিনিই যোগ করেন। Phase 2-এ assistant
          role চালু হলে এটি পুনর্বিবেচনা করতে হবে (FQ2)।
        */}
        <Can do="case.create">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" aria-hidden />
              {t('clients.import.open')}
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              {t('clients.add')}
            </Button>
          </div>
        </Can>
      </header>

      <SearchInput
        value={search}
        onChange={setSearch}
        label={t('clients.searchLabel')}
        className="max-w-md"
      />

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <SkeletonList rows={4} />
      ) : clients.length === 0 ? (
        <EmptyState
          title={search ? t('clients.emptySearch.title') : t('clients.empty.title')}
          body={search ? t('clients.emptySearch.body') : t('clients.empty.body')}
          action={
            search ? null : (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                {t('clients.add')}
              </Button>
            )
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="border-b border-border bg-surface-muted">
              <tr>
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  {t('clients.table.name')}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  {t('clients.table.mobile')}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  {t('clients.table.district')}
                </th>
                <th scope="col" className="px-4 py-3 text-end font-semibold">
                  {t('clients.table.cases')}
                </th>
                <th scope="col" className="px-4 py-3 text-end font-semibold">
                  {t('clients.table.due')}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  {t('clients.table.link')}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {clients.map((client) => (
                <tr key={client.id} className="transition-colors hover:bg-surface-muted/60">
                  <th scope="row" className="px-4 py-3 text-start font-medium">
                    <Link
                      to={`/clients/${client.id}`}
                      className="flex items-center gap-2 hover:text-primary hover:underline"
                    >
                      <UserRound className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden />
                      {pickBilingual(client.full_name, client.full_name_bn, locale)}
                    </Link>
                  </th>
                  <td className="px-4 py-3 font-latin tabular-nums text-fg-muted">
                    {client.mobile}
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{client.district ?? '—'}</td>
                  <td className="px-4 py-3 text-end font-latin tabular-nums">
                    {formatNumber(client.active_case_count, locale)}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Money value={client.outstanding_amount} decimals={false} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={client.is_linked ? 'success' : 'neutral'}>
                      {client.is_linked ? t('clients.linked') : t('clients.notLinked')}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ClientFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <CsvImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
