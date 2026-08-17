import type { DocumentListItem } from '@caseflow/api-types';
import { DOCUMENT_CATEGORY_LABELS, label } from '@caseflow/domain';
import { Eye, FileText, History } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { formatFileSize, formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { DateText } from '@/shared/ui/DateText';

import { ClientVisibilityToggle } from './ClientVisibilityToggle';
import { DocumentPreviewDialog } from './DocumentPreviewDialog';
import { DocumentVersionsDialog } from './DocumentVersionsDialog';
import { ScanStatusBadge } from './ScanStatusBadge';

export function DocumentTable({
  documents,
  showCase = true,
}: {
  documents: readonly DocumentListItem[];
  /** মামলার পাতায় "মামলা" কলাম নিরর্থক। */
  showCase?: boolean;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [versionsId, setVersionsId] = useState<string | null>(null);

  const lang = locale === 'en' ? 'EN' : 'BN';

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
        <table className="w-full min-w-[48rem] text-sm">
          <thead className="border-b border-border bg-surface-muted">
            <tr>
              <th scope="col" className="px-4 py-3 text-start font-semibold">
                {t('documents.table.name')}
              </th>
              <th scope="col" className="px-4 py-3 text-start font-semibold">
                {t('documents.table.category')}
              </th>
              {showCase ? (
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  {t('documents.table.case')}
                </th>
              ) : null}
              <th scope="col" className="px-4 py-3 text-end font-semibold">
                {t('documents.table.size')}
              </th>
              <th scope="col" className="px-4 py-3 text-start font-semibold">
                {t('documents.table.uploaded')}
              </th>
              <th scope="col" className="px-4 py-3 text-start font-semibold">
                {t('documents.table.visibility')}
              </th>
              <th scope="col" className="px-4 py-3 text-end font-semibold">
                <span className="sr-only">{t('documents.preview.open')}</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {documents.map((document) => (
              <tr key={document.id} className="transition-colors hover:bg-surface-muted/60">
                <th scope="row" className="px-4 py-3 text-start font-medium">
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" aria-hidden />
                    <div className="min-w-0">
                      <span className="block truncate">{document.title}</span>
                      <span className="block truncate font-latin text-xs text-fg-subtle">
                        {document.file_name}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        <ScanStatusBadge status={document.scan_status} />
                        {document.version_count > 1 ? (
                          <Badge tone="neutral" icon={<History className="h-3 w-3" aria-hidden />}>
                            {t('documents.versions.count', {
                              value: formatNumber(document.version_count, locale),
                            })}
                          </Badge>
                        ) : null}
                      </span>
                    </div>
                  </div>
                </th>

                <td className="px-4 py-3 text-fg-muted">
                  {label(DOCUMENT_CATEGORY_LABELS, document.category, lang)}
                </td>

                {showCase ? (
                  <td className="px-4 py-3">
                    {document.case_id ? (
                      <Link
                        to={`/cases/${document.case_id}`}
                        className="font-latin tabular-nums hover:text-primary hover:underline"
                      >
                        {document.case_display_number}
                      </Link>
                    ) : (
                      <span className="text-fg-subtle">—</span>
                    )}
                  </td>
                ) : null}

                <td className="px-4 py-3 text-end font-latin tabular-nums text-fg-muted">
                  {formatFileSize(document.file_size, locale)}
                </td>

                <td className="px-4 py-3 text-fg-muted">
                  <DateText value={document.uploaded_at} style="short" />
                </td>

                <td className="px-4 py-3">
                  <ClientVisibilityToggle document={document} compact />
                </td>

                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${t('documents.versions.title')} — ${document.title}`}
                      onClick={() => setVersionsId(document.id)}
                    >
                      <History className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${t('documents.preview.open')} — ${document.title}`}
                      onClick={() => setPreviewId(document.id)}
                    >
                      <Eye className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {previewId ? (
        <DocumentPreviewDialog
          documentId={previewId}
          open
          onOpenChange={(open) => !open && setPreviewId(null)}
        />
      ) : null}

      {versionsId ? (
        <DocumentVersionsDialog
          documentId={versionsId}
          open
          onOpenChange={(open) => !open && setVersionsId(null)}
        />
      ) : null}
    </>
  );
}
