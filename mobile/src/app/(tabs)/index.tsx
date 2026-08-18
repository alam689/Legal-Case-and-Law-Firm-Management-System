import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { QueryBoundary } from '@/features/portal/QueryBoundary';
import { usePortalOverview } from '@/features/portal/api';
import { useSessionStore } from '@/shared/auth/session.store';
import { formatDate, formatMoney, formatNumber, formatRelativeDay } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { spacing } from '@/shared/theme/tokens';
import { AppText, Badge, Button, Card, DetailRow, Divider, Heading, Screen } from '@/shared/ui';

/**
 * মক্কেলের প্রথম পর্দা — একটাই প্রশ্নের উত্তর: **"আমার পরের তারিখ কবে?"**
 *
 * তাই সেটিই সবচেয়ে বড় card-এ, সবার উপরে। বকেয়া বা মামলার সংখ্যা
 * নিচে — জরুরি, কিন্তু আদালতে না গিয়ে হাজিরা ফেল করার মতো জরুরি নয়।
 */
export default function DashboardScreen() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const query = usePortalOverview();

  return (
    <QueryBoundary query={query} chunks={['portal', 'mobile']}>
      {(data) => {
        const hearing = data.next_hearing;
        const name = user?.full_name_bn ?? user?.full_name ?? data.client_name;

        return (
          <Screen>
            <View style={{ gap: spacing.xs }}>
              <Heading>{t('portal.home.greeting', { name })}</Heading>
              <AppText tone="muted">{t('portal.home.subtitle')}</AppText>
            </View>

            <Card>
              <AppText size="sm" tone="muted">
                {t('portal.home.nextHearingTitle')}
              </AppText>

              {hearing ? (
                <>
                  <AppText size="xl" weight="bold">
                    {formatDate(hearing.date, locale, 'full')}
                  </AppText>
                  <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                    <Badge tone="info">{formatRelativeDay(hearing.date, locale)}</Badge>
                    {/* উপস্থিতি লাগবে কি না — মক্কেলের সবচেয়ে ব্যয়বহুল প্রশ্ন */}
                    <Badge tone={hearing.attendance_required ? 'warning' : 'neutral'}>
                      {hearing.attendance_required
                        ? t('portal.home.attendanceRequired')
                        : t('portal.home.attendanceNotRequired')}
                    </Badge>
                  </View>
                  <Divider />
                  <DetailRow label={t('portal.cases.court')} value={hearing.court_name ?? '—'} />
                  <DetailRow
                    label={t('portal.cases.title')}
                    value={hearing.case_display_number}
                  />
                </>
              ) : (
                <>
                  <AppText size="lg" weight="medium">
                    {t('portal.home.noNextHearing')}
                  </AppText>
                  <AppText size="sm" tone="muted">
                    {t('portal.home.noNextHearingHint')}
                  </AppText>
                </>
              )}
            </Card>

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Card>
                <AppText size="sm" tone="muted">
                  {t('portal.home.activeCases')}
                </AppText>
                <AppText size="xl" weight="bold">
                  {formatNumber(data.active_case_count, locale)}
                </AppText>
              </Card>
              <Card>
                <AppText size="sm" tone="muted">
                  {t('portal.home.outstanding')}
                </AppText>
                <AppText size="xl" weight="bold">
                  {formatMoney(data.outstanding_amount, locale, { decimals: false })}
                </AppText>
              </Card>
            </View>

            <Card>
              <AppText size="sm" tone="muted">
                {t('portal.home.lawyerCard')}
              </AppText>
              <AppText size="lg" weight="medium">
                {data.lawyer_name ?? data.firm_name_bn ?? data.firm_name}
              </AppText>
              {data.firm_mobile ? (
                <Button
                  variant="secondary"
                  onPress={() => void Linking.openURL(`tel:${data.firm_mobile}`)}
                >
                  {t('portal.home.callChamber')}
                </Button>
              ) : null}
            </Card>

            <Button variant="ghost" onPress={() => router.push('/(tabs)/cases')}>
              {t('portal.cases.title')}
            </Button>
          </Screen>
        );
      }}
    </QueryBoundary>
  );
}
