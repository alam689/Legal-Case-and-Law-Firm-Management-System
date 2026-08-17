import type { InvoiceDetail } from '@caseflow/api-types';
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  compareMoney,
  optionsOf,
  paymentWriteSchema,
} from '@caseflow/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { isApiError } from '@/shared/api/errors';
import { todayIso } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Button } from '@/shared/ui/Button';
import { Money } from '@/shared/ui/DateText';
import { Dialog } from '@/shared/ui/Dialog';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Textarea } from '@/shared/ui/Textarea';

import { useRecordPayment } from '../api/use-billing';

interface FormValues {
  amount: string;
  method: string;
  paid_on: string;
  reference: string;
  note: string;
}

/**
 * F-BILL-06 — পরিশোধ লেখা।
 *
 * বকেয়ার চেয়ে বেশি অঙ্ক **আটকানো হয় না**, শুধু সতর্ক করা হয়। বাস্তবে
 * অগ্রিম বা একসাথে দুটি চালানের টাকা দেওয়া স্বাভাবিক; আইনজীবীকে সত্য
 * লিখতে বাধা দেওয়ার চেয়ে একবার জিজ্ঞেস করা ভালো।
 */
export function PaymentDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: InvoiceDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { language } = useLocale();
  const recordPayment = useRecordPayment(invoice.id);

  const methodOptions = useMemo(
    () => optionsOf(PAYMENT_METHODS, PAYMENT_METHOD_LABELS, language),
    [language],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(paymentWriteSchema),
    defaultValues: {
      amount: invoice.due_amount,
      method: 'BKASH',
      paid_on: todayIso(),
      reference: '',
      note: '',
    },
  });

  const amount = useWatch({ control, name: 'amount' }) ?? '';
  const exceedsDue = compareMoney(amount, invoice.due_amount) > 0;

  const messageFor = (key: keyof FormValues): string | undefined =>
    errors[key] ? t(errors[key]?.message ?? 'validation.required') : undefined;

  function submit(values: FormValues) {
    recordPayment.mutate(
      {
        amount: values.amount,
        method: values.method as Parameters<typeof recordPayment.mutate>[0]['method'],
        paid_on: values.paid_on,
        reference: values.reference || null,
        note: values.note || null,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('billing.payment.addTitle')}
      description={invoice.invoice_number}
    >
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        <p className="flex items-center justify-between gap-4 rounded-md bg-surface-muted/60 px-3 py-2 text-sm">
          <span className="text-fg-muted">{t('billing.totals.due')}</span>
          <Money value={invoice.due_amount} className="font-semibold" />
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('billing.payment.amount')}
            latin
            inputMode="decimal"
            error={messageFor('amount')}
            {...register('amount')}
          />
          <Select
            label={t('billing.payment.method')}
            options={methodOptions}
            error={messageFor('method')}
            {...register('method')}
          />
          <Input
            label={t('billing.payment.paidOn')}
            type="date"
            latin
            error={messageFor('paid_on')}
            {...register('paid_on')}
          />
          <Input
            label={t('billing.payment.reference')}
            hint={t('billing.payment.referenceHint')}
            error={messageFor('reference')}
            {...register('reference')}
          />
        </div>

        {exceedsDue ? (
          <p
            role="status"
            className="flex items-center gap-2 rounded-md bg-warning-bg px-3 py-2 text-xs text-warning"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {t('billing.payment.exceedsDue')}
          </p>
        ) : null}

        <Textarea
          label={t('billing.payment.note')}
          rows={2}
          error={messageFor('note')}
          {...register('note')}
        />

        {recordPayment.error ? (
          <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
            {t(isApiError(recordPayment.error) ? recordPayment.error.i18nKey : 'errors.unknown')}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={recordPayment.isPending}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
