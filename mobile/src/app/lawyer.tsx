import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { QueryBoundary } from '@/features/portal/QueryBoundary';
import { usePortalAdvocates, usePortalOverview } from '@/features/portal/api';
import { formatNumber } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { spacing } from '@/shared/theme/tokens';
import { AppText, Button, Card, DetailRow, EmptyState, Heading, Screen } from '@/shared/ui';

/**
 * আপনার আইনজীবী (scope §4 — My Lawyer)।
 *
 * এক মক্কেলের একাধিক আইনজীবী থাকতে পারেন, তাই তালিকা — একজনের প্রোফাইল নয়।
 * চেম্বারের নম্বরটিই একমাত্র যোগাযোগ: ব্যক্তিগত নম্বর portal-এ যায় না।
 */
export default function LawyerScreen() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const advocates = usePortalAdvocates();
  const overview = usePortalOverview();

  return (
    <QueryBoundary query={advocates} chunks={['mobile', 'portal']}>
      {(data) => (
        <Screen>
          <View style={{ gap: spacing.xs }}>
            <Heading>{t('mobile.lawyer.title')}</Heading>
            <AppText tone="muted">{t('mobile.lawyer.subtitle')}</AppText>
          </View>

          {data.results.length === 0 ? (
            <EmptyState body={t('mobile.lawyer.empty')} />
          ) : (
            data.results.map((item) => (
              <Card key={item.id}>
                <AppText size="lg" weight="medium">
                  {locale === 'bn' ? (item.name_bn ?? item.name) : item.name}
                </AppText>
                {item.case_count > 0 ? (
                  <DetailRow
                    label={t('portal.cases.title')}
                    value={t('mobile.lawyer.caseCount', {
                      value: formatNumber(item.case_count, locale),
                    })}
                  />
                ) : null}
              </Card>
            ))
          )}

          {overview.data ? (
            <Card>
              <AppText size="sm" tone="muted">
                {t('mobile.lawyer.chamber')}
              </AppText>
              <AppText size="lg" weight="medium">
                {overview.data.firm_name_bn ?? overview.data.firm_name}
              </AppText>
              {overview.data.firm_mobile ? (
                <Button
                  variant="secondary"
                  onPress={() => void Linking.openURL(`tel:${overview.data?.firm_mobile}`)}
                >
                  {t('mobile.lawyer.callChamber')}
                </Button>
              ) : null}
            </Card>
          ) : null}
        </Screen>
      )}
    </QueryBoundary>
  );
}
