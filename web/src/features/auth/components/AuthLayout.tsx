import { Check, Scale } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useLocale } from '@/shared/i18n/use-locale';
import { ThemeToggle } from '@/shared/theme/ThemeToggle';
import { Button } from '@/shared/ui/Button';

/**
 * Split layout — বাঁয়ে brand panel, ডানে form।
 * Brand panel `lg:` থেকে দেখা যায়; ছোট screen-এ শুধু form (চেম্বারে অনেকে
 * ছোট laptop ব্যবহার করেন — FQ3-এর উত্তর এলে breakpoint পুনর্বিবেচনা হবে)।
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { t } = useTranslation();
  const { locale, toggle } = useLocale();

  const bullets = [
    t('auth.panel.bullets.one'),
    t('auth.panel.bullets.two'),
    t('auth.panel.bullets.three'),
    t('auth.panel.bullets.four'),
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="brand-gradient hidden flex-col justify-between p-10 text-white lg:flex">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
            <Scale className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-semibold">{t('common.appName')}</span>
            <span className="block text-xs text-white/70">{t('landing.footer.tagline')}</span>
          </span>
        </Link>

        <div className="max-w-md space-y-6">
          <h2 className="text-3xl font-semibold leading-snug">{t('auth.panel.title')}</h2>
          <p className="text-sm leading-relaxed text-white/80">{t('auth.panel.subtitle')}</p>
          <ul className="space-y-3">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3 text-sm text-white/90">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-white/70" aria-hidden />
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/60">{t('landing.footer.rights')}</p>
      </aside>

      <main className="flex flex-col bg-bg">
        <div className="flex items-center justify-end gap-1 p-4">
          <Button variant="ghost" onClick={toggle} aria-label={t('a11y.languageToggle')}>
            {locale === 'bn' ? t('common.english') : t('common.bangla')}
          </Button>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-start justify-center px-6 pb-10">
          <div className="w-full max-w-sm space-y-6">
            <div className="lg:hidden">
              <span className="text-lg font-semibold text-primary">{t('common.appName')}</span>
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-fg">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-fg-muted">{subtitle}</p> : null}
            </div>

            {children}

            {footer}

            <p className="text-xs leading-relaxed text-fg-subtle">{t('legal.disclaimer')}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
