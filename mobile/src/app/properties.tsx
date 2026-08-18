import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { QueryBoundary } from '@/features/portal/QueryBoundary';
import { usePortalProperties } from '@/features/portal/api';
import { formatArea, formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { spacing } from '@/shared/theme/tokens';
import { AppText, Badge, Card, DetailRow, EmptyState, Heading, Screen } from '@/shared/ui';

/**
 * জমির ভল্ট (scope §4 — My Properties)।
 *
 * খতিয়ান ও দাগ কাঠামোবদ্ধভাবে দেখানো হয়, ছবি হিসেবে নয় — বাংলাদেশে
 * জমির কাগজ হারানো সাধারণ ঘটনা, আর নম্বরগুলো হাতে থাকলে সাব-রেজিস্ট্রি
 * অফিসে গিয়ে নকল তোলা যায়।
 */
export default function PropertiesScreen() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const query = usePortalProperties();

  return (
    <QueryBoundary query={query} chunks={['mobile', 'properties']}>
      {(data) => (
        <Screen>
          <View style={{ gap: spacing.xs }}>
            <Heading>{t('mobile.properties.title')}</Heading>
            <AppText tone="muted">{t('mobile.properties.subtitle')}</AppText>
          </View>

          {data.results.length === 0 ? (
            <EmptyState body={t('mobile.properties.empty')} />
          ) : (
            data.results.map((item) => (
              <Card key={item.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
                  <AppText weight="medium">{item.title}</AppText>
                  {item.case_count > 0 ? (
                    <Badge tone="warning">{t('mobile.properties.inDispute')}</Badge>
                  ) : null}
                </View>

                <DetailRow
                  label={t('mobile.properties.area')}
                  value={t('mobile.properties.areaUnit', {
                    value: formatArea(item.total_area_decimal, locale),
                  })}
                />
                <DetailRow label={t('mobile.properties.mouza')} value={item.mouza ?? '—'} />
                <DetailRow label={t('mobile.properties.jlNo')} value={item.jl_no ?? '—'} />
                <DetailRow
                  label={t('mobile.properties.khatian')}
                  value={item.khatian_numbers.join(', ') || '—'}
                />
                <DetailRow
                  label={t('mobile.properties.dag')}
                  value={item.dag_numbers.join(', ') || '—'}
                />
                <DetailRow label={t('mobile.properties.district')} value={item.district ?? '—'} />
                {item.case_count > 0 ? (
                  <DetailRow
                    label={t('mobile.properties.linkedCases')}
                    value={formatNumber(item.case_count, locale)}
                  />
                ) : null}
              </Card>
            ))
          )}
        </Screen>
      )}
    </QueryBoundary>
  );
}
