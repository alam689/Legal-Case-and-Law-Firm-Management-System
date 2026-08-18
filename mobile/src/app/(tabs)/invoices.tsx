import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { QueryBoundary } from '@/features/portal/QueryBoundary';
import { usePortalInvoices } from '@/features/portal/api';
import { formatDate, formatMoney } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { spacing } from '@/shared/theme/tokens';
import { AppText, Badge, Card, DetailRow, EmptyState, Heading, Screen } from '@/shared/ui';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_TONES, label } from '@caseflow/domain';

/**
 * বিল — "কত বাকি" প্রশ্নটাই আসল, তাই সেটিই বড় হরফে।
 *
 * এখানে কোনো "টাকা দিন" বোতাম নেই: payment gateway Phase 2 (PROJECT_PLAN
 * §Phase 2), আর যে বোতাম কাজ করে না তা দেখানো মক্কেলের সাথে প্রতারণা।
 */
export default function InvoicesScreen() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const lang = locale === 'en' ? 'EN' : 'BN';
  const query = usePortalInvoices();

  return (
    <QueryBoundary query={query} chunks={['portal', 'billing', 'mobile']}>
      {(data) => (
        <Screen>
          <View style={{ gap: spacing.xs }}>
            <Heading>{t('portal.invoices.title')}</Heading>
            <AppText tone="muted">{t('portal.invoices.subtitle')}</AppText>
          </View>

          {/* এই অ্যাপ থেকে টাকা পাঠানো যায় না — সেটি লুকিয়ে না রেখে বলাই ভালো */}
          <AppText size="xs" tone="subtle">
            {t('portal.invoices.payHint')}
          </AppText>

          {data.results.length === 0 ? (
            <EmptyState body={t('portal.invoices.empty')} />
          ) : (
            data.results.map((item) => (
              <Card key={item.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
                  <AppText weight="medium">{item.invoice_number}</AppText>
                  <Badge tone={INVOICE_STATUS_TONES[item.status]}>
                    {label(INVOICE_STATUS_LABELS, item.status, lang)}
                  </Badge>
                </View>

                <AppText size="xxl" weight="bold" tone={Number(item.due_amount) > 0 ? 'danger' : 'success'}>
                  {formatMoney(item.due_amount, locale)}
                </AppText>

                <DetailRow label={t('portal.invoices.paid')} value={formatMoney(item.paid_amount, locale)} />
                <DetailRow label={t('billing.totals.total')} value={formatMoney(item.total, locale)} />
                <DetailRow
                  label={t('billing.fields.dueDate')}
                  value={formatDate(item.due_date, locale, 'short')}
                />
                {item.case_display_number ? (
                  <DetailRow label={t('portal.cases.title')} value={item.case_display_number} />
                ) : null}
              </Card>
            ))
          )}
        </Screen>
      )}
    </QueryBoundary>
  );
}
