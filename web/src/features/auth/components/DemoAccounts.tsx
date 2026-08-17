import { useTranslation } from 'react-i18next';

import { DEMO_OTP, DEMO_PASSWORD, showDemoCredentials } from '@/shared/config/demo';

/**
 * Mock mode-এ login credential হাতের কাছে রাখে — নাহলে backend আসার আগে
 * কেউ app-এ ঢুকতেই পারে না।
 *
 * ⚠ `showDemoCredentials` = `import.meta.env.DEV && apiMocking`।
 * Production build-এ Vite এই শাখা সম্পূর্ণ বাদ দেয়, তাই credential hint
 * কখনো production bundle-এ যায় না (docs/05 §15)।
 */
export function DemoAccounts() {
  const { t } = useTranslation();

  if (!showDemoCredentials) return null;

  return (
    <div className="rounded-lg border border-dashed border-border bg-surface-muted/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
        {t('auth.demo.title')}
      </p>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-fg-muted">{t('auth.demo.mobileLabel')}</dt>
          <dd className="font-latin text-xs text-fg">{t('auth.demo.mobileValue')}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-fg-muted">{t('auth.demo.passwordLabel')}</dt>
          <dd>
            <code className="rounded bg-surface px-2 py-1 font-latin text-xs text-fg">
              {DEMO_PASSWORD}
            </code>
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-fg-subtle">{t('auth.demo.otpNote', { code: DEMO_OTP })}</p>
      <p className="mt-1 text-xs text-fg-subtle">{t('auth.demo.notice')}</p>
    </div>
  );
}
