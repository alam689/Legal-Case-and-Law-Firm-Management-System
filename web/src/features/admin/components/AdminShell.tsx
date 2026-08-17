import { Building2, Gauge, LogOut, Scale, Signal } from 'lucide-react';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router-dom';

import { useLogout } from '@/shared/auth/api';
import { useLocale } from '@/shared/i18n/use-locale';
import { cn } from '@/shared/lib/cn';
import { ThemeToggle } from '@/shared/theme/ThemeToggle';
import { Button } from '@/shared/ui/Button';

/**
 * Platform operator-এর খোলস (P5)।
 *
 * চেম্বারের shell থেকে আলাদা রাখার কারণ শুধু নকশা নয় — এখানে চেম্বারের
 * কোনো মেনু নেই, তাই ভুল করেও operator মামলার পর্দায় পৌঁছাবেন না।
 * তিনটি গন্তব্যই যথেষ্ট: কেমন চলছে, কারা আছে, খরচ কোথায়।
 */
const ADMIN_NAV: Array<{ to: string; labelKey: string; icon: ComponentType<{ className?: string }> }> =
  [
    { to: '/admin', labelKey: 'admin.nav.overview', icon: Gauge },
    { to: '/admin/firms', labelKey: 'admin.nav.firms', icon: Building2 },
    { to: '/admin/usage', labelKey: 'admin.nav.usage', icon: Signal },
  ];

export function AdminShell() {
  const { t } = useTranslation();
  const { locale, toggle } = useLocale();
  const logout = useLogout();

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <a href="#main" className="skip-link">
        {t('a11y.skipToContent')}
      </a>

      <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Scale className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-fg">{t('admin.title')}</p>
              <p className="truncate text-xs text-fg-subtle">{t('common.appName')}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" onClick={toggle} aria-label={t('a11y.languageToggle')}>
              {locale === 'bn' ? t('common.english') : t('common.bangla')}
            </Button>
            <ThemeToggle />
            <Button variant="secondary" onClick={() => logout.mutate()} loading={logout.isPending}>
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{t('common.logout')}</span>
            </Button>
          </div>
        </div>

        <nav aria-label={t('a11y.mainNavigation')} className="mx-auto max-w-6xl px-4">
          <ul className="-mb-px flex gap-1">
            {ADMIN_NAV.map(({ to, labelKey, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/admin'}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-tap items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors',
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-fg-muted hover:text-fg',
                    )
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {t(labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="main" className="flex-1 px-4 py-6 md:py-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
