import type { AppointmentItem, AppointmentRequestRequest } from '@caseflow/api-types';
import {
  APPOINTMENT_MODES,
  APPOINTMENT_MODE_LABELS,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_TONES,
  type AppointmentMode,
  appointmentRequestSchema,
  label,
  optionsOf,
} from '@caseflow/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarClock, CheckCircle2, Info, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { isApiError } from '@/shared/api/errors';
import { todayIso } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { DateText } from '@/shared/ui/DateText';
import { Dialog } from '@/shared/ui/Dialog';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { Textarea } from '@/shared/ui/Textarea';
import { EmptyState, ErrorState } from '@/shared/ui/states';

import {
  useCancelAppointment,
  usePortalAppointments,
  usePortalCaseOptions,
  useRequestAppointment,
} from '../api/use-appointments';

/**
 * মক্কেলের দিক (P1) — "আমি উকিলের সাথে দেখা করতে চাই"।
 *
 * অনুরোধ পাঠানোর পরে কী হবে তা স্পষ্ট করে বলা হয়: চেম্বার নিশ্চিত না
 * করা পর্যন্ত সাক্ষাৎ পাকা নয়। আইনজীবীর দিন আদালতেই কাটে, আর সেই
 * বাস্তবতা লুকিয়ে রাখলে মক্কেল না-জানিয়ে চেম্বারে এসে বসে থাকতেন।
 */
export default function PortalAppointmentsPage() {
  const { t } = useTranslation();
  const [requestOpen, setRequestOpen] = useState(false);
  const { data, isPending, isError, error, refetch } = usePortalAppointments();

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <SkeletonList rows={3} />;

  const appointments = data.results;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">
            {t('appointments.portal.title')}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">{t('appointments.portal.subtitle')}</p>
        </div>
        <Button onClick={() => setRequestOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          {t('appointments.portal.request')}
        </Button>
      </header>

      {appointments.length === 0 ? (
        <EmptyState
          title={t('appointments.portal.empty')}
          body={t('appointments.portal.emptyHint')}
        />
      ) : (
        <ul className="space-y-3">
          {appointments.map((item) => (
            <li key={item.id}>
              <PortalAppointmentCard appointment={item} />
            </li>
          ))}
        </ul>
      )}

      <RequestDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  );
}

