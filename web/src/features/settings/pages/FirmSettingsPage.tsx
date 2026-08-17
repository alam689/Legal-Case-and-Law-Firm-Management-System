import { firmSettingsSchema } from '@caseflow/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, ImageOff, Upload } from 'lucide-react';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { isApiError } from '@/shared/api/errors';
import { usePermission } from '@/shared/auth/use-permission';
import { pickBilingual } from '@/shared/i18n/bilingual';
import { formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Button } from '@/shared/ui/Button';
import { Card, CardHeader } from '@/shared/ui/Card';
import { Input } from '@/shared/ui/Input';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { Textarea } from '@/shared/ui/Textarea';
import { ErrorState, ForbiddenState } from '@/shared/ui/states';

import { useFirmSettings, useUpdateFirmSettings } from '../api/use-firm-settings';

interface FormValues {
  name: string;
  name_bn: string;
  address: string;
  mobile: string;
  email: string;
  letterhead_note: string;
  invoice_prefix: string;
  terms: string;
}

/**
 * F-BILL-10 — চেম্বারের সেটিংস।
 *
 * এই পাতার প্রতিটি ঘর চালান ও রসিদের কাগজে গিয়ে বসে, তাই পাশেই
 * লেটারহেডের সরাসরি নমুনা দেখানো হয় — কী ছাপা হবে তা অনুমান করতে
 * হয় না। `firm.settings` capability ছাড়া পাতাটি খোলা যায় না।
 */
