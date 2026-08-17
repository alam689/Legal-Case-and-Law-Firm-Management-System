import { Download, FileText, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { formatFileSize } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { ErrorState } from '@/shared/ui/states';

import { useDocument } from '../api/use-documents';

/** ব্রাউজারে নিজেই দেখা যায় এমন ধরন — বাকিগুলোতে সৎভাবে "ডাউনলোড করুন"। */
const INLINE_MIME_PREFIXES = ['image/', 'application/pdf'];

function canPreview(mime: string): boolean {
  return INLINE_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix));
}

/**
 * F-DOC-08 — নথি দেখা।
 *
 * স্ক্যান শেষ না হলে server কোনো URL-ই দেয় না, তাই এখানে "খোলা যাচ্ছে না"
 * অনুমান নয় — `file_url === null` সেটিই বলে। DOCX-এর মতো ধরন ব্রাউজারে
 * দেখানোর ভান না করে সরাসরি ডাউনলোড দেওয়া হয়।
 */
export function DocumentPreviewDialog({
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

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('documents.preview.title')}
      description={data?.title}
      className="w-[min(52rem,calc(100vw-2rem))]"
      footer={
        data?.file_url ? (
          <Button variant="secondary" asChild>
            <a href={data.file_url} download={data.file_name}>
              <Download className="h-4 w-4" aria-hidden />
              {t('documents.preview.download')}
            </a>
          </Button>
        ) : null
      }
    >
      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <SkeletonList rows={3} />
      ) : data.scan_status === 'INFECTED' ? (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-md bg-danger-bg px-3 py-3 text-sm text-danger"
        >
          <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden />
          {t('documents.scan.infectedHint')}
        </p>
      ) : !data.file_url ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-md bg-warning-bg px-3 py-3 text-sm text-warning"
        >
          <FileText className="h-4 w-4 shrink-0" aria-hidden />
          {t('documents.preview.pendingScan')}
        </p>
      ) : canPreview(data.mime_type) ? (
        <div className="overflow-hidden rounded-lg border border-border bg-surface-muted">
          {data.mime_type.startsWith('image/') ? (
            <img
              src={data.file_url}
              alt={data.title}
              className="mx-auto max-h-[60vh] w-auto max-w-full object-contain"
            />
          ) : (
            <iframe
              src={data.file_url}
              title={data.title}
              className="h-[60vh] w-full border-0 bg-surface"
            />
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-fg-subtle" aria-hidden />
          <p className="mt-2 text-sm font-medium text-fg">{t('documents.preview.unavailable')}</p>
          <p className="mt-1 text-xs text-fg-muted">{t('documents.preview.unavailableHint')}</p>
          <p className="mt-1 font-latin text-xs tabular-nums text-fg-subtle">
            {data.file_name} · {formatFileSize(data.file_size, locale)}
          </p>
        </div>
      )}
    </Dialog>
  );
}
