import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { QueryBoundary } from '@/features/portal/QueryBoundary';
import { usePortalNotices } from '@/features/portal/api';
import { formatDate } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { spacing } from '@/shared/theme/tokens';
import { AppText, Badge, Card, EmptyState, Heading, Screen } from '@/shared/ui';

/** বার্তা — চেম্বার থেকে যা যা পাঠানো হয়েছে, পৌঁছেছে কি না সহ। */
export default function NoticesScreen() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const query = usePortalNotices();

  return (
    <QueryBoundary query={query} chunks={['portal', 'mobile']}>
      {(data) => (
        <Screen>
          <View style={{ gap: spacing.xs }}>
            <Heading>{t('portal.notices.title')}</Heading>
            <AppText tone="muted">{t('portal.notices.subtitle')}</AppText>
          </View>

          {data.results.length === 0 ? (
            <EmptyState body={t('portal.notices.empty')} />
          ) : (
            data.results.map((item) => (
              <Card key={item.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
                  <AppText size="sm" tone="muted">
                    {formatDate(item.sent_at, locale, 'short')}
                  </AppText>
                  <Badge tone={item.delivered ? 'success' : 'neutral'}>
                    {item.delivered ? t('portal.notices.delivered') : t('portal.notices.notDelivered')}
                  </Badge>
                </View>
                <AppText size="sm">{item.body}</AppText>
              </Card>
            ))
          )}
        </Screen>
      )}
    </QueryBoundary>
  );
}
