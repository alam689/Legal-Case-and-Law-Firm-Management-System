import { FEE_TYPES, FEE_TYPE_LABELS, feeAgreementSchema, label, optionsOf } from '@caseflow/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Receipt } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { isApiError } from '@/shared/api/errors';
import { Can } from '@/shared/auth/Can';
import { useLocale } from '@/shared/i18n/use-locale';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card, CardHeader } from '@/shared/ui/Card';
import { DateText, Money } from '@/shared/ui/DateText';
import { Dialog } from '@/shared/ui/Dialog';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { Textarea } from '@/shared/ui/Textarea';
import { EmptyState, ErrorState } from '@/shared/ui/states';

import { useCaseLedger, useFeeAgreement, useSaveFeeAgreement } from '../api/use-billing';

/**
 * মামলার "বিলিং" tab — ফি-চুক্তি ও হিসাব (F-BILL-01/07)।
 *
 * চালান তৈরির বোতাম এখানে নেই; সেটি বিলিং পাতার কাজ। একই কাজের দুটি
 * প্রবেশপথ থাকলে কোনটি "আসল" তা নিয়ে দ্বিধা তৈরি হয় — এখানে শুধু এই
 * মামলার টাকার ছবি ও সেখান থেকে চালানে যাওয়ার পথ।
 */
