import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { QueryBoundary } from '@/features/portal/QueryBoundary';
import { usePortalCases } from '@/features/portal/api';
import { formatDate } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { spacing } from '@/shared/theme/tokens';
import { AppText, Badge, Card, DetailRow, EmptyState, Heading, Screen } from '@/shared/ui';

/**
 * মামলার তালিকা — প্রতিটি card-এ পরবর্তী তারিখ সবচেয়ে চোখে পড়ে।
 *
 * পর্যায়ের কোড (`PLAINTIFF_EVIDENCE`) কখনো দেখানো হয় না; server অনূদিত
 * `stage_label` পাঠায় (rule A4-এর পাশাপাশি সাধারণ ভদ্রতা)।
 */
export default function CasesScreen() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const router = useRouter();
  const query = usePortalCases();

  return (
    <QueryBoundary query={query} chunks={['portal', 'mobile']}>
      {(data) => (
        <Screen>
          <View style={{ gap: spacing.xs }}>
            <Heading>{t('portal.cases.title')}</Heading>
            <AppText tone="muted">{t('portal.cases.subtitle')}</AppText>
          </View>

          {data.results.length === 0 ? (
            <EmptyState body={t('portal.cases.empty')} />
          ) : (
            data.results.map((item) => (
              <Card key={item.id} onPress={() => router.push(`/cases/${item.id}`)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
                  <AppText weight="medium">{item.display_number}</AppText>
                  <Badge tone={item.status === 'ACTIVE' ? 'info' : 'neutral'}>
                    {item.stage_label ?? '—'}
                  </Badge>
                </View>

                <AppText size="sm" numberOfLines={2}>
                  {item.title}
                </AppText>

                <DetailRow
                  label={t('portal.cases.nextDate')}
                  value={
                    item.next_hearing
                      ? formatDate(item.next_hearing.date, locale, 'short')
                      : t('portal.cases.noDate')
                  }
                />
                <DetailRow label={t('portal.cases.lawyer')} value={item.lawyer_name ?? '—'} />
              </Card>
            ))
          )}
        </Screen>
      )}
    </QueryBoundary>
  );
}
