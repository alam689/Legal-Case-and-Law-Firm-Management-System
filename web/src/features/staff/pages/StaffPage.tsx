import type { StaffMember } from '@caseflow/api-types';
import { FIRM_ROLE_LABELS, type FirmRole, MVP_FIRM_ROLES, label, optionsOf } from '@caseflow/domain';
import { AlertTriangle, Plus, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { isApiError } from '@/shared/api/errors';
import { Can } from '@/shared/auth/Can';
import { formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card, CardHeader } from '@/shared/ui/Card';
import { DateText, Money } from '@/shared/ui/DateText';
import { Dialog } from '@/shared/ui/Dialog';
import { SearchInput } from '@/shared/ui/SearchInput';
import { Select } from '@/shared/ui/Select';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/states';

import {
  useFirmWorkload,
  useSetStaffActive,
  useStaff,
  useUpdateStaffRole,
} from '../api/use-staff';
import { StaffInviteDialog } from '../components/StaffInviteDialog';

/**
 * F-FIRM-02/03 — চেম্বারের সদস্য ও কাজের ভাগ (P3)।
 *
 * উপরে কাজের ভাগ, নিচে সদস্যের তালিকা — এই ক্রমটি ইচ্ছাকৃত। চেম্বার
 * প্রধান "কে আছে" জানেন; তিনি জানতে চান "কার উপরে কত চাপ" আর "কোন
 * মামলা কারও হাতে নেই"।
 */
export default function StaffPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data, isPending, isError, error, refetch } = useStaff(search);
  const workload = useFirmWorkload();
  const members = data?.results ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">{t('staff.title')}</h1>
          <p className="mt-1 text-sm text-fg-muted">{t('staff.subtitle')}</p>
        </div>

        <Can do="staff.manage">
          <Button onClick={() => setInviteOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            {t('staff.add')}
          </Button>
        </Can>
      </header>

      <WorkloadPanel />

      <SearchInput
        value={search}
        onChange={setSearch}
        label={t('staff.searchLabel')}
        className="max-w-md"
      />

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <SkeletonList rows={4} />
      ) : members.length === 0 ? (
        <EmptyState
          title={search ? t('staff.emptySearch.title') : t('staff.empty.title')}
          body={search ? t('staff.emptySearch.body') : t('staff.empty.body')}
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-fg-muted">
            {t('staff.count', { value: formatNumber(members.length, locale) })}
          </p>

          <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
            <table className="w-full min-w-[52rem] text-sm">
              <thead className="border-b border-border bg-surface-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 text-start font-semibold">
                    {t('staff.table.name')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-semibold">
                    {t('staff.table.role')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-end font-semibold">
                    {t('staff.table.cases')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-end font-semibold">
                    {t('staff.table.hearings')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-end font-semibold">
                    {t('staff.table.due')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-semibold">
                    {t('staff.table.status')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-end font-semibold">
                    <span className="sr-only">{t('common.edit')}</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {members.map((member) => (
                  <StaffRow key={member.id} member={member} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {workload.data && workload.data.unassigned_case_count > 0 ? (
        <p className="flex items-start gap-2 text-xs text-fg-subtle">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
          {t('staff.workload.unassignedHint')}
        </p>
      ) : null}

      <StaffInviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}

/** কার হাতে কত — bar দিয়ে, কারণ তুলনাটাই আসল তথ্য, নিখুঁত সংখ্যা নয়। */
function WorkloadPanel() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { data, isPending, isError } = useFirmWorkload();

  if (isError) return null;
  if (isPending) return <SkeletonList rows={2} />;

  const rows = [
    ...data.members.map((member) => ({
      id: member.id,
      name: member.full_name_bn ?? member.full_name,
      count: member.active_case_count,
      unassigned: false,
    })),
    ...(data.unassigned_case_count > 0
      ? [
          {
            id: '__none__',
            name: t('staff.workload.unassigned'),
            count: data.unassigned_case_count,
            unassigned: true,
          },
        ]
      : []),
  ].sort((a, b) => b.count - a.count);

  const max = Math.max(1, ...rows.map((row) => row.count));

  return (
    <Card>
      <CardHeader
        title={t('staff.workload.title')}
        description={t('staff.workload.subtitle')}
        action={
          <span className="text-sm text-fg-muted">
            {t('staff.workload.totalCases')}:{' '}
            <span className="font-latin font-semibold tabular-nums text-fg">
              {formatNumber(data.total_active_cases, locale)}
            </span>
          </span>
        }
      />

      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate text-sm text-fg-muted">{row.name}</span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
              <span
                className={row.unassigned ? 'block h-full bg-warning' : 'block h-full bg-primary'}
                style={{ width: `${Math.max(2, (row.count / max) * 100)}%` }}
              />
            </span>
            <Link
              to={`/cases?assigned=${row.id}`}
              className="w-14 shrink-0 text-end font-latin text-sm tabular-nums hover:text-primary hover:underline"
            >
              {formatNumber(row.count, locale)}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function StaffRow({ member }: { member: StaffMember }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const lang = locale === 'en' ? 'EN' : 'BN';

  const [roleOpen, setRoleOpen] = useState(false);
  const [role, setRole] = useState<string>(member.role);
  const [activeOpen, setActiveOpen] = useState(false);

  const updateRole = useUpdateStaffRole(member.id);
  const setActive = useSetStaffActive(member.id);

  const roleOptions = useMemo(
    () => optionsOf(MVP_FIRM_ROLES as readonly FirmRole[], FIRM_ROLE_LABELS, lang),
    [lang],
  );

  const name = member.full_name_bn ?? member.full_name;

  return (
    <tr className="transition-colors hover:bg-surface-muted/60">
      <th scope="row" className="px-4 py-3 text-start font-medium">
        <span className="flex items-start gap-2">
          <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" aria-hidden />
          <span className="min-w-0">
            <span className="block truncate">{name}</span>
            <span className="block font-latin text-xs font-normal text-fg-subtle">
              {member.mobile}
            </span>
          </span>
        </span>
      </th>

      <td className="px-4 py-3 text-fg-muted">{label(FIRM_ROLE_LABELS, member.role, lang)}</td>

      <td className="px-4 py-3 text-end font-latin tabular-nums">
        {formatNumber(member.active_case_count, locale)}
      </td>
      <td className="px-4 py-3 text-end font-latin tabular-nums text-fg-muted">
        {formatNumber(member.hearings_this_week, locale)}
      </td>
      <td className="px-4 py-3 text-end">
        <Money value={member.outstanding_amount} decimals={false} />
      </td>

      <td className="px-4 py-3">
        <span className="flex flex-col gap-1">
          <Badge tone={member.is_active ? 'success' : 'neutral'}>
            {member.is_active ? t('staff.active') : t('staff.inactive')}
          </Badge>
          {/* কখনো ঢোকেননি — আমন্ত্রণ পাঠিয়ে ভুলে যাওয়া সদস্য এভাবেই চোখে পড়ে */}
          <span className="text-xs text-fg-subtle">
            {member.last_active_at ? (
              <DateText value={member.last_active_at} style="short" />
            ) : (
              t('staff.neverActive')
            )}
          </span>
        </span>
      </td>

      {/* Dialog দুটি Radix-এর portal দিয়ে body-তে যায়, তাই cell-এর ভেতরে
          রাখলেও table-এর গঠন ভাঙে না */}
      <td className="px-4 py-3">
        <Can do="staff.manage">
          <div className="flex justify-end gap-1">
            <Button variant="ghost" onClick={() => setRoleOpen(true)}>
              {t('staff.changeRole')}
            </Button>
            <Button variant="ghost" onClick={() => setActiveOpen(true)}>
              {member.is_active ? t('staff.deactivate') : t('staff.reactivate')}
            </Button>
          </div>
        </Can>

        <Dialog
          open={roleOpen}
          onOpenChange={setRoleOpen}
          title={t('staff.changeRoleTitle')}
          description={t('staff.changeRoleBody', { name })}
          footer={
            <>
              <Button variant="secondary" onClick={() => setRoleOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                loading={updateRole.isPending}
                onClick={() =>
                  updateRole.mutate(role as FirmRole, { onSuccess: () => setRoleOpen(false) })
                }
              >
                {t('common.save')}
              </Button>
            </>
          }
        >
          <Select
            label={t('staff.fields.role')}
            options={roleOptions}
            value={role}
            onChange={(event) => setRole(event.target.value)}
          />
          {updateRole.error ? (
            <p role="alert" className="mt-3 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
              {isApiError(updateRole.error) && updateRole.error.status === 409
                ? t('staff.lastAdminWarning')
                : t(isApiError(updateRole.error) ? updateRole.error.i18nKey : 'errors.unknown')}
            </p>
          ) : null}
        </Dialog>

        <Dialog
          open={activeOpen}
          onOpenChange={setActiveOpen}
          title={t('staff.deactivateTitle')}
          footer={
            <>
              <Button variant="secondary" onClick={() => setActiveOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant={member.is_active ? 'danger' : 'primary'}
                loading={setActive.isPending}
                onClick={() =>
                  setActive.mutate(!member.is_active, { onSuccess: () => setActiveOpen(false) })
                }
              >
                {member.is_active ? t('staff.deactivate') : t('staff.reactivate')}
              </Button>
            </>
          }
        >
          <p className="text-sm text-fg-muted">{t('staff.deactivateBody', { name })}</p>
          {setActive.error ? (
            <p role="alert" className="mt-3 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
              {isApiError(setActive.error) && setActive.error.status === 409
                ? t('staff.lastAdminWarning')
                : t(isApiError(setActive.error) ? setActive.error.i18nKey : 'errors.unknown')}
            </p>
          ) : null}
        </Dialog>
      </td>
    </tr>
  );
}
