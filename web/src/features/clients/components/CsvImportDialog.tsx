import type { ClientWriteRequest } from '@caseflow/api-types';
import { AlertTriangle, CheckCircle2, Upload } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';

import { useImportClients } from '../api/use-clients';
import { csvToClients } from '../lib/parse-csv';

const PREVIEW_ROWS = 5;

/** F-CLI-07 — পুরনো রেজিস্টার থেকে bulk import (pilot onboarding-এর মূল সেতু)। */
export function CsvImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const importClients = useImportClients();

  const [rows, setRows] = useState<ClientWriteRequest[]>([]);
  const [parseError, setParseError] = useState(false);

  const result = importClients.data;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setParseError(false);
    importClients.reset();
    try {
      const parsed = csvToClients(await file.text());
      setRows(parsed.rows);
      if (parsed.rows.length === 0) setParseError(true);
    } catch {
      setParseError(true);
      setRows([]);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setRows([]);
          setParseError(false);
          importClients.reset();
        }
      }}
      title={t('clients.import.title')}
      description={t('clients.import.description')}
      footer={
        rows.length > 0 && !result ? (
          <Button loading={importClients.isPending} onClick={() => importClients.mutate(rows)}>
            {t('clients.import.confirm', { count: rows.length })}
          </Button>
        ) : null
      }
    >
      <div className="space-y-4">
        <p className="font-latin rounded-md bg-surface-muted px-3 py-2 text-xs text-fg-muted">
          {t('clients.import.columns')}
        </p>

        <label className="flex min-h-touch w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-sm font-medium text-fg-muted hover:border-primary hover:text-primary">
          <Upload className="h-4 w-4" aria-hidden />
          {t('clients.import.chooseFile')}
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
        </label>

        {parseError ? (
          <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
            {t('clients.import.parseError')}
          </p>
        ) : null}

        {rows.length > 0 && !result ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
              {t('clients.import.preview', { count: Math.min(PREVIEW_ROWS, rows.length) })}
            </p>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {rows.slice(0, PREVIEW_ROWS).map((row, index) => (
                    <tr key={`${row.mobile}-${index}`}>
                      <td className="px-3 py-2">{row.full_name_bn || row.full_name || '—'}</td>
                      <td className="px-3 py-2 font-latin text-fg-muted">{row.mobile || '—'}</td>
                      <td className="px-3 py-2 text-fg-muted">{row.district ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {result ? (
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 rounded-md bg-success-bg px-3 py-2 text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              {t('clients.import.resultCreated', { value: formatNumber(result.created, locale) })}
            </li>
            {result.skipped > 0 ? (
              <li className="flex items-center gap-2 rounded-md bg-warning-bg px-3 py-2 text-warning">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                {t('clients.import.resultSkipped', { value: formatNumber(result.skipped, locale) })}
              </li>
            ) : null}
            {result.errors.length > 0 ? (
              <li className="flex items-center gap-2 rounded-md bg-danger-bg px-3 py-2 text-danger">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                {t('clients.import.resultErrors', {
                  value: formatNumber(result.errors.length, locale),
                })}
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </Dialog>
  );
}
