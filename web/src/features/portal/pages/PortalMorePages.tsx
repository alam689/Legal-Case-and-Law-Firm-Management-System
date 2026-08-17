import { INVOICE_STATUS_LABELS, NOTIFICATION_CHANNEL_LABELS, label } from '@caseflow/domain';
import { Download, FileText, Info, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { formatDate, formatFileSize } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { DateText, Money } from '@/shared/ui/DateText';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/states';

import { usePortalDocuments, usePortalInvoices, usePortalNotices } from '../api/use-portal';

/**
 * Portal-এর তিনটি ছোট পর্দা এক file-এ — প্রতিটিই একটি তালিকা ও একটি
 * খালি অবস্থা, আলাদা file-এ রাখলে তিনবার একই কাঠামো লিখতে হত।
 */

/** P1 — মক্কেলকে দেওয়া কাগজপত্র (শুধু `client_visible`)। */
export default function PortalDocumentsPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { data, isPending, isError, error, refetch } = usePortalDocuments();
  const documents = data?.results ?? [];

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <SkeletonList rows={3} />;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t('portal.documents.title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('portal.documents.subtitle')}</p>
      </header>

      {documents.length === 0 ? (
        <EmptyState title={t('portal.documents.empty')} body={t('portal.documents.emptyHint')} />
      ) : (
        <ul className="space-y-3">
          {documents.map((document) => (
            <li key={document.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">{document.title}</p>
                    <p className="font-latin text-xs text-fg-subtle">
                      {document.case_display_number ? `${document.case_display_number} · ` : null}
                      {formatFileSize(document.file_size, locale)}
                    </p>
                  </div>
                </div>

                {/* স্ক্যান শেষ না হলে মক্কেলও খুলতে পারেন না — নিয়ম সবার জন্য এক */}
                {document.file_url ? (
                  <Button variant="secondary" asChild>
                    <a href={document.file_url} download={document.file_name}>
                      <Download className="h-4 w-4" aria-hidden />
                      {t('portal.documents.download')}
                    </a>
                  </Button>
                ) : (
                  <Badge tone="warning">{t('portal.documents.pendingScan')}</Badge>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** P1 — বিল। টাকা পাঠানোর কোনো পথ নেই, এবং সেটি স্পষ্ট করে বলা হয়। */
export function PortalInvoicesPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { data, isPending, isError, error, refetch } = usePortalInvoices();
  const invoices = data?.results ?? [];
  const lang = locale === 'en' ? 'EN' : 'BN';

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <SkeletonList rows={3} />;

  const totalDue = invoices.reduce((sum, invoice) => sum + Number(invoice.due_amount), 0);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t('portal.invoices.title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('portal.invoices.subtitle')}</p>
      </header>

      {invoices.length === 0 ? (
        <EmptyState body={t('portal.invoices.empty')} />
      ) : (
        <>
          <Card className="flex items-center justify-between">
            <span className="text-sm font-medium text-fg">{t('portal.invoices.totalDue')}</span>
            <Money value={totalDue.toFixed(2)} className="text-lg font-bold" />
          </Card>

          <ul className="space-y-3">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Card className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-latin text-sm font-semibold tabular-nums">
                      {invoice.invoice_number}
                    </span>
                    <Badge tone={invoice.status === 'PAID' ? 'success' : 'warning'}>
                      {label(INVOICE_STATUS_LABELS, invoice.status, lang)}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span className="text-fg-muted">
                      {invoice.due_date
                        ? t('portal.invoices.dueBy', {
                            value: formatDate(invoice.due_date, locale, 'short'),
                          })
                        : null}
                    </span>
                    <Money value={invoice.due_amount} className="font-semibold" />
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          <p className="flex items-start gap-2 text-xs text-fg-subtle">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {t('portal.invoices.payHint')}
          </p>
        </>
      )}
    </div>
  );
}

/** P1 — যা যা জানানো হয়েছে। "আমাকে বলা হয়নি" তর্কের লিখিত উত্তর। */
export function PortalNoticesPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { data, isPending, isError, error, refetch } = usePortalNotices();
  const notices = data?.results ?? [];
  const lang = locale === 'en' ? 'EN' : 'BN';

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <SkeletonList rows={3} />;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t('portal.notices.title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('portal.notices.subtitle')}</p>
      </header>

      {notices.length === 0 ? (
        <EmptyState body={t('portal.notices.empty')} />
      ) : (
        <ul className="space-y-3">
          {notices.map((notice) => (
            <li key={notice.id}>
              <Card className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-1.5 text-fg-muted">
                    <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                    {label(NOTIFICATION_CHANNEL_LABELS, notice.channel, lang)}
                    {notice.case_display_number ? (
                      <span className="font-latin"> · {notice.case_display_number}</span>
                    ) : null}
                  </span>
                  <Badge tone={notice.delivered ? 'success' : 'neutral'}>
                    {notice.delivered
                      ? t('portal.notices.delivered')
                      : t('portal.notices.notDelivered')}
                  </Badge>
                </div>

                <p className="text-sm text-fg">{notice.body}</p>
                <DateText value={notice.sent_at} style="short" className="text-xs text-fg-subtle" />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
