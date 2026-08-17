import type { MutationWriteRequest } from '@caseflow/api-types';
import {
  MUTATION_STATUSES,
  MUTATION_STATUS_LABELS,
  mutationWriteSchema,
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

import { useAddMutation } from '../api/use-properties';
import { FormDialogShell } from './FormDialogShell';

interface FormValues {
  mutation_case_no: string;
  status: string;
  applied_on: string;
  decided_on: string;
  new_khatian_no: string;
  office: string;
  note: string;
}

/** F-PROP-05 — নামজারির অবস্থা। */
export function MutationDialog({
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
  const addMutation = useAddMutation(propertyId);

  const statusOptions = useMemo(
    () => optionsOf(MUTATION_STATUSES, MUTATION_STATUS_LABELS, locale === 'en' ? 'EN' : 'BN'),
    [locale],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(mutationWriteSchema),
    defaultValues: {
      mutation_case_no: '',
      status: 'APPLIED',
      applied_on: '',
      decided_on: '',
      new_khatian_no: '',
      office: '',
      note: '',
    },
  });

  const messageFor = (key: keyof FormValues): string | undefined =>
    errors[key] ? t(errors[key]?.message ?? 'validation.required') : undefined;

  function submit(values: FormValues) {
    const body: MutationWriteRequest = {
      mutation_case_no: values.mutation_case_no || null,
      status: values.status as MutationWriteRequest['status'],
      applied_on: values.applied_on || null,
      decided_on: values.decided_on || null,
      new_khatian_no: values.new_khatian_no || null,
      office: values.office || null,
      note: values.note || null,
    };
    addMutation.mutate(body, {
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
      title={t('properties.mutations.addTitle')}
      onSubmit={handleSubmit(submit)}
      pending={addMutation.isPending}
      error={addMutation.error}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t('properties.mutations.caseNo')}
          latin
          error={messageFor('mutation_case_no')}
          {...register('mutation_case_no')}
        />
        <Select
          label={t('properties.mutations.status')}
          options={statusOptions}
          error={messageFor('status')}
          {...register('status')}
        />
        <Input
          label={t('properties.mutations.appliedOn')}
          type="date"
          latin
          error={messageFor('applied_on')}
          {...register('applied_on')}
        />
        <Input
          label={t('properties.mutations.decidedOn')}
          type="date"
          latin
          error={messageFor('decided_on')}
          {...register('decided_on')}
        />
        <Input
          label={t('properties.mutations.newKhatian')}
          latin
          error={messageFor('new_khatian_no')}
          {...register('new_khatian_no')}
        />
        <Input
          label={t('properties.mutations.office')}
          error={messageFor('office')}
          {...register('office')}
        />
      </div>

      <Textarea
        label={t('properties.mutations.note')}
        rows={2}
        error={messageFor('note')}
        {...register('note')}
      />
    </FormDialogShell>
  );
}