function PortalAppointmentCard({ appointment }: { appointment: AppointmentItem }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const lang = locale === 'en' ? 'EN' : 'BN';
  const [cancelOpen, setCancelOpen] = useState(false);
  const cancel = useCancelAppointment();

  const waiting = appointment.status === 'REQUESTED';

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="flex items-center gap-2 font-medium text-fg">
          <CalendarClock className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden />
          <DateText
            value={appointment.confirmed_date ?? appointment.requested_date}
            style="short"
          />
          <span className="font-latin">
            {appointment.confirmed_time ?? appointment.requested_time ?? t('appointments.anyTime')}
          </span>
        </p>
        <Badge tone={APPOINTMENT_STATUS_TONES[appointment.status]}>
          {label(APPOINTMENT_STATUS_LABELS, appointment.status, lang)}
        </Badge>
      </div>

      <p className="text-sm text-fg-muted">
        {label(APPOINTMENT_MODE_LABELS, appointment.mode, lang)}
        {appointment.case_display_number ? (
          <span className="font-latin"> · {appointment.case_display_number}</span>
        ) : null}
      </p>

      <p className="text-sm text-fg">{appointment.reason}</p>

      {/* সময় বদলালে সেটি আলাদা করে বলা — শুধু নতুন তারিখ দেখালে মক্কেল
          পুরনো সময়েই চলে আসতেন */}
      {appointment.status === 'RESCHEDULED' ? (
        <p className="flex items-start gap-2 rounded-md bg-warning-bg px-3 py-2 text-sm text-warning">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t('appointments.portal.changedNotice')}
        </p>
      ) : null}

      {appointment.response_note ? (
        <div className="rounded-md bg-surface-muted/60 px-3 py-2">
          <p className="text-xs text-fg-muted">{t('appointments.responseNote')}</p>
          <p className="text-sm text-fg">{appointment.response_note}</p>
        </div>
      ) : null}

      {waiting ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-fg-subtle">{t('appointments.portal.waiting')}</span>
          <Button variant="ghost" onClick={() => setCancelOpen(true)}>
            {t('appointments.portal.cancel')}
          </Button>
        </div>
      ) : null}

      <Dialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={t('appointments.portal.cancelTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              loading={cancel.isPending}
              onClick={() =>
                cancel.mutate(appointment.id, { onSuccess: () => setCancelOpen(false) })
              }
            >
              {t('appointments.portal.cancel')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">{t('appointments.portal.cancelBody')}</p>
      </Dialog>
    </Card>
  );
}

interface RequestFormValues {
  requested_date: string;
  requested_time: string;
  mode: string;
  reason: string;
  case_id: string;
}

function RequestDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const lang = locale === 'en' ? 'EN' : 'BN';
  const request = useRequestAppointment();
  const cases = usePortalCaseOptions();
  const [done, setDone] = useState(false);

  const modeOptions = useMemo(
    () => optionsOf(APPOINTMENT_MODES, APPOINTMENT_MODE_LABELS, lang),
    [lang],
  );

  const caseOptions = useMemo(
    () =>
      (cases.data?.results ?? []).map((item) => ({
        value: item.id,
        label: `${item.display_number} — ${item.title}`,
      })),
    [cases.data],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(appointmentRequestSchema),
    defaultValues: {
      requested_date: '',
      requested_time: '',
      mode: 'CHAMBER',
      reason: '',
      case_id: '',
    },
  });

  const messageFor = (key: keyof RequestFormValues): string | undefined =>
    errors[key] ? t(errors[key]?.message ?? 'validation.required') : undefined;

  function close() {
    onOpenChange(false);
    setDone(false);
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title={t('appointments.portal.requestTitle')}
    >
      {done ? (
        <div className="space-y-3 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-success" aria-hidden />
          <p className="text-base font-semibold text-fg">{t('appointments.portal.submitted')}</p>
          <p className="text-sm text-fg-muted">{t('appointments.portal.submittedHint')}</p>
          <Button onClick={close}>{t('common.close')}</Button>
        </div>
      ) : (
        <form
          noValidate
          className="space-y-4"
          onSubmit={handleSubmit((values) =>
            request.mutate(
              {
                requested_date: values.requested_date,
                requested_time: values.requested_time || null,
                mode: values.mode as AppointmentMode,
                reason: values.reason,
                case_id: values.case_id || null,
              } satisfies AppointmentRequestRequest,
              { onSuccess: () => setDone(true) },
            ),
          )}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('appointments.fields.date')}
              type="date"
              latin
              // অতীতের দিন চাওয়ার কোনো মানে নেই
              min={todayIso()}
              hint={t('appointments.portal.pastDateHint')}
              error={messageFor('requested_date')}
              {...register('requested_date')}
            />
            <Input
              label={t('appointments.fields.time')}
              type="time"
              latin
              error={messageFor('requested_time')}
              {...register('requested_time')}
            />
            <Select
              label={t('appointments.fields.mode')}
              options={modeOptions}
              error={messageFor('mode')}
              {...register('mode')}
            />
            <Select
              label={t('appointments.fields.case')}
              options={caseOptions}
              placeholder={t('appointments.fields.noCase')}
              error={messageFor('case_id')}
              {...register('case_id')}
            />
          </div>

          <Textarea
            label={t('appointments.fields.reason')}
            rows={3}
            error={messageFor('reason')}
            {...register('reason')}
          />

          {request.error ? (
            <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
              {t(isApiError(request.error) ? request.error.i18nKey : 'errors.unknown')}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={close}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={request.isPending}>
              {t('appointments.portal.request')}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
