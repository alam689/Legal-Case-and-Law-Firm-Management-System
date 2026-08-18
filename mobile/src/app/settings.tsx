import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useLogout } from '@/shared/auth/api';
import { useSessionStore } from '@/shared/auth/session.store';
import { useLocaleChunk } from '@/shared/i18n/chunks';
import { useLocale } from '@/shared/i18n/use-locale';
import type { ThemeMode } from '@/shared/theme/context';
import { useTheme } from '@/shared/theme/use-theme';
import { spacing } from '@/shared/theme/tokens';
import {
  AppText,
  Button,
  Card,
  ChipSelect,
  DetailRow,
  Divider,
  Heading,
  Screen,
  Skeleton,
} from '@/shared/ui';

/**
 * সেটিংস — ভাষা, থিম, নিজের তথ্য, লগ আউট।
 *
 * নোটিফিকেশন পছন্দ ইচ্ছাকৃতভাবে নেই: push registration Sprint 3-এর কাজ
 * (docs/04 roadmap), আর যে সুইচ কিছুই বদলায় না সেটি রাখা মিথ্যা বলা।
 */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const { mode, setMode } = useTheme();
  const user = useSessionStore((state) => state.user);
  const logout = useLogout();
  const ready = useLocaleChunk('mobile');

  if (!ready) {
    return (
      <Screen>
        <Skeleton rows={4} />
      </Screen>
    );
  }

  const themeOptions: ReadonlyArray<{ value: ThemeMode; label: string }> = [
    { value: 'system', label: t('mobile.settings.themeSystem') },
    { value: 'light', label: t('mobile.settings.themeLight') },
    { value: 'dark', label: t('mobile.settings.themeDark') },
  ];

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <Heading>{t('mobile.settings.title')}</Heading>
        <AppText tone="muted">{t('mobile.settings.subtitle')}</AppText>
      </View>

      <Card>
        <ChipSelect
          label={t('mobile.settings.language')}
          value={locale}
          options={[
            { value: 'bn' as const, label: t('common.bangla') },
            { value: 'en' as const, label: t('common.english') },
          ]}
          onChange={setLocale}
        />
      </Card>

      <Card>
        <ChipSelect
          label={t('mobile.settings.theme')}
          value={mode}
          options={themeOptions}
          onChange={setMode}
        />
      </Card>

      <Card>
        <AppText size="sm" tone="muted">
          {t('mobile.settings.account')}
        </AppText>
        <DetailRow
          label={t('auth.mobile')}
          value={user?.mobile ?? '—'}
        />
        <DetailRow
          label={t('mobile.settings.name')}
          value={user?.full_name_bn ?? user?.full_name ?? '—'}
        />
      </Card>

      <Divider />

      <AppText size="xs" tone="subtle">
        {t('mobile.settings.version', {
          value: Constants.expoConfig?.version ?? '0.1.0',
        })}
      </AppText>

      <AppText size="xs" tone="subtle">
        {t('legal.portalDisclaimer')}
      </AppText>

      <Button variant="danger" loading={logout.isPending} onPress={() => logout.mutate()} fullWidth>
        {t('common.logout')}
      </Button>
    </Screen>
  );
}
