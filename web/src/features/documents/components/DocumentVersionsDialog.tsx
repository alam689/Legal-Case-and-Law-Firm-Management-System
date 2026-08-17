import { History, Info } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { isApiError } from '@/shared/api/errors';
import { Can } from '@/shared/auth/Can';
import { formatFileSize, formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { DateText } from '@/shared/ui/DateText';
import { Dialog } from '@/shared/ui/Dialog';
import { Input } from '@/shared/ui/Input';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { ErrorState } from '@/shared/ui/states';

import { useAddDocumentVersion, useDocument } from '../api/use-documents';
import { screenFiles } from '../lib/upload-queue';
import { FileDropzone } from './FileDropzone';
import { ScanStatusBadge } from './ScanStatusBadge';

/**
 * F-DOC-05 — সংস্করণ ইতিহাস।
 *
 * পুরনো সংস্করণ কখনো মুছে যায় না। কারণটি ব্যবহারিক: আদালতে দাখিল করা
 * কপি আর চেম্বারের সর্বশেষ খসড়া এক নয়, আর ছয় মাস পরে "কোনটি দাখিল
 * হয়েছিল" প্রশ্নের উত্তর দিতে না পারাটাই সবচেয়ে বড় ক্ষতি।
 */
export function DocumentVersionsDialog({
  documentId,
  open,
  onOpenChange,
}: {
  documentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { data, isPending, isError, error, refetch } = useDocument(open ? documentId : '');
  const addVersion = useAddDocumentVersion(documentId);

  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');

  function submit() {
    if (!file) return;
    addVersion.mutate(
      {
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        note: note.trim() || null,
      },
      {
        onSuccess: () => {
          setFile(null);
          setNote('');
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('documents.versions.title')}
      description={data?.title}
      className="w-[min(42rem,calc(100vw-2rem))]"
    >
      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <SkeletonList rows={3} />
      ) : (
        <div className="space-y-5">
          <ol className="space-y-2">
            {data.versions.map((version, index) => (
              <li
                key={version.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-surface p-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 font-latin text-sm font-semibold tabular-nums">
                      <History className="h-3.5 w-3.5 text-fg-subtle" aria-hidden />v
                      {formatNumber(version.version, locale)}
                    </span>
                    {index === 0 ? (
                      <Badge tone="info">{t('documents.versions.current')}</Badge>
                    ) : null}
                    <ScanStatusBadge status={version.scan_status} />
                  </div>

                  <p className="truncate text-sm text-fg">{version.file_name}</p>
                  {version.note ? (
                    <p className="text-xs text-fg-muted">{version.note}</p>
                  ) : null}
                </div>

                <div className="text-end text-xs text-fg-subtle">
                  <DateText value={version.uploaded_at} style="short" className="block" />
                  <span className="block font-latin tabular-nums">
                    {formatFileSize(version.file_size, locale)}
                  </span>
                  {version.uploaded_by_name ? (
                    <span className="block">
                      {t('documents.versions.uploadedBy', { name: version.uploaded_by_name })}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>

          <p className="flex items-start gap-2 text-xs text-fg-subtle">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {t('documents.versions.note')}
          </p>

          <Can do="document.upload">
            <section className="space-y-3 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-fg">{t('documents.versions.addTitle')}</h3>

              {file ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-muted/40 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">{file.name}</p>
                    <p className="font-latin text-xs tabular-nums text-fg-subtle">
                      {formatFileSize(file.size, locale)}
                    </p>
                  </div>
                  <Button variant="ghost" onClick={() => setFile(null)}>
                    {t('documents.removeFile')}
                  </Button>
                </div>
              ) : (
                <FileDropzone
                  onFiles={(files) => {
                    const { accepted } = screenFiles(files);
                    setFile(accepted[0] ?? null);
                  }}
                />
              )}

              <Input
                label={t('documents.fields.versionNote')}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />

              {addVersion.error ? (
                <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
                  {t(isApiError(addVersion.error) ? addVersion.error.i18nKey : 'errors.unknown')}
                </p>
              ) : null}

              <div className="flex justify-end">
                <Button onClick={submit} disabled={!file} loading={addVersion.isPending}>
                  {t('documents.versions.addNew')}
                </Button>
              </div>
            </section>
          </Can>
        </div>
      )}
    </Dialog>
  );
}