export function CaseBillingTab({ caseId }: { caseId: string }) {
  const { t } = useTranslation();
  const { language } = useLocale();
  const [feeOpen, setFeeOpen] = useState(false);

  const ledger = useCaseLedger(caseId);
  const feeAgreement = useFeeAgreement(caseId);

  if (ledger.isError) {
    return <ErrorState error={ledger.error} onRetry={() => void ledger.refetch()} />;
  }
  if (ledger.isPending) return <SkeletonList rows={4} />;

  const agreement = feeAgreement.data ?? null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title={t('billing.fee.title')}
          action={
            <Can do="invoice.create">
              <Button variant="secondary" onClick={() => setFeeOpen(true)}>
                {agreement ? (
                  <Pencil className="h-4 w-4" aria-hidden />
                ) : (
                  <Plus className="h-4 w-4" aria-hidden />
                )}
                {agreement ? t('billing.fee.edit') : t('billing.fee.set')}
              </Button>
            </Can>
          }
        />

        {!agreement ? (
          <EmptyState body={t('billing.fee.empty')} />
        ) : (
          <div className="space-y-2 text-sm">
            <p className="flex flex-wrap items-center gap-2">
              <Badge tone="info">{label(FEE_TYPE_LABELS, agreement.fee_type, language)}</Badge>
              <Money value={agreement.total_amount} className="font-semibold" />
              {agreement.hourly_rate ? (
                <span className="text-xs text-fg-muted">
                  {t('billing.fee.hourlyRate')}: <Money value={agreement.hourly_rate} />
                </span>
              ) : null}
            </p>

            {agreement.stages.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-fg-subtle">{t('billing.fee.stages')}</p>
                <ul className="mt-1 divide-y divide-border">
                  {agreement.stages.map((stage) => (
                    <li key={stage.code} className="flex justify-between gap-3 py-1.5">
                      <span className="text-fg-muted">{stage.name}</span>
                      <Money value={stage.amount} decimals={false} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {agreement.note ? <p className="text-xs text-fg-subtle">{agreement.note}</p> : null}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title={t('billing.ledger.title')} />

        {ledger.data.entries.length === 0 ? (
          <EmptyState body={t('billing.ledger.empty')} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th scope="col" className="py-2 text-start font-semibold">
                      {t('billing.ledger.date')}
                    </th>
                    <th scope="col" className="py-2 text-start font-semibold">
                      {t('billing.ledger.description')}
                    </th>
                    <th scope="col" className="py-2 text-end font-semibold">
                      {t('billing.ledger.debit')}
                    </th>
                    <th scope="col" className="py-2 text-end font-semibold">
                      {t('billing.ledger.credit')}
                    </th>
                    <th scope="col" className="py-2 text-end font-semibold">
                      {t('billing.ledger.balance')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ledger.data.entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="py-2 text-fg-muted">
                        <DateText value={entry.date} style="short" />
                      </td>
                      <td className="py-2">
                        {entry.invoice_id && entry.kind === 'INVOICE' ? (
                          <Link
                            to={`/billing/invoices/${entry.invoice_id}`}
                            className="flex items-center gap-1.5 font-latin tabular-nums hover:text-primary hover:underline"
                          >
                            <Receipt className="h-3.5 w-3.5 text-fg-subtle" aria-hidden />
                            {entry.description}
                          </Link>
                        ) : (
                          <span className="font-latin tabular-nums">{entry.description}</span>
                        )}
                      </td>
                      <td className="py-2 text-end">
                        {entry.debit ? <Money value={entry.debit} showSymbol={false} /> : '—'}
                      </td>
                      <td className="py-2 text-end text-success">
                        {entry.credit ? <Money value={entry.credit} showSymbol={false} /> : '—'}
                      </td>
                      <td className="py-2 text-end font-medium">
                        <Money value={entry.balance} showSymbol={false} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-fg-muted">{t('billing.ledger.totalBilled')}</dt>
                <dd>
                  <Money value={ledger.data.total_billed} />
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-fg-muted">{t('billing.ledger.totalPaid')}</dt>
                <dd>
                  <Money value={ledger.data.total_paid} />
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-1 font-semibold">
                <dt>{t('billing.ledger.outstanding')}</dt>
                <dd>
                  <Money value={ledger.data.balance} />
                </dd>
              </div>
            </dl>
          </>
        )}
      </Card>

      <FeeAgreementDialog
        caseId={caseId}
        open={feeOpen}
        onOpenChange={setFeeOpen}
        defaults={
          agreement
            ? {
                fee_type: agreement.fee_type,
                total_amount: agreement.total_amount,
                hourly_rate: agreement.hourly_rate ?? '',
                note: agreement.note ?? '',
              }
            : undefined
        }
      />
    </div>
  );
}

interface FeeFormValues {
  fee_type: string;
  total_amount: string;
  hourly_rate: string;
  note: string;
}

function FeeAgreementDialog({
  caseId,
  open,
  onOpenChange,
  defaults,
}: {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaults?: FeeFormValues;
}) {
  const { t } = useTranslation();
  const { language } = useLocale();
  const saveFee = useSaveFeeAgreement(caseId);

  const feeTypeOptions = useMemo(
    () => optionsOf(FEE_TYPES, FEE_TYPE_LABELS, language),
    [language],
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FeeFormValues>({
    resolver: zodResolver(feeAgreementSchema),
    defaultValues: defaults ?? {
      fee_type: 'FIXED',
      total_amount: '',
      hourly_rate: '',
      note: '',
    },
  });

  // ঘণ্টাপ্রতি হার শুধু HOURLY-তে অর্থবহ — বাকি ধরনে ঘরটিই দেখানো হয় না
  const feeType = useWatch({ control, name: 'fee_type' });

  const messageFor = (key: keyof FeeFormValues): string | undefined =>
    errors[key] ? t(errors[key]?.message ?? 'validation.required') : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={t('billing.fee.setTitle')}>
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit((values) =>
          saveFee.mutate(
            {
              fee_type: values.fee_type as Parameters<typeof saveFee.mutate>[0]['fee_type'],
              total_amount: values.total_amount,
              hourly_rate: values.hourly_rate || null,
              note: values.note || null,
            },
            { onSuccess: () => onOpenChange(false) },
          ),
        )}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t('billing.fee.feeType')}
            options={feeTypeOptions}
            error={messageFor('fee_type')}
            {...register('fee_type')}
          />
          <Input
            label={t('billing.fee.totalAmount')}
            latin
            inputMode="decimal"
            error={messageFor('total_amount')}
            {...register('total_amount')}
          />
          {feeType === 'HOURLY' ? (
            <Input
              label={t('billing.fee.hourlyRate')}
              latin
              inputMode="decimal"
              error={messageFor('hourly_rate')}
              {...register('hourly_rate')}
            />
          ) : null}
        </div>

        <Textarea
          label={t('billing.fee.note')}
          rows={2}
          error={messageFor('note')}
          {...register('note')}
        />

        {saveFee.error ? (
          <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
            {t(isApiError(saveFee.error) ? saveFee.error.i18nKey : 'errors.unknown')}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={saveFee.isPending}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