export default function FirmSettingsPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const canEdit = usePermission('firm.settings');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const logoInputId = useId();

  const { data: settings, isPending, isError, error, refetch } = useFirmSettings();
  const updateSettings = useUpdateFirmSettings();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(firmSettingsSchema),
    values: settings
      ? {
          name: settings.name,
          name_bn: settings.name_bn ?? '',
          address: settings.address ?? '',
          mobile: settings.mobile ?? '',
          email: settings.email ?? '',
          letterhead_note: settings.letterhead_note ?? '',
          invoice_prefix: settings.invoice_prefix,
          terms: settings.terms ?? '',
        }
      : undefined,
  });

  if (!canEdit) return <ForbiddenState />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending || !settings) return <SkeletonList rows={5} />;

  const messageFor = (key: keyof FormValues): string | undefined =>
    errors[key] ? t(errors[key]?.message ?? 'validation.required') : undefined;

  const live = watch();
  const logoUrl = logoPreview ?? settings.logo_url;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('settings.subtitle')}</p>
      </header>

      <form
        noValidate
        className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
        onSubmit={handleSubmit((values) => {
          setSaved(false);
          updateSettings.mutate(
            {
              name: values.name,
              name_bn: values.name_bn || null,
              address: values.address || null,
              mobile: values.mobile || null,
              email: values.email || null,
              letterhead_note: values.letterhead_note || null,
              invoice_prefix: values.invoice_prefix,
              terms: values.terms || null,
              ...(logoPreview ? { logo_url: logoPreview } : {}),
            },
            { onSuccess: () => setSaved(true) },
          );
        })}
      >
        <div className="space-y-4">
          <Card>
            <CardHeader title={t('settings.sections.firm')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t('settings.fields.name')}
                error={messageFor('name')}
                {...register('name')}
              />
              <Input
                label={t('settings.fields.nameBn')}
                error={messageFor('name_bn')}
                {...register('name_bn')}
              />
              <Input
                label={t('settings.fields.mobile')}
                type="tel"
                latin
                error={messageFor('mobile')}
                {...register('mobile')}
              />
              <Input
                label={t('settings.fields.email')}
                type="email"
                latin
                error={messageFor('email')}
                {...register('email')}
              />
            </div>
            <Textarea
              label={t('settings.fields.address')}
              rows={2}
              className="mt-4"
              error={messageFor('address')}
              {...register('address')}
            />
          </Card>

          <Card>
            <CardHeader title={t('settings.sections.letterhead')} />

            <div className="flex flex-wrap items-center gap-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  className="h-16 w-16 rounded border border-border object-contain"
                />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-border text-fg-subtle">
                  <ImageOff className="h-5 w-5" aria-hidden />
                </span>
              )}

              <div>
                <label
                  htmlFor={logoInputId}
                  className="inline-flex h-tap cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-muted"
                >
                  <Upload className="h-4 w-4" aria-hidden />
                  {t('settings.logo.upload')}
                </label>
                <input
                  id={logoInputId}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    // Backend না থাকায় object URL — আসল আপলোড server যুক্ত হলে
                    setLogoPreview(URL.createObjectURL(file));
                    event.target.value = '';
                  }}
                />
                <p className="mt-1 text-xs text-fg-subtle">{t('settings.logo.hint')}</p>
              </div>

              {logoUrl ? (
                <Button type="button" variant="ghost" onClick={() => setLogoPreview(null)}>
                  {t('settings.logo.remove')}
                </Button>
              ) : null}
            </div>

            <Input
              label={t('settings.fields.letterheadNote')}
              hint={t('settings.fields.letterheadNoteHint')}
              className="mt-4"
              error={messageFor('letterhead_note')}
              {...register('letterhead_note')}
            />
          </Card>

          <Card>
            <CardHeader title={t('settings.sections.invoice')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t('settings.fields.invoicePrefix')}
                latin
                hint={t('settings.fields.invoicePrefixHint')}
                error={messageFor('invoice_prefix')}
                {...register('invoice_prefix')}
              />
              <Input
                label={t('settings.fields.nextNumber')}
                latin
                readOnly
                value={formatNumber(settings.invoice_next_number, locale)}
              />
            </div>
            <Textarea
              label={t('settings.fields.terms')}
              hint={t('settings.fields.termsHint')}
              rows={3}
              className="mt-4"
              error={messageFor('terms')}
              {...register('terms')}
            />
          </Card>

          {updateSettings.error ? (
            <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
              {t(isApiError(updateSettings.error) ? updateSettings.error.i18nKey : 'errors.unknown')}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-3">
            {saved && !updateSettings.isPending ? (
              <p role="status" className="flex items-center gap-1.5 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                {t('settings.saved')}
              </p>
            ) : null}
            <Button type="submit" loading={updateSettings.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </div>

        <aside>
          <Card className="sticky top-20">
            <CardHeader
              title={t('settings.preview.title')}
              description={t('settings.preview.hint')}
            />

            <div className="space-y-2 rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
                <div className="min-w-0">
                  <p className="text-base font-bold text-fg">
                    {pickBilingual(live.name || settings.name, live.name_bn || null, locale)}
                  </p>
                  {live.address ? (
                    <p className="mt-0.5 whitespace-pre-line text-xs text-fg-muted">
                      {live.address}
                    </p>
                  ) : null}
                  <p className="mt-0.5 font-latin text-xs text-fg-muted">
                    {[live.mobile, live.email].filter(Boolean).join(' · ')}
                  </p>
                  {live.letterhead_note ? (
                    <p className="mt-1 text-xs text-fg-subtle">{live.letterhead_note}</p>
                  ) : null}
                </div>

                {logoUrl ? (
                  <img src={logoUrl} alt="" className="h-12 w-12 object-contain" />
                ) : (
                  <span className="text-xs text-fg-subtle">{t('settings.logo.none')}</span>
                )}
              </div>

              <p className="font-latin text-xs tabular-nums text-fg-muted">
                {live.invoice_prefix || settings.invoice_prefix}-2026-
                {String(settings.invoice_next_number).padStart(4, '0')}
              </p>

              {live.terms ? (
                <p className="whitespace-pre-line border-t border-border pt-2 text-xs text-fg-subtle">
                  {live.terms}
                </p>
              ) : null}
            </div>
          </Card>
        </aside>
      </form>
    </div>
  );
}
