import type { FirmSettings, InvoiceDetail, PaymentItem } from '@caseflow/api-types';
import { INVOICE_LINE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS, label } from '@caseflow/domain';
import { Info, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useFirmSettings } from '@/shared/api/reference';
import { pickBilingual } from '@/shared/i18n/bilingual';
import { useLocale } from '@/shared/i18n/use-locale';
import { Button } from '@/shared/ui/Button';
import { DateText, Money } from '@/shared/ui/DateText';
import { Dialog } from '@/shared/ui/Dialog';
import { SkeletonList } from '@/shared/ui/Skeleton';

/**
 * F-BILL-05 — চালান ও রসিদের ছাপার নমুনা।
 *
 * ⚠ ইচ্ছাকৃতভাবে কোনো PDF library নয়। কারণ দুটি:
 *
 * ১. **ওজন** — jsPDF/pdfmake gzip-এও ~১০০ KB, অথচ route chunk budget ৮০ KB
 *    (docs/05-frontend-plan.md §12)। একটি নমুনা দেখানোর জন্য পুরো app
 *    ভারী করা অযৌক্তিক।
 * ২. **কর্তৃত্ব** — দাপ্তরিক চালান backend থেকেই তৈরি হবে, যাতে আইনজীবীর
 *    ব্রাউজার, মক্কেলের মোবাইল ও ইমেইলের সংযুক্তি — সব কপি অক্ষরে অক্ষরে
 *    এক হয়। Client-এ আলাদা করে তৈরি করলে সেই নিশ্চয়তা থাকে না।
 *
 * তাই এখানে ব্রাউজারের নিজস্ব ছাপা (`window.print()`) ব্যবহার হয়, আর
 * ব্যবহারকারীকে সেটি স্পষ্ট করে বলা হয় — "PDF তৈরি হলো" বলে ভান করা নয়।
 */
export function InvoicePrintDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: InvoiceDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { data: settings, isPending } = useFirmSettings();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('billing.print.preview')}
      className="w-[min(52rem,calc(100vw-2rem))] print:max-h-none print:w-full print:border-0 print:shadow-none"
      footer={
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden />
          {t('billing.print.print')}
        </Button>
      }
    >
      {isPending || !settings ? (
        <SkeletonList rows={4} />
      ) : (
        <>
          <p className="mb-4 flex items-start gap-2 rounded-md bg-surface-muted/60 px-3 py-2 text-xs text-fg-muted print:hidden">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {t('billing.print.pdfNotice')}
          </p>
          <InvoiceSheet invoice={invoice} settings={settings} />
        </>
      )}
    </Dialog>
  );
}

/** চেম্বারের লেটারহেড — settings পাতার নমুনাতেও এটিই ব্যবহৃত হয়। */
export function Letterhead({ settings }: { settings: FirmSettings }) {
  const { locale } = useLocale();

  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
      <div className="min-w-0">
        <p className="text-lg font-bold text-fg">
          {pickBilingual(settings.name, settings.name_bn, locale)}
        </p>
        {settings.address ? (
          <p className="mt-0.5 whitespace-pre-line text-xs text-fg-muted">{settings.address}</p>
        ) : null}
        <p className="mt-0.5 font-latin text-xs text-fg-muted">
          {[settings.mobile, settings.email].filter(Boolean).join(' · ')}
        </p>
        {settings.letterhead_note ? (
          <p className="mt-1 text-xs text-fg-subtle">{settings.letterhead_note}</p>
        ) : null}
      </div>

      {settings.logo_url ? (
        <img src={settings.logo_url} alt="" className="h-16 w-16 object-contain" />
      ) : null}
    </header>
  );
}

