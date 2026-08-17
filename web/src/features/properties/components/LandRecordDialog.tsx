import type { LandRecordWriteRequest } from '@caseflow/api-types';
import {
  LAND_CLASSES,
  LAND_CLASS_LABELS,
  LAND_RECORD_TYPES,
  LAND_RECORD_TYPE_LABELS,
  landRecordWriteSchema,
  optionsOf,
} from '@caseflow/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useLocale } from '@/shared/i18n/use-locale';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Textarea } from '@/shared/ui/Textarea';

import { useAddLandRecord } from '../api/use-properties';
import { FormDialogShell } from './FormDialogShell';

interface FormValues {
  record_type: string;
  khatian_no: string;
  dag_no: string;
  mouza: string;
  jl_no: string;
  area_decimal: string;
  land_class: string;
  owner_names: string;
  note: string;
}

/** F-PROP-02 — একটি জরিপ রেকর্ড (সি.এস./এস.এ./আর.এস./বি.এস. ইত্যাদি)। */
export function LandRecordDialog({
  propertyId,
  open,
  onOpenChange,
  defaults,
}: {
  propertyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** সম্পত্তির মৌজা/জে.এল. আগে থেকেই ভরা থাকে — একই কথা দুবার লেখা অপচয়। */
  defaults?: { mouza?: string | null; jl_no?: string | null };
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const addRecord = useAddLandRecord(propertyId);
  const lang = locale === 'en' ? 'EN' : 'BN';

  const recordTypeOptions = useMemo(
    () => optionsOf(LAND_RECORD_TYPES, LAND_RECORD_TYPE_LABELS, lang),
    [lang],
  );
  const landClassOptions = useMemo(() => optionsOf(LAND_CLASSES, LAND_CLASS_LABELS, lang), [lang]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(landRecordWriteSchema),
    defaultValues: {
      record_type: 'BS',
      khatian_no: '',
      dag_no: '',
      mouza: defaults?.mouza ?? '',
      jl_no: defaults?.jl_no ?? '',
      area_decimal: '',
      land_class: '',
      owner_names: '',
      note: '',
    },
  });

  const messageFor = (key: keyof FormValues): string | undefined =>
    errors[key] ? t(errors[key]?.message ?? 'validation.required') : undefined;

  function submit(values: FormValues) {
    const body: LandRecordWriteRequest = {
      record_type: values.record_type as LandRecordWriteRequest['record_type'],
      khatian_no: values.khatian_no,
      dag_no: values.dag_no,
      mouza: values.mouza || null,
      jl_no: values.jl_no || null,
      area_decimal: values.area_decimal,
      land_class: (values.land_class || null) as LandRecordWriteRequest['land_class'],
      // একটি ঘরে কমা দিয়ে লেখা নাম → array; খালি টুকরো বাদ
      owner_names: values.owner_names
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean),
      note: values.note || null,
    };
    addRecord.mutate(body, {
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
      title={t('properties.records.addTitle')}
      description={t('properties.records.subtitle')}
      onSubmit={handleSubmit(submit)}
      pending={addRecord.isPending}
      error={addRecord.error}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label={t('properties.records.recordType')}
          options={recordTypeOptions}
          error={messageFor('record_type')}
          {...register('record_type')}
        />
        <Select
          label={t('properties.fields.landClass')}
          options={landClassOptions}
          placeholder="—"
          error={messageFor('land_class')}
          {...register('land_class')}
        />
        <Input
          label={t('properties.records.khatianNo')}
          latin
          error={messageFor('khatian_no')}
          {...register('khatian_no')}
        />
        <Input
          label={t('properties.records.dagNo')}
          latin
          error={messageFor('dag_no')}
          {...register('dag_no')}
        />
        <Input
          label={t('properties.fields.mouza')}
          error={messageFor('mouza')}
          {...register('mouza')}
        />
        <Input
          label={t('properties.fields.jlNo')}
          latin
          error={messageFor('jl_no')}
          {...register('jl_no')}
        />
        <Input
          label={t('properties.fields.area')}
          latin
          inputMode="decimal"
          placeholder="33.000"
          error={messageFor('area_decimal')}
          {...register('area_decimal')}
        />
      </div>

      <Input
        label={t('properties.records.owners')}
        hint={t('properties.records.ownersHint')}
        error={messageFor('owner_names')}
        {...register('owner_names')}
      />

      <Textarea
        label={t('properties.records.note')}
        rows={2}
        error={messageFor('note')}
        {...register('note')}
      />
    </FormDialogShell>
  );
}
