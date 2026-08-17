import { useTranslation } from 'react-i18next';

import { DEMO_OTP, DEMO_PASSWORD, DEMO_PERSONAS, showDemoCredentials } from '@/shared/config/demo';

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

      {/*
        পাঁচটি persona-র নম্বর — backend না থাকায় ভূমিকা বদলে দেখার
        একমাত্র উপায় এটাই (docs/01-scope §2)। pilot lawyer-কে দেখানোর
        সময় "মক্কেল কী দেখেন" প্রশ্নের উত্তর এখান থেকেই দেওয়া যায়।
      */}
      <dl className="mt-3 space-y-1.5 text-sm">
        {DEMO_PERSONAS.map((persona) => (
          <div key={persona.key} className="flex items-center justify-between gap-3">
            <dt className="text-fg-muted">{t(`auth.demo.personas.${persona.key}`)}</dt>
            <dd>
              <code className="rounded bg-surface px-2 py-0.5 font-latin text-xs text-fg">
                {persona.mobile}
              </code>
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-2 text-xs text-fg-subtle">{t('auth.demo.personas.note')}</p>

      <dl className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
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
