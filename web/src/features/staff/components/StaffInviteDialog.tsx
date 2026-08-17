import type { StaffInviteRequest } from '@caseflow/api-types';
import {
  FIRM_ROLE_LABELS,
  type FirmRole,
  MVP_FIRM_ROLES,
  optionsOf,
  staffInviteSchema,
} from '@caseflow/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info } from 'lucide-react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { isApiError } from '@/shared/api/errors';
import { useLocale } from '@/shared/i18n/use-locale';
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';

import { useInviteStaff } from '../api/use-staff';

interface FormValues {
  full_name: string;
  full_name_bn: string;
  mobile: string;
  email: string;
  role: string;
}

/** F-FIRM-02 — চেম্বারে সদস্য যোগ। */
export function StaffInviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const invite = useInviteStaff();

  const roleOptions = useMemo(
    () =>
      optionsOf(MVP_FIRM_ROLES as readonly FirmRole[], FIRM_ROLE_LABELS, locale === 'en' ? 'EN' : 'BN'),
    [locale],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(staffInviteSchema),
    defaultValues: { full_name: '', full_name_bn: '', mobile: '', email: '', role: 'ASSISTANT' },
  });

  const messageFor = (key: keyof FormValues): string | undefined =>
    errors[key] ? t(errors[key]?.message ?? 'validation.required') : undefined;

  function submit(values: FormValues) {
    const body: StaffInviteRequest = {
      full_name: values.full_name,
      full_name_bn: values.full_name_bn || null,
      mobile: values.mobile,
      email: values.email || null,
      role: values.role as FirmRole,
    };
    invite.mutate(body, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={t('staff.addTitle')}>
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('staff.fields.fullName')}
            // eslint-disable-next-line jsx-a11y/no-autofocus -- ফর্ম খোলার একমাত্র উদ্দেশ্যই এটি পূরণ করা
            autoFocus
            error={messageFor('full_name')}
            {...register('full_name')}
          />
          <Input
            label={t('staff.fields.fullNameBn')}
            error={messageFor('full_name_bn')}
            {...register('full_name_bn')}
          />
          <Input
            label={t('staff.fields.mobile')}
            type="tel"
            inputMode="numeric"
            latin
            placeholder="01XXXXXXXXX"
            error={messageFor('mobile')}
            {...register('mobile')}
          />
          <Input
            label={t('staff.fields.email')}
            type="email"
            latin
            error={messageFor('email')}
            {...register('email')}
          />
          <Select
            label={t('staff.fields.role')}
            options={roleOptions}
            error={messageFor('role')}
            {...register('role')}
          />
        </div>

        <p className="flex items-start gap-2 text-xs text-fg-subtle">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {t('staff.inviteNote')}
        </p>

        {invite.error ? (
          <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
            {t(isApiError(invite.error) ? invite.error.i18nKey : 'errors.unknown')}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={invite.isPending}>
            {t('staff.add')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
