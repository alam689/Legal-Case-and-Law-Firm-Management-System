import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isApiError } from '@/shared/api/errors';
import { useRequestOtp, useVerifyOtp } from '@/shared/auth/api';
import { useColors } from '@/shared/theme/use-theme';
import { spacing } from '@/shared/theme/tokens';
import { AppText, Button, Heading, Input, Screen } from '@/shared/ui';

/**
 * দ্বিতীয় ধাপ: OTP।
 *
 * সফল হলে `router.replace` — `push` নয়। নাহলে back চাপলে মক্কেল আবার
 * OTP পর্দায় ফিরতেন, অথচ সেই কোডটি ততক্ষণে ব্যবহার হয়ে গেছে।
 */
export default function OtpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{ mobile?: string }>();
  const mobile = params.mobile ?? '';

  const [code, setCode] = useState('');
  const verify = useVerifyOtp();
  const resend = useRequestOtp();

  function submit() {
    if (code.length !== 6) return;
    verify.mutate(
      { mobile, code, purpose: 'LOGIN' },
      { onSuccess: () => router.replace('/(tabs)') },
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen>
        <View style={{ gap: spacing.xs }}>
          <Heading>{t('auth.otpTitle')}</Heading>
          <AppText tone="muted">{t('auth.otpSubtitle', { mobile })}</AppText>
        </View>

        <Input
          label={t('auth.otpCode')}
          value={code}
          onChangeText={(next) => setCode(next.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={6}
          error={code.length > 0 && code.length < 6 ? t('validation.otp.invalid') : undefined}
        />

        {verify.error ? (
          <AppText tone="danger">
            {t(isApiError(verify.error) ? verify.error.i18nKey : 'errors.unknown')}
          </AppText>
        ) : null}

        <Button onPress={submit} loading={verify.isPending} fullWidth>
          {t('auth.otpVerify')}
        </Button>

        <Button
          variant="ghost"
          loading={resend.isPending}
          onPress={() => resend.mutate(mobile)}
        >
          {t('auth.otpResend')}
        </Button>

        <Button variant="ghost" onPress={() => router.back()}>
          {t('auth.changeNumber')}
        </Button>
      </Screen>
    </SafeAreaView>
  );
}
