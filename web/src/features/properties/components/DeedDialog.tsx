import type { DeedWriteRequest } from '@caseflow/api-types';
import { DEED_TYPES, DEED_TYPE_LABELS, deedWriteSchema, optionsOf } from '@caseflow/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useLocale } from '@/shared/i18n/use-locale';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Textarea } from '@/shared/ui/Textarea';

import { useAddDeed } from '../api/use-properties';
import { FormDialogShell } from './FormDialogShell';

interface FormValues {
  deed_type: string;
  deed_no: string;
  deed_date: string;
  registry_office: string;
  grantor: string;
  grantee: string;
  consideration_amount: string;
  note: string;
}

/** F-PROP-03 — দলিলের তথ্য। */
export function DeedDialog({
  propertyId,
  open,
  onOpenChange,
}: {
  propertyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const addDeed = useAddDeed(propertyId);

  const deedTypeOptions = useMemo(
    () => optionsOf(DEED_TYPES, DEED_TYPE_LABELS, locale === 'en' ? 'EN' : 'BN'),
    [locale],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(deedWriteSchema),
    defaultValues: {
      deed_type: 'SALE',
      deed_no: '',
      deed_date: '',
      registry_office: '',
      grantor: '',
      grantee: '',
      consideration_amount: '',
      note: '',
    },
  });

  const messageFor = (key: keyof FormValues): string | undefined =>
    errors[key] ? t(errors[key]?.message ?? 'validation.required') : undefined;

  function submit(values: FormValues) {
    const body: DeedWriteRequest = {
      deed_type: values.deed_type as DeedWriteRequest['deed_type'],
      deed_no: values.deed_no,
      deed_date: values.deed_date || null,
      registry_office: values.registry_office || null,
      grantor: values.grantor || null,
      grantee: values.grantee || null,
      consideration_amount: values.consideration_amount || null,
      note: values.note || null,
    };
    addDeed.mutate(body, {
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
      title={t('properties.deeds.addTitle')}
      onSubmit={handleSubmit(submit)}
      pending={addDeed.isPending}
      error={addDeed.error}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label={t('properties.deeds.deedType')}
          options={deedTypeOptions}
          error={messageFor('deed_type')}
          {...register('deed_type')}
        />
        <Input
          label={t('properties.deeds.deedNo')}
          latin
          error={messageFor('deed_no')}
          {...register('deed_no')}
        />
        <Input
          label={t('properties.deeds.deedDate')}
          type="date"
          latin
          error={messageFor('deed_date')}
          {...register('deed_date')}
        />
        <Input
          label={t('properties.deeds.registryOffice')}
          error={messageFor('registry_office')}
          {...register('registry_office')}
        />
        <Input
          label={t('properties.deeds.grantor')}
          error={messageFor('grantor')}
          {...register('grantor')}
        />
        <Input
          label={t('properties.deeds.grantee')}
          error={messageFor('grantee')}
          {...register('grantee')}
        />
        <Input
          label={t('properties.deeds.consideration')}
          latin
          inputMode="decimal"
          error={messageFor('consideration_amount')}
          {...register('consideration_amount')}
        />
      </div>

      <Textarea
        label={t('properties.deeds.note')}
        rows={2}
        error={messageFor('note')}
        {...register('note')}
      />
    </FormDialogShell>
  );
}
