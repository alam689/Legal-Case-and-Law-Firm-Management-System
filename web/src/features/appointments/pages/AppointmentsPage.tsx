import type { AppointmentItem } from '@caseflow/api-types';
import {
  APPOINTMENT_MODE_LABELS,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_TONES,
  appointmentDecisionSchema,
  label,
} from '@caseflow/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarClock, Info, Phone, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { isApiError } from '@/shared/api/errors';
import { Can } from '@/shared/auth/Can';
import { formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { DateText } from '@/shared/ui/DateText';
import { Dialog } from '@/shared/ui/Dialog';
import { Input } from '@/shared/ui/Input';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { Textarea } from '@/shared/ui/Textarea';
import { EmptyState, ErrorState } from '@/shared/ui/states';

import { useAppointments, useDecideAppointment } from '../api/use-appointments';

/**
 * চেম্বারের দিক — মক্কেলরা যে সময় চেয়েছেন।
 *
 * অপেক্ষমাণ অনুরোধগুলো আলাদা করে উপরে, কারণ সেগুলোই একমাত্র অংশ যেখানে
 * কাজ বাকি। বাকি সব কেবল ইতিহাস — দেখা যায়, কিন্তু মনোযোগ দাবি করে না।
 */
export default function AppointmentsPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { data, isPending, isError, error, refetch } = useAppointments();

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <SkeletonList rows={4} />;

  const all = data.results;
  const pending = all.filter((item) => item.status === 'REQUESTED');
  const decided = all.filter((item) => item.status !== 'REQUESTED');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t('appointments.title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('appointments.subtitle')}</p>
      </header>

      {all.length === 0 ? (
        <EmptyState title={t('appointments.empty.title')} body={t('appointments.empty.body')} />
      ) : (
        <>
          <section className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold text-fg">{t('appointments.pending')}</h2>
              <span className="text-sm text-fg-muted">
                {t('appointments.count', { value: formatNumber(pending.length, locale) })}
              </span>
            </div>

            {pending.length === 0 ? (
              <EmptyState body={t('appointments.empty.body')} />
            ) : (
              <>
                <p className="flex items-start gap-2 text-xs text-fg-subtle">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  {t('appointments.pendingHint')}
                </p>
                <ul className="space-y-3">
                  {pending.map((item) => (
                    <li key={item.id}>
                      <AppointmentCard appointment={item} actionable />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {decided.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-fg">{t('appointments.upcoming')}</h2>
              <ul className="space-y-3">
                {decided.map((item) => (
                  <li key={item.id}>
                    <AppointmentCard appointment={item} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function AppointmentCard({
  appointment,
  actionable = false,
}: {
  appointment: AppointmentItem;
  actionable?: boolean;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const lang = locale === 'en' ? 'EN' : 'BN';
  const [decision, setDecision] = useState<'CONFIRM' | 'DECLINE' | null>(null);

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-2 font-medium text-fg">
            <UserRound className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden />
            {appointment.client_name}
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-subtle">
            <span className="flex items-center gap-1 font-latin">
              <Phone className="h-3 w-3" aria-hidden />
              {appointment.client_mobile}
            </span>
            {appointment.case_id ? (
              <Link
                to={`/cases/${appointment.case_id}`}
                className="font-latin tabular-nums hover:text-primary hover:underline"
              >
                {appointment.case_display_number}
              </Link>
            ) : null}
            <span>{label(APPOINTMENT_MODE_LABELS, appointment.mode, lang)}</span>
          </p>
        </div>

        <Badge tone={APPOINTMENT_STATUS_TONES[appointment.status]}>
          {label(APPOINTMENT_STATUS_LABELS, appointment.status, lang)}
        </Badge>
      </div>

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-fg-muted">{t('appointments.requestedFor')}</dt>
          <dd className="flex items-center gap-1.5 font-medium text-fg">
            <CalendarClock className="h-3.5 w-3.5 text-fg-subtle" aria-hidden />
            <DateText value={appointment.requested_date} style="short" />
            <span className="font-latin">
              {appointment.requested_time ?? t('appointments.anyTime')}
            </span>
          </dd>
        </div>

        {/* চেম্বার অন্য সময় দিলে দুটোই পাশাপাশি — কী চাওয়া হয়েছিল তা হারায় না */}
        {appointment.confirmed_date ? (
          <div>
            <dt className="text-xs text-fg-muted">{t('appointments.confirmedFor')}</dt>
            <dd className="flex items-center gap-1.5 font-medium text-success">
              <DateText value={appointment.confirmed_date} style="short" />
              <span className="font-latin">
                {appointment.confirmed_time ?? t('appointments.anyTime')}
              </span>
            </dd>
          </div>
        ) : null}
      </dl>

      <div>
        <p className="text-xs text-fg-muted">{t('appointments.reason')}</p>
        <p className="text-sm text-fg">{appointment.reason}</p>
      </div>

      {appointment.response_note ? (
        <div className="rounded-md bg-surface-muted/60 px-3 py-2">
          <p className="text-xs text-fg-muted">{t('appointments.responseNote')}</p>
          <p className="text-sm text-fg">{appointment.response_note}</p>
        </div>
      ) : null}

      {appointment.decided_by_name ? (
        <p className="text-xs text-fg-subtle">
          {t('appointments.decidedBy', { name: appointment.decided_by_name })}
        </p>
      ) : null}

      {actionable ? (
        <Can do="appointment.manage">
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => setDecision('DECLINE')}>
              {t('appointments.decline')}
            </Button>
            <Button onClick={() => setDecision('CONFIRM')}>{t('appointments.confirm')}</Button>
          </div>

          {decision ? (
            <DecisionDialog
              appointment={appointment}
              decision={decision}
              onClose={() => setDecision(null)}
            />
          ) : null}
        </Can>
      ) : null}
    </Card>
  );
}

interface DecisionFormValues {
  confirmed_date: string;
  confirmed_time: string;
  response_note: string;
}

function DecisionDialog({
  appointment,
  decision,
  onClose,
}: {
  appointment: AppointmentItem;
  decision: 'CONFIRM' | 'DECLINE';
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const decide = useDecideAppointment(appointment.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DecisionFormValues>({
    resolver: zodResolver(appointmentDecisionSchema),
    defaultValues: { confirmed_date: '', confirmed_time: '', response_note: '' },
  });

  const messageFor = (key: keyof DecisionFormValues): string | undefined =>
    errors[key] ? t(errors[key]?.message ?? 'validation.required') : undefined;

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={decision === 'CONFIRM' ? t('appointments.confirmTitle') : t('appointments.declineTitle')}
      description={
        decision === 'CONFIRM' ? t('appointments.confirmHint') : t('appointments.declineHint')
      }
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit((values) =>
          decide.mutate(
            {
              decision,
              confirmed_date: values.confirmed_date || null,
              confirmed_time: values.confirmed_time || null,
              response_note: values.response_note || null,
            },
            { onSuccess: onClose },
          ),
        )}
      >
        {decision === 'CONFIRM' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('appointments.newDate')}
              type="date"
              latin
              error={messageFor('confirmed_date')}
              {...register('confirmed_date')}
            />
            <Input
              label={t('appointments.newTime')}
              type="time"
              latin
              error={messageFor('confirmed_time')}
              {...register('confirmed_time')}
            />
          </div>
        ) : null}

        <Textarea
          label={t('appointments.note')}
          rows={2}
          error={messageFor('response_note')}
          {...register('response_note')}
        />

        {decide.error ? (
          <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
            {t(isApiError(decide.error) ? decide.error.i18nKey : 'errors.unknown')}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant={decision === 'DECLINE' ? 'danger' : 'primary'}
            loading={decide.isPending}
          >
            {decision === 'CONFIRM' ? t('appointments.confirm') : t('appointments.decline')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
