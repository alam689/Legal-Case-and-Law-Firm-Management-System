import type { AppointmentMode } from '@caseflow/domain';
import {
  APPOINTMENT_MODES,
  APPOINTMENT_MODE_LABELS,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_TONES,
  label,
} from '@caseflow/domain';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QueryBoundary } from '@/features/portal/QueryBoundary';
import {
  useCancelAppointment,
  usePortalAdvocates,
  usePortalAppointments,
  usePortalCases,
  useRequestAppointment,
} from '@/features/portal/api';
import { isApiError } from '@/shared/api/errors';
import { formatDate, formatNumber, todayIso } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { useColors } from '@/shared/theme/use-theme';
import { spacing } from '@/shared/theme/tokens';
import {
  AppText,
  Badge,
  Button,
  Card,
  ChipSelect,
  DetailRow,
  Divider,
  EmptyState,
  Heading,
  Input,
  Screen,
} from '@/shared/ui';

/** `yyyy-MM-dd` — মোবাইলে native date picker native module চায়, তাই লেখা হয়। */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default function AppointmentsScreen() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const lang = locale === 'en' ? 'EN' : 'BN';
  const [requestOpen, setRequestOpen] = useState(false);
  const query = usePortalAppointments();
  const cancel = useCancelAppointment();

  return (
    <QueryBoundary query={query} chunks={['appointments', 'portal', 'mobile']}>
      {(data) => (
        <>
          <Screen>
            <View style={{ gap: spacing.xs }}>
              <Heading>{t('appointments.portal.title')}</Heading>
              <AppText tone="muted">{t('appointments.portal.subtitle')}</AppText>
            </View>

            <Button onPress={() => setRequestOpen(true)} fullWidth>
              {t('appointments.portal.request')}
            </Button>

            {data.results.length === 0 ? (
              <EmptyState
                title={t('appointments.portal.empty')}
                body={t('appointments.portal.emptyHint')}
              />
            ) : (
              data.results.map((item) => (
                <Card key={item.id}>
                  <View
                    style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}
                  >
                    <AppText weight="medium">
                      {formatDate(item.confirmed_date ?? item.requested_date, locale, 'short')}
                      {'  '}
                      {item.confirmed_time ?? item.requested_time ?? t('appointments.anyTime')}
                    </AppText>
                    <Badge tone={APPOINTMENT_STATUS_TONES[item.status]}>
                      {label(APPOINTMENT_STATUS_LABELS, item.status, lang)}
                    </Badge>
                  </View>

                  {/* কার সাথে — একাধিক আইনজীবী থাকলে এটিই মক্কেলের প্রধান প্রশ্ন */}
                  {item.lawyer_name ? (
                    <DetailRow label={t('appointments.forLawyer')} value={item.lawyer_name} />
                  ) : null}
                  <DetailRow
                    label={t('appointments.fields.mode')}
                    value={label(APPOINTMENT_MODE_LABELS, item.mode, lang)}
                  />
                  {item.case_display_number ? (
                    <DetailRow
                      label={t('appointments.fields.case')}
                      value={item.case_display_number}
                    />
                  ) : null}

                  <Divider />
                  <AppText size="sm">{item.reason}</AppText>

                  {item.status === 'RESCHEDULED' ? (
                    <AppText size="sm" tone="warning">
                      {t('appointments.portal.changedNotice')}
                    </AppText>
                  ) : null}

                  {item.response_note ? (
                    <>
                      <AppText size="xs" tone="muted">
                        {t('appointments.responseNote')}
                      </AppText>
                      <AppText size="sm">{item.response_note}</AppText>
                    </>
                  ) : null}

                  {item.status === 'REQUESTED' ? (
                    <View style={{ gap: spacing.sm }}>
                      <AppText size="xs" tone="subtle">
                        {t('appointments.portal.waiting')}
                      </AppText>
                      <Button
                        variant="ghost"
                        loading={cancel.isPending}
                        onPress={() => cancel.mutate(item.id)}
                      >
                        {t('appointments.portal.cancel')}
                      </Button>
                    </View>
                  ) : null}
                </Card>
              ))
            )}
          </Screen>

          <RequestDialog open={requestOpen} onClose={() => setRequestOpen(false)} />
        </>
      )}
    </QueryBoundary>
  );
}

/**
 * সময় চাওয়ার ফর্ম।
 *
 * "কোন আইনজীবীর সাথে" সবার আগে ও **বাধ্যতামূলক** — এক মক্কেল চেম্বারের
 * একাধিক আইনজীবীর কাছে যান (জমির মামলা একজন, পারিবারিক অন্যজন), আর
 * "কারো একজনের" অনুরোধ কার্যত কারোরই নয়।
 */
function RequestDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const lang = locale === 'en' ? 'EN' : 'BN';
  const colors = useColors();

  const advocates = usePortalAdvocates();
  const cases = usePortalCases();
  const request = useRequestAppointment();

  const [lawyerId, setLawyerId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [mode, setMode] = useState<AppointmentMode>('CHAMBER');
  const [caseId, setCaseId] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState(false);

  const advocateList = useMemo(() => advocates.data?.results ?? [], [advocates.data]);
  const onlyAdvocate = advocateList.length === 1 ? advocateList[0] : undefined;

  /**
   * একজনই আইনজীবী হলে তাঁকে বসিয়ে দেওয়া হয় — তবু ঘরটি দেখা যায়।
   * কার কাছে অনুরোধ যাচ্ছে সেটি লুকিয়ে রাখলে পরে "আমি তো ওনাকে বলিনি" হয়।
   */
  useEffect(() => {
    if (onlyAdvocate) setLawyerId(onlyAdvocate.id);
  }, [onlyAdvocate]);

  const advocateOptions = useMemo(
    () =>
      advocateList.map((item) => {
        const name = locale === 'bn' ? (item.name_bn ?? item.name) : item.name;
        return {
          value: item.id,
          label:
            item.case_count > 0
              ? t('appointments.fields.lawyerCases', {
                  name,
                  value: formatNumber(item.case_count, locale),
                })
              : name,
        };
      }),
    [advocateList, locale, t],
  );

  const caseOptions = useMemo(
    () => [
      { value: '', label: t('appointments.fields.noCase') },
      ...(cases.data?.results ?? []).map((item) => ({
        value: item.id,
        label: item.display_number,
      })),
    ],
    [cases.data, t],
  );

  const lawyerError =
    submitted && !lawyerId ? t('validation.appointment.lawyerRequired') : undefined;
  const dateError = submitted && !ISO_DATE.test(date) ? t('validation.date.invalid') : undefined;
  const reasonError =
    submitted && reason.trim().length < 3
      ? t('validation.appointment.reasonRequired')
      : undefined;

  function close() {
    onClose();
    setSubmitted(false);
    setDone(false);
    setDate('');
    setTime('');
    setReason('');
    setCaseId('');
  }

  function submit() {
    setSubmitted(true);
    if (!lawyerId || !ISO_DATE.test(date) || reason.trim().length < 3) return;

    request.mutate(
      {
        requested_date: date,
        requested_time: time || null,
        mode,
        reason: reason.trim(),
        case_id: caseId || null,
        lawyer_id: lawyerId,
      },
      { onSuccess: () => setDone(true) },
    );
  }

  return (
    <Modal visible={open} animationType="slide" onRequestClose={close}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <Screen>
          <Heading>{t('appointments.portal.requestTitle')}</Heading>

          {done ? (
            <>
              <AppText size="lg" weight="medium" tone="success">
                {t('appointments.portal.submitted')}
              </AppText>
              <AppText tone="muted">{t('appointments.portal.submittedHint')}</AppText>
              <Button onPress={close} fullWidth>
                {t('common.close')}
              </Button>
            </>
          ) : (
            <>
              <ChipSelect
                label={t('appointments.fields.lawyer')}
                value={lawyerId}
                options={advocateOptions}
                onChange={setLawyerId}
                error={lawyerError}
                hint={
                  onlyAdvocate
                    ? t('appointments.portal.onlyLawyerHint', {
                        name:
                          locale === 'bn'
                            ? (onlyAdvocate.name_bn ?? onlyAdvocate.name)
                            : onlyAdvocate.name,
                      })
                    : t('appointments.portal.lawyerHint')
                }
              />

              <Input
                label={t('appointments.fields.date')}
                value={date}
                onChangeText={setDate}
                placeholder={todayIso()}
                keyboardType="numbers-and-punctuation"
                hint={t('appointments.portal.pastDateHint')}
                error={dateError}
              />

              <Input
                label={t('appointments.fields.time')}
                value={time}
                onChangeText={setTime}
                placeholder="11:00"
                keyboardType="numbers-and-punctuation"
              />

              <ChipSelect
                label={t('appointments.fields.mode')}
                value={mode}
                options={APPOINTMENT_MODES.map((value) => ({
                  value,
                  label: label(APPOINTMENT_MODE_LABELS, value, lang),
                }))}
                onChange={setMode}
              />

              <ChipSelect
                label={t('appointments.fields.case')}
                value={caseId}
                options={caseOptions}
                onChange={setCaseId}
              />

              <Input
                label={t('appointments.fields.reason')}
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                error={reasonError}
              />

              {request.error ? (
                <AppText tone="danger">
                  {t(isApiError(request.error) ? request.error.i18nKey : 'errors.unknown')}
                </AppText>
              ) : null}

              <Button onPress={submit} loading={request.isPending} fullWidth>
                {t('appointments.portal.request')}
              </Button>
              <Button variant="secondary" onPress={close} fullWidth>
                {t('common.cancel')}
              </Button>
            </>
          )}
        </Screen>
      </SafeAreaView>
    </Modal>
  );
}
