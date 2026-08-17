import { loginSchema } from '@caseflow/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { isApiError } from '@/shared/api/errors';
import { useLogin } from '@/shared/auth/api';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

import { AuthLayout } from '../components/AuthLayout';
import { DemoAccounts } from '../components/DemoAccounts';

interface LoginFormValues {
  mobile: string;
  password: string;
}

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { mobile: '', password: '' },
  });

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => navigate(redirectTo, { replace: true }),
    });
  });

  const serverError = login.error;

  return (
    <AuthLayout
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      footer={
        <>
          <DemoAccounts />
          <p className="text-center text-sm text-fg-muted">
            {t('auth.noAccount')}{' '}
            <Link to="/otp" className="font-medium text-primary underline-offset-4 hover:underline">
              {t('auth.createAccount')}
            </Link>
          </p>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Input
          label={t('auth.mobile')}
          placeholder={t('auth.mobilePlaceholder')}
          type="tel"
          inputMode="numeric"
          autoComplete="username"
          // eslint-disable-next-line jsx-a11y/no-autofocus -- একক-উদ্দেশ্য auth page; focus কোথায় যাচ্ছে তা অপ্রত্যাশিত নয়
          autoFocus
          latin
          error={errors.mobile ? t(errors.mobile.message ?? 'validation.required') : undefined}
          {...register('mobile')}
        />

        <Input
          label={t('auth.password')}
          type="password"
          autoComplete="current-password"
          error={errors.password ? t(errors.password.message ?? 'validation.required') : undefined}
          {...register('password')}
        />

        {serverError ? (
          <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
            {isApiError(serverError) && serverError.status === 401
              ? t('errors.invalidCredentials')
              : t(isApiError(serverError) ? serverError.i18nKey : 'errors.unknown')}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" loading={login.isPending}>
          {t('auth.login')}
        </Button>

        <p className="text-center text-xs text-fg-subtle">{t('auth.otpNotice')}</p>

        <Link
          to="/otp"
          className="block text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t('auth.loginWithOtp')}
        </Link>
      </form>
    </AuthLayout>
  );
}
