import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isApiError } from '@/shared/api/errors';
import { DEMO_MOBILE, DEMO_OTP, DEMO_PASSWORD } from '@/shared/api/mock/fixtures';
import { useLogin, useRequestOtp } from '@/shared/auth/api';
import { env } from '@/shared/config/env';
import { useLocaleChunk } from '@/shared/i18n/chunks';
import { useLocale } from '@/shared/i18n/use-locale';
import { useColors } from '@/shared/theme/use-theme';
import { spacing } from '@/shared/theme/tokens';
import { AppText, Button, Heading, Input, Screen, Skeleton } from '@/shared/ui';

/** বাংলাদেশি মোবাইল — `01` দিয়ে শুরু, ১১ অঙ্ক (domain-এর নিয়মের সাথে এক)। */
const BD_MOBILE = /^01[3-9]\d{8}$/;

/**
 * প্রথম ধাপ: নম্বর ও পাসওয়ার্ড।
 *
 * এখানে "ভুল পাসওয়ার্ড" আর "এই নম্বর নেই" আলাদা করে বলা হয় না — server-ও
 * একই কোড ফেরায়। কোন নম্বরটি চেম্বারের মক্কেল, সেটি বাইরের কারও জানার
 * কথা নয়।
 */
export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const { locale, toggle } = useLocale();
  const ready = useLocaleChunk('mobile');

  const [mobile, setMobile] = useState(env.apiMocking ? DEMO_MOBILE : '');
  const [password, setPassword] = useState(env.apiMocking ? DEMO_PASSWORD : '');
  const [touched, setTouched] = useState(false);

  const login = useLogin();
  const requestOtp = useRequestOtp();

  const mobileError = touched && !BD_MOBILE.test(mobile) ? t('validation.mobile.invalid') : undefined;
  const busy = login.isPending || requestOtp.isPending;

  function submit() {
    setTouched(true);
    if (!BD_MOBILE.test(mobile) || password.length === 0) return;

    login.mutate(
      { mobile, password },
      {
        onSuccess: () => {
          // পাসওয়ার্ড ঠিক হলেই OTP — দ্বিতীয় ধাপ ছাড়া session তৈরি হয় না
          requestOtp.mutate(mobile, {
            onSuccess: () => router.push({ pathname: '/(auth)/otp', params: { mobile } }),
          });
        },
      },
    );
  }

  const error = login.error ?? requestOtp.error;

  if (!ready) {
    return (
      <Screen>
        <Skeleton rows={4} />
      </Screen>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen>
        <View style={{ gap: spacing.xs }}>
          <Heading>{t('mobile.onboarding.loginTitle')}</Heading>
          <AppText tone="muted">{t('mobile.onboarding.loginSubtitle')}</AppText>
        </View>

        <Input
          label={t('auth.mobile')}
          value={mobile}
          onChangeText={setMobile}
          onBlur={() => setTouched(true)}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          placeholder={t('auth.mobilePlaceholder')}
          error={mobileError}
        />

        <Input
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
        />

        {error ? (
          <AppText tone="danger" accessibilityRole="alert">
            {t(isApiError(error) ? error.i18nKey : 'errors.unknown')}
          </AppText>
        ) : null}

        <Button onPress={submit} loading={busy} fullWidth>
          {t('auth.login')}
        </Button>

        <AppText size="xs" tone="subtle">
          {t('auth.otpNotice')}
        </AppText>

        {/* Backend যুক্ত হলে এই ইঙ্গিতটি নিজে থেকেই হারিয়ে যাবে */}
        {env.apiMocking ? (
          <AppText size="xs" tone="subtle">
            {t('mobile.onboarding.demoNotice', {
              mobile: DEMO_MOBILE,
              password: DEMO_PASSWORD,
              otp: DEMO_OTP,
            })}
          </AppText>
        ) : null}

        <Button variant="ghost" onPress={toggle} accessibilityLabel={t('a11y.languageToggle')}>
          {locale === 'bn' ? t('common.english') : t('common.bangla')}
        </Button>
      </Screen>
    </SafeAreaView>
  );
}
