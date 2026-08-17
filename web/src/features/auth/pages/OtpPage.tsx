import { bdMobileSchema, otpCodeSchema } from '@caseflow/domain';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { isApiError } from '@/shared/api/errors';
import { useRequestOtp, useVerifyOtp } from '@/shared/auth/api';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

import { AuthLayout } from '../components/AuthLayout';
import { DemoAccounts } from '../components/DemoAccounts';

const RESEND_SECONDS = 60;

/**
 * F-AUTH-01 — OTP login।
 * Rate limit server-এ (৫/ঘণ্টা/নম্বর); UI-তে resend countdown যাতে
 * ব্যবহারকারী অহেতুক চেষ্টা করে নিজেকে lock না করেন।
 */
export default function OtpPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<'mobile' | 'code'>('mobile');
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  function submitMobile(event: React.FormEvent) {
    event.preventDefault();
    const parsed = bdMobileSchema.safeParse(mobile);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'validation.mobile.invalid');
      return;
    }
    setFieldError(null);
    requestOtp.mutate(
      { mobile: parsed.data },
      {
        onSuccess: () => {
          setMobile(parsed.data);
          setStep('code');
          setSecondsLeft(RESEND_SECONDS);
        },
      },
    );
  }

  function submitCode(event: React.FormEvent) {
    event.preventDefault();
    const parsed = otpCodeSchema.safeParse(code);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'validation.otp.invalid');
      return;
    }
    setFieldError(null);
    verifyOtp.mutate(
      { mobile, code: parsed.data },
      { onSuccess: () => navigate('/dashboard', { replace: true }) },
    );
  }

  const error = requestOtp.error ?? verifyOtp.error;

  return (
    <AuthLayout
      title={t('auth.otpTitle')}
      subtitle={step === 'code' ? t('auth.otpSubtitle', { mobile }) : t('auth.otpNotice')}
      footer={<DemoAccounts />}
    >
      {step === 'mobile' ? (
        <form onSubmit={submitMobile} noValidate className="space-y-4">
          <Input
            label={t('auth.mobile')}
            placeholder={t('auth.mobilePlaceholder')}
            type="tel"
            inputMode="numeric"
            autoComplete="username"
            // eslint-disable-next-line jsx-a11y/no-autofocus -- একক-উদ্দেশ্য auth page
            autoFocus
            latin
            value={mobile}
            onChange={(event) => setMobile(event.target.value)}
            error={fieldError ? t(fieldError) : undefined}
          />
          <Button type="submit" size="lg" className="w-full" loading={requestOtp.isPending}>
            {t('auth.otpSend')}
          </Button>
        </form>
      ) : (
        <form onSubmit={submitCode} noValidate className="space-y-4">
          <Input
            label={t('auth.otpCode')}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            // eslint-disable-next-line jsx-a11y/no-autofocus -- OTP step-এ ব্যবহারকারী কোড লিখতেই এসেছেন
            autoFocus
            latin
            value={code}
            onChange={(event) => setCode(event.target.value)}
            error={fieldError ? t(fieldError) : undefined}
          />
          <Button type="submit" size="lg" className="w-full" loading={verifyOtp.isPending}>
            {t('auth.otpVerify')}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              className="font-medium text-primary underline-offset-4 hover:underline disabled:text-fg-subtle disabled:no-underline"
              disabled={secondsLeft > 0 || requestOtp.isPending}
              onClick={() => {
                requestOtp.mutate({ mobile }, { onSuccess: () => setSecondsLeft(RESEND_SECONDS) });
              }}
            >
              {secondsLeft > 0
                ? t('auth.otpResendIn', { seconds: secondsLeft })
                : t('auth.otpResend')}
            </button>
            <button
              type="button"
              className="text-fg-muted underline-offset-4 hover:underline"
              onClick={() => {
                setStep('mobile');
                setCode('');
                setFieldError(null);
              }}
            >
              {t('auth.changeNumber')}
            </button>
          </div>
        </form>
      )}

      {error ? (
        <p role="alert" className="mt-4 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {isApiError(error) && error.status === 400
            ? t('errors.otpInvalid')
            : t(isApiError(error) ? error.i18nKey : 'errors.unknown')}
        </p>
      ) : null}

      <Link
        to="/login"
        className="mt-4 block text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {t('auth.login')}
      </Link>
    </AuthLayout>
  );
}
