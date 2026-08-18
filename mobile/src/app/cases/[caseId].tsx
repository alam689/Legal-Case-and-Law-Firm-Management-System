import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { QueryBoundary } from '@/features/portal/QueryBoundary';
import { usePortalCase } from '@/features/portal/api';
import { formatDate } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { spacing } from '@/shared/theme/tokens';
import {
  AppText,
  Badge,
  Card,
  DetailRow,
  Divider,
  EmptyState,
  Heading,
  Screen,
} from '@/shared/ui';

/**
 * মামলার বিবরণ — ওয়েবের সাত-ট্যাবের পাতা নয়।
 *
 * মক্কেলের জন্য তিনটিই যথেষ্ট, আর সেগুলো ট্যাব নয়, একটির নিচে আরেকটি:
 * ছোট পর্দায় ট্যাব মানে লুকানো তথ্য, আর "কাগজটা কোথায় গেল" প্রশ্নের
 * উত্তর খুঁজতে মক্কেল চেম্বারে ফোন করেন।
 */
export default function CaseDetailScreen() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const params = useLocalSearchParams<{ caseId?: string }>();
  const query = usePortalCase(params.caseId ?? '');

  return (
    <QueryBoundary query={query} chunks={['portal', 'mobile']}>
      {(item) => (
        <Screen>
          <View style={{ gap: spacing.xs }}>
            <Heading>{item.display_number}</Heading>
            <AppText tone="muted">{item.title}</AppText>
          </View>

          <Card>
            <Badge tone="info">{item.stage_label ?? '—'}</Badge>
            <DetailRow label={t('portal.cases.court')} value={item.court_name ?? '—'} />
            <DetailRow label={t('portal.cases.lawyer')} value={item.lawyer_name ?? '—'} />
            <DetailRow
              label={t('portal.cases.filedOn')}
              value={formatDate(item.filing_date, locale, 'short')}
            />
            <DetailRow
              label={t('portal.cases.nextDate')}
              value={
                item.next_hearing
                  ? formatDate(item.next_hearing.date, locale, 'short')
                  : t('portal.cases.noDate')
              }
            />
          </Card>

          <AppText size="lg" weight="medium">
            {t('portal.cases.timeline')}
          </AppText>
          {item.timeline.length === 0 ? (
            <EmptyState body={t('portal.cases.timelineEmpty')} />
          ) : (
            item.timeline.map((entry) => (
              <Card key={entry.id}>
                <AppText size="sm" tone="muted">
                  {formatDate(entry.date, locale, 'short')}
                </AppText>
                <AppText weight="medium">{entry.title}</AppText>
                {entry.description ? <AppText size="sm">{entry.description}</AppText> : null}
              </Card>
            ))
          )}

          <Divider />

          <AppText size="lg" weight="medium">
            {t('portal.cases.hearings')}
          </AppText>
          {item.hearings.map((hearing) => (
            <Card key={hearing.hearing_id}>
              <AppText weight="medium">{formatDate(hearing.date, locale, 'full')}</AppText>
              <DetailRow label={t('portal.cases.court')} value={hearing.court_name ?? '—'} />
              {/* A1 — মক্কেলকেও তারিখের উৎস জানানো হয়, "নিশ্চিত" বলে চালানো হয় না */}
              <Badge tone={hearing.attendance_required ? 'warning' : 'neutral'}>
                {hearing.attendance_required
                  ? t('portal.home.attendanceRequired')
                  : t('portal.home.attendanceNotRequired')}
              </Badge>
            </Card>
          ))}

          <Divider />

          <AppText size="lg" weight="medium">
            {t('portal.cases.documents')}
          </AppText>
          {item.documents.length === 0 ? (
            <EmptyState body={t('portal.documents.empty')} />
          ) : (
            item.documents.map((doc) => (
              <Card key={doc.id}>
                <AppText weight="medium">{doc.title}</AppText>
                <AppText size="sm" tone="muted">
                  {formatDate(doc.uploaded_at, locale, 'short')}
                </AppText>
              </Card>
            ))
          )}
        </Screen>
      )}
    </QueryBoundary>
  );
}