function InvoiceSheet({
  invoice,
  settings,
}: {
  invoice: InvoiceDetail;
  settings: FirmSettings;
}) {
  const { t } = useTranslation();
  const { language } = useLocale();

  return (
    <article className="space-y-4 rounded-lg border border-border bg-surface p-5 text-sm print:border-0 print:p-0">
      <Letterhead settings={settings} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold uppercase tracking-wide text-fg">
            {t('billing.print.invoiceHeading')}
          </h3>
          <p className="font-latin text-sm font-semibold tabular-nums">{invoice.invoice_number}</p>
        </div>

        <dl className="text-xs text-fg-muted">
          <div className="flex justify-end gap-2">
            <dt>{t('billing.print.issuedOn')}</dt>
            <dd className="font-medium text-fg">
              <DateText value={invoice.issue_date} style="short" />
            </dd>
          </div>
          <div className="flex justify-end gap-2">
            <dt>{t('billing.print.dueOn')}</dt>
            <dd className="font-medium text-fg">
              <DateText value={invoice.due_date} style="short" />
            </dd>
          </div>
        </dl>
      </div>

      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
          {t('billing.print.billedTo')}
        </h4>
        <p className="font-medium text-fg">{invoice.client_name}</p>
        {invoice.client_address ? (
          <p className="text-xs text-fg-muted">{invoice.client_address}</p>
        ) : null}
        {invoice.case_display_number ? (
          <p className="font-latin text-xs text-fg-muted">
            {invoice.case_display_number}
            {invoice.case_title ? ` — ${invoice.case_title}` : ''}
          </p>
        ) : null}
      </section>

      <table className="w-full text-xs">
        <thead className="border-y border-border">
          <tr>
            <th scope="col" className="py-2 text-start font-semibold">
              {t('billing.lines.description')}
            </th>
            <th scope="col" className="py-2 text-end font-semibold">
              {t('billing.lines.quantity')}
            </th>
            <th scope="col" className="py-2 text-end font-semibold">
              {t('billing.lines.unitAmount')}
            </th>
            <th scope="col" className="py-2 text-end font-semibold">
              {t('billing.lines.amount')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {invoice.lines.map((line) => (
            <tr key={line.id}>
              <td className="py-2">
                <span className="block text-fg">{line.description}</span>
                <span className="block text-fg-subtle">
                  {label(INVOICE_LINE_CATEGORY_LABELS, line.category, language)}
                </span>
              </td>
              <td className="py-2 text-end font-latin tabular-nums">{line.quantity}</td>
              <td className="py-2 text-end">
                <Money value={line.unit_amount} showSymbol={false} />
              </td>
              <td className="py-2 text-end">
                <Money value={line.amount} showSymbol={false} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ms-auto w-full max-w-xs space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">{t('billing.totals.subtotal')}</dt>
          <dd>
            <Money value={invoice.subtotal} />
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">{t('billing.totals.discount')}</dt>
          <dd>
            <Money value={invoice.discount} />
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-border pt-1 text-sm font-bold">
          <dt>{t('billing.totals.total')}</dt>
          <dd>
            <Money value={invoice.total} />
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">{t('billing.totals.paid')}</dt>
          <dd>
            <Money value={invoice.paid_amount} />
          </dd>
        </div>
        <div className="flex justify-between gap-4 font-semibold">
          <dt>{t('billing.totals.due')}</dt>
          <dd>
            <Money value={invoice.due_amount} />
          </dd>
        </div>
      </dl>

      {invoice.terms ? (
        <section className="border-t border-border pt-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
            {t('billing.print.terms')}
          </h4>
          <p className="whitespace-pre-line text-xs text-fg-muted">{invoice.terms}</p>
        </section>
      ) : null}
    </article>
  );
}

/** পরিশোধের রসিদ — মক্কেলকে হাতে দেওয়ার জন্য। */
export function ReceiptDialog({
  payment,
  invoice,
  open,
  onOpenChange,
}: {
  payment: PaymentItem;
  invoice: InvoiceDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { language } = useLocale();
  const { data: settings, isPending } = useFirmSettings();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('billing.payment.receiptTitle')}
      className="print:border-0 print:shadow-none"
      footer={
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden />
          {t('billing.print.print')}
        </Button>
      }
    >
      {isPending || !settings ? (
        <SkeletonList rows={3} />
      ) : (
        <article className="space-y-4 rounded-lg border border-border bg-surface p-5 text-sm print:border-0 print:p-0">
          <Letterhead settings={settings} />

          <div className="flex flex-wrap items-start justify-between gap-4">
            <h3 className="text-base font-bold uppercase tracking-wide text-fg">
              {t('billing.print.receiptHeading')}
            </h3>
            <p className="font-latin text-sm font-semibold tabular-nums">{payment.receipt_no}</p>
          </div>

          <dl className="space-y-1 text-xs">
            <Row label={t('billing.print.billedTo')} value={invoice.client_name} />
            <Row label={t('billing.table.number')} value={invoice.invoice_number} latin />
            <Row
              label={t('billing.payment.method')}
              value={label(PAYMENT_METHOD_LABELS, payment.method, language)}
            />
            {payment.reference ? (
              <Row label={t('billing.payment.reference')} value={payment.reference} latin />
            ) : null}
          </dl>

          <div className="flex items-center justify-between gap-4 border-y border-border py-3">
            <span className="text-sm font-semibold">{t('billing.payment.amount')}</span>
            <Money value={payment.amount} className="text-lg font-bold" />
          </div>

          <p className="text-xs text-fg-muted">
            <DateText value={payment.paid_on} style="full" />
            {payment.recorded_by_name
              ? ` · ${t('billing.payment.recordedBy', { name: payment.recorded_by_name })}`
              : ''}
          </p>
        </article>
      )}
    </Dialog>
  );
}

function Row({ label: name, value, latin }: { label: string; value: string; latin?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-fg-muted">{name}</dt>
      <dd className={latin ? 'font-latin tabular-nums' : undefined}>{value}</dd>
    </div>
  );
}
