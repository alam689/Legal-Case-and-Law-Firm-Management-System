import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useLocaleChunk } from '@/shared/i18n/chunks';
import { spacing } from '@/shared/theme/tokens';
import { AppText, Card, Heading, Screen, Skeleton } from '@/shared/ui';

/**
 * "আরও" — যা রোজ লাগে না।
 *
 * Scope §4-এর নয়টি পর্দার মধ্যে চারটি নিচের ট্যাবে; বাকিগুলো এখানে।
 * ভাগটি ব্যবহারের হার ধরে: তারিখ ও বিল মক্কেল সপ্তাহে কয়েকবার দেখেন,
 * খতিয়ান বছরে দু-একবার।
 */
export default function MoreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const ready = useLocaleChunk('mobile', 'portal');

  if (!ready) {
    return (
      <Screen>
        <Skeleton rows={5} />
      </Screen>
    );
  }

  const links = [
    { href: '/documents', title: t('portal.documents.title'), body: t('portal.documents.subtitle') },
    { href: '/notices', title: t('portal.notices.title'), body: t('portal.notices.subtitle') },
    { href: '/properties', title: t('mobile.properties.title'), body: t('mobile.properties.subtitle') },
    { href: '/lawyer', title: t('mobile.lawyer.title'), body: t('mobile.lawyer.subtitle') },
    { href: '/settings', title: t('mobile.settings.title'), body: t('mobile.settings.subtitle') },
  ] as const;

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <Heading>{t('mobile.more.title')}</Heading>
        <AppText tone="muted">{t('mobile.more.subtitle')}</AppText>
      </View>

      {links.map((link) => (
        <Card key={link.href} onPress={() => router.push(link.href)}>
          <AppText size="lg" weight="medium">
            {link.title}
          </AppText>
          <AppText size="sm" tone="muted">
            {link.body}
          </AppText>
        </Card>
      ))}
    </Screen>
  );
}
