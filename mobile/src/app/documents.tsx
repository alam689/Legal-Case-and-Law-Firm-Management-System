import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { QueryBoundary } from '@/features/portal/QueryBoundary';
import { usePortalDocuments } from '@/features/portal/api';
import { formatDate, formatFileSize } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { spacing } from '@/shared/theme/tokens';
import { AppText, Button, Card, DetailRow, EmptyState, Heading, Screen } from '@/shared/ui';

/**
 * কাগজপত্র — শুধু সেগুলোই যা আইনজীবী দেখাতে দিয়েছেন (rule A4)।
 *
 * `file_url` null মানে স্ক্যান এখনো শেষ হয়নি; তখন বোতামটি থাকেই না।
 * নিষ্ক্রিয় বোতাম দেখালে মক্কেল বারবার চাপতেন আর ভাবতেন অ্যাপ নষ্ট।
 */
export default function DocumentsScreen() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const query = usePortalDocuments();

  return (
    <QueryBoundary query={query} chunks={['portal', 'documents', 'mobile']}>
      {(data) => (
        <Screen>
          <View style={{ gap: spacing.xs }}>
            <Heading>{t('portal.documents.title')}</Heading>
            <AppText tone="muted">{t('portal.documents.subtitle')}</AppText>
          </View>

          {data.results.length === 0 ? (
            <EmptyState body={t('portal.documents.empty')} />
          ) : (
            data.results.map((item) => (
              <Card key={item.id}>
                <AppText weight="medium">{item.title}</AppText>
                <DetailRow
                  label={t('documents.table.uploaded')}
                  value={formatDate(item.uploaded_at, locale, 'short')}
                />
                <DetailRow label={t('documents.table.size')} value={formatFileSize(item.file_size, locale)} />
                {item.case_display_number ? (
                  <DetailRow label={t('portal.cases.title')} value={item.case_display_number} />
                ) : null}

                {item.file_url ? (
                  <Button variant="secondary" onPress={() => void Linking.openURL(item.file_url as string)}>
                    {t('portal.documents.download')}
                  </Button>
                ) : (
                  <AppText size="xs" tone="subtle">
                    {t('portal.documents.pendingScan')}
                  </AppText>
                )}
              </Card>
            ))
          )}
        </Screen>
      )}
    </QueryBoundary>
  );
}
