import type { TenantListItem } from '@caseflow/api-types';
import {
  FIRM_TYPES,
  FIRM_TYPE_LABELS,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_PLAN_LABELS,
  TENANT_STATUSES,
  TENANT_STATUS_LABELS,
  TENANT_STATUS_TONES,
  type FirmType,
  type SubscriptionPlan,
  type TenantStatus,
  label,
  optionsOf,
  tenantCreateSchema,
} from '@caseflow/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Building2, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { isApiError } from '@/shared/api/errors';
import { formatDate, formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Money } from '@/shared/ui/DateText';
import { Dialog } from '@/shared/ui/Dialog';
import { Input } from '@/shared/ui/Input';
import { SearchInput } from '@/shared/ui/SearchInput';
import { Select } from '@/shared/ui/Select';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/states';

import {
  useCreateTenant,
  useTenants,
  useUpdateTenantPlan,
  useUpdateTenantStatus,
} from '../api/use-platform';

/** P5 — tenant তালিকা, onboarding, plan ও status পরিবর্তন। */
export default function AdminFirmsPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isPending, isError, error, refetch } = useTenants(search);
  const firms = data?.results ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">{t('admin.firms.title')}</h1>
          <p className="mt-1 text-sm text-fg-muted">{t('admin.firms.subtitle')}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          {t('admin.firms.add')}
        </Button>
      </header>

      <SearchInput
        value={search}
        onChange={setSearch}
        label={t('admin.firms.searchLabel')}
        className="max-w-md"
      />

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <SkeletonList rows={4} />
      ) : firms.length === 0 ? (
        <EmptyState
          title={search ? t('admin.firms.emptySearch.title') : t('admin.firms.empty.title')}
          body={search ? t('admin.firms.emptySearch.body') : t('admin.firms.empty.body')}
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-fg-muted">
            {t('admin.firms.count', { value: formatNumber(firms.length, locale) })}
          </p>

          <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
            <table className="w-full min-w-[56rem] text-sm">
              <thead className="border-b border-border bg-surface-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 text-start font-semibold">
                    {t('admin.firms.table.name')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-semibold">
                    {t('admin.firms.table.plan')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-semibold">
                    {t('admin.firms.table.status')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-end font-semibold">
                    {t('admin.firms.table.lawyers')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-end font-semibold">
                    {t('admin.firms.table.cases')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-semibold">
                    {t('admin.firms.table.sms')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-end font-semibold">
                    {t('admin.firms.table.mrr')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-end font-semibold">
                    <span className="sr-only">{t('common.edit')}</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {firms.map((firm) => (
                  <FirmRow key={firm.id} firm={firm} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TenantCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

/** কোটার কত শতাংশ খরচ — ৮০% পেরোলে চোখে পড়া দরকার। */
const QUOTA_WARNING_RATIO = 0.8;

function FirmRow({ firm }: { firm: TenantListItem }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const lang = locale === 'en' ? 'EN' : 'BN';

  const [planOpen, setPlanOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [plan, setPlan] = useState<string>(firm.plan);
  const [status, setStatus] = useState<string>(firm.status);

  const updatePlan = useUpdateTenantPlan(firm.id);
  const updateStatus = useUpdateTenantStatus(firm.id);

  const planOptions = useMemo(
    () => optionsOf(SUBSCRIPTION_PLANS, SUBSCRIPTION_PLAN_LABELS, lang),
    [lang],
  );
  const statusOptions = useMemo(
    () => optionsOf(TENANT_STATUSES, TENANT_STATUS_LABELS, lang),
    [lang],
  );

  const quotaRatio = firm.sms_quota_monthly
    ? firm.sms_used_current_period / firm.sms_quota_monthly
    : 0;
  const nearQuota = quotaRatio >= QUOTA_WARNING_RATIO;

  return (
    <tr className="transition-colors hover:bg-surface-muted/60">
      <th scope="row" className="px-4 py-3 text-start font-medium">
        <span className="flex items-start gap-2">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" aria-hidden />
          <span className="min-w-0">
            <span className="block truncate">{firm.name_bn ?? firm.name}</span>
            <span className="block truncate text-xs font-normal text-fg-subtle">
              {[firm.district, firm.owner_name].filter(Boolean).join(' · ')}
            </span>
          </span>
        </span>
      </th>

      <td className="px-4 py-3">
        <span className="block text-fg-muted">
          {label(SUBSCRIPTION_PLAN_LABELS, firm.plan, lang)}
        </span>
        <span className="block text-xs text-fg-subtle">
          {label(FIRM_TYPE_LABELS, firm.firm_type, lang)}
        </span>
      </td>

      <td className="px-4 py-3">
        <Badge tone={TENANT_STATUS_TONES[firm.status]}>
          {label(TENANT_STATUS_LABELS, firm.status, lang)}
        </Badge>
        {firm.trial_ends_on ? (
          <span className="mt-1 block text-xs text-fg-subtle">
            {t('admin.firms.trialEnds', {
              value: formatDate(firm.trial_ends_on, locale, 'short'),
            })}
          </span>
        ) : null}
      </td>

      <td className="px-4 py-3 text-end font-latin tabular-nums">
        {formatNumber(firm.lawyer_count, locale)}
      </td>
      <td className="px-4 py-3 text-end font-latin tabular-nums text-fg-muted">
        {formatNumber(firm.case_count, locale)}
      </td>

      <td className="px-4 py-3">
        <span className="flex items-center gap-1.5">
          {nearQuota ? (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
          ) : null}
          <span className="font-latin text-xs tabular-nums text-fg-muted">
            {t('admin.firms.quotaUsed', {
              used: formatNumber(firm.sms_used_current_period, locale),
              quota: formatNumber(firm.sms_quota_monthly, locale),
            })}
          </span>
        </span>
      </td>

      <td className="px-4 py-3 text-end">
        <Money value={firm.mrr} decimals={false} />
      </td>

      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" onClick={() => setPlanOpen(true)}>
            {t('admin.firms.changePlan')}
          </Button>
          <Button variant="ghost" onClick={() => setStatusOpen(true)}>
            {t('admin.firms.changeStatus')}
          </Button>
        </div>

        <Dialog
          open={planOpen}
          onOpenChange={setPlanOpen}
          title={t('admin.firms.changePlanTitle')}
          footer={
            <>
              <Button variant="secondary" onClick={() => setPlanOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                loading={updatePlan.isPending}
                onClick={() =>
                  updatePlan.mutate(
                    { plan: plan as SubscriptionPlan },
                    { onSuccess: () => setPlanOpen(false) },
                  )
                }
              >
                {t('common.save')}
              </Button>
            </>
          }
        >
          <Select
            label={t('admin.firms.fields.plan')}
            options={planOptions}
            value={plan}
            onChange={(event) => setPlan(event.target.value)}
          />
          {updatePlan.error ? (
            <p role="alert" className="mt-3 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
              {t(isApiError(updatePlan.error) ? updatePlan.error.i18nKey : 'errors.unknown')}
            </p>
          ) : null}
        </Dialog>

        <Dialog
          open={statusOpen}
          onOpenChange={setStatusOpen}
          title={t('admin.firms.changeStatusTitle')}
          footer={
            <>
              <Button variant="secondary" onClick={() => setStatusOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant={status === 'SUSPENDED' ? 'danger' : 'primary'}
                loading={updateStatus.isPending}
                onClick={() =>
                  updateStatus.mutate(
                    { status: status as TenantStatus },
                    { onSuccess: () => setStatusOpen(false) },
                  )
                }
              >
                {t('common.save')}
              </Button>
            </>
          }
        >
          <Select
            label={t('admin.firms.table.status')}
            options={statusOptions}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          />

          {/* স্থগিত করার পরিণতি স্পষ্ট করে বলা — মক্কেলরাও তারিখ জানতে পারবেন না */}
          {status === 'SUSPENDED' ? (
            <p className="mt-3 flex items-start gap-2 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {t('admin.firms.suspendWarning')}
            </p>
          ) : null}

          {updateStatus.error ? (
            <p role="alert" className="mt-3 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
              {t(isApiError(updateStatus.error) ? updateStatus.error.i18nKey : 'errors.unknown')}
            </p>
          ) : null}
        </Dialog>
      </td>
    </tr>
  );
}

interface TenantFormValues {
  name: string;
  name_bn: string;
  firm_type: string;
  district: string;
  owner_name: string;
  owner_mobile: string;
  email: string;
  plan: string;
}

function TenantCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const lang = locale === 'en' ? 'EN' : 'BN';
  const createTenant = useCreateTenant();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantCreateSchema),
    defaultValues: {
      name: '',
      name_bn: '',
      firm_type: 'CHAMBER',
      district: '',
      owner_name: '',
      owner_mobile: '',
      email: '',
      plan: 'TRIAL',
    },
  });

  const messageFor = (key: keyof TenantFormValues): string | undefined =>
    errors[key] ? t(errors[key]?.message ?? 'validation.required') : undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('admin.firms.addTitle')}
      className="w-[min(42rem,calc(100vw-2rem))]"
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit((values) =>
          createTenant.mutate(
            {
              name: values.name,
              name_bn: values.name_bn || null,
              firm_type: values.firm_type as FirmType,
              district: values.district || null,
              owner_name: values.owner_name,
              owner_mobile: values.owner_mobile,
              email: values.email || null,
              plan: values.plan as SubscriptionPlan,
            },
            {
              onSuccess: () => {
                reset();
                onOpenChange(false);
              },
            },
          ),
        )}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('admin.firms.fields.name')}
            // eslint-disable-next-line jsx-a11y/no-autofocus -- ফর্ম খোলার একমাত্র উদ্দেশ্যই এটি পূরণ করা
            autoFocus
            error={messageFor('name')}
            {...register('name')}
          />
          <Input
            label={t('admin.firms.fields.nameBn')}
            error={messageFor('name_bn')}
            {...register('name_bn')}
          />
          <Select
            label={t('admin.firms.fields.firmType')}
            options={optionsOf(FIRM_TYPES, FIRM_TYPE_LABELS, lang)}
            error={messageFor('firm_type')}
            {...register('firm_type')}
          />
          <Input
            label={t('admin.firms.fields.district')}
            error={messageFor('district')}
            {...register('district')}
          />
          <Input
            label={t('admin.firms.fields.ownerName')}
            error={messageFor('owner_name')}
            {...register('owner_name')}
          />
          <Input
            label={t('admin.firms.fields.ownerMobile')}
            type="tel"
            inputMode="numeric"
            latin
            placeholder="01XXXXXXXXX"
            error={messageFor('owner_mobile')}
            {...register('owner_mobile')}
          />
          <Input
            label={t('admin.firms.fields.email')}
            type="email"
            latin
            error={messageFor('email')}
            {...register('email')}
          />
          <Select
            label={t('admin.firms.fields.plan')}
            options={optionsOf(SUBSCRIPTION_PLANS, SUBSCRIPTION_PLAN_LABELS, lang)}
            error={messageFor('plan')}
            {...register('plan')}
          />
        </div>

        {createTenant.error ? (
          <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
            {t(isApiError(createTenant.error) ? createTenant.error.i18nKey : 'errors.unknown')}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={createTenant.isPending}>
            {t('admin.firms.add')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
