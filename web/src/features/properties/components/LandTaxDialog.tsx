import type { LandTaxWriteRequest } from '@caseflow/api-types';
import { landTaxWriteSchema } from '@caseflow/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Input } from '@/shared/ui/Input';

import { useAddLandTax } from '../api/use-properties';
import { FormDialogShell } from './FormDialogShell';

interface FormValues {
  fiscal_year: string;
  receipt_no: string;
  paid_on: string;
  amount: string;
  office: string;
}

/** F-PROP-06 — ভূমি উন্নয়ন কর (খাজনা) পরিশোধের রসিদ। */
export function LandTaxDialog({
  propertyId,
  open,
  onOpenChange,
}: {
  propertyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const addTax = useAddLandTax(propertyId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(landTaxWriteSchema),
    defaultValues: {
      fiscal_year: '',
      receipt_no: '',
      paid_on: '',
      amount: '',
      office: '',
    },
  });

  const messageFor = (key: keyof FormValues): string | undefined =>
    errors[key] ? t(errors[key]?.message ?? 'validation.required') : undefined;

  function submit(values: FormValues) {
    const body: LandTaxWriteRequest = {
      fiscal_year: values.fiscal_year,
      receipt_no: values.receipt_no || null,
      paid_on: values.paid_on || null,
      amount: values.amount,
      office: values.office || null,
    };
    addTax.mutate(body, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  }

  return (
    <FormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={t('properties.taxes.addTitle')}
      onSubmit={handleSubmit(submit)}
      pending={addTax.isPending}
      error={addTax.error}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t('properties.taxes.fiscalYear')}
          latin
          placeholder="2025-2026"
          hint={t('properties.taxes.fiscalYearHint')}
          error={messageFor('fiscal_year')}
          {...register('fiscal_year')}
        />
        <Input
          label={t('properties.taxes.receiptNo')}
          latin
          error={messageFor('receipt_no')}
          {...register('receipt_no')}
        />
        <Input
          label={t('properties.taxes.paidOn')}
          type="date"
          latin
          error={messageFor('paid_on')}
          {...register('paid_on')}
        />
        <Input
          label={t('properties.taxes.amount')}
          latin
          inputMode="decimal"
          error={messageFor('amount')}
          {...register('amount')}
        />
        <Input
          label={t('properties.taxes.office')}
          error={messageFor('office')}
          {...register('office')}
        />
      </div>
    </FormDialogShell>
  );
}
