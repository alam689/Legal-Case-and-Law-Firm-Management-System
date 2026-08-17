import { type ClientWriteInput, clientWriteSchema } from '@caseflow/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { isApiError } from '@/shared/api/errors';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';

export interface ClientFormValues {
  full_name: string;
  full_name_bn: string;
  mobile: string;
  alt_mobile: string;
  email: string;
  address: string;
  district: string;
  notes: string;
}

const EMPTY: ClientFormValues = {
  full_name: '',
  full_name_bn: '',
  mobile: '',
  alt_mobile: '',
  email: '',
  address: '',
  district: '',
  notes: '',
};

export function ClientForm({
  defaultValues,
  onSubmit,
  submitLabel,
  pending,
  error,
  onCancel,
}: {
  defaultValues?: Partial<ClientFormValues>;
  onSubmit: (values: ClientWriteInput) => void;
  submitLabel: string;
  pending: boolean;
  error?: unknown;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientWriteSchema),
    defaultValues: { ...EMPTY, ...defaultValues },
  });

  const messageFor = (key: keyof ClientFormValues): string | undefined =>
    errors[key] ? t(errors[key]?.message ?? 'validation.required') : undefined;

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values))} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t('clients.form.fullName')}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- ফর্ম খোলার একমাত্র উদ্দেশ্যই এটি পূরণ করা
          autoFocus
          error={messageFor('full_name')}
          {...register('full_name')}
        />
        <Input
          label={t('clients.form.fullNameBn')}
          error={messageFor('full_name_bn')}
          {...register('full_name_bn')}
        />
        <Input
          label={t('clients.form.mobile')}
          type="tel"
          inputMode="numeric"
          latin
          placeholder="01XXXXXXXXX"
          error={messageFor('mobile')}
          {...register('mobile')}
        />
        <Input
          label={t('clients.form.altMobile')}
          type="tel"
          inputMode="numeric"
          latin
          error={messageFor('alt_mobile')}
          {...register('alt_mobile')}
        />
        <Input
          label={t('clients.form.email')}
          type="email"
          latin
          error={messageFor('email')}
          {...register('email')}
        />
        <Input
          label={t('clients.form.district')}
          error={messageFor('district')}
          {...register('district')}
        />
      </div>

      <Textarea
        label={t('clients.form.address')}
        rows={2}
        error={messageFor('address')}
        {...register('address')}
      />

      <Textarea
        label={t('clients.form.notes')}
        hint={t('clients.form.notesHint')}
        error={messageFor('notes')}
        {...register('notes')}
      />

      <p className="flex items-start gap-2 text-xs text-fg-subtle">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        {t('clients.form.nidNotice')}
      </p>

      {error ? (
        <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {t(isApiError(error) ? error.i18nKey : 'errors.unknown')}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        ) : null}
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
