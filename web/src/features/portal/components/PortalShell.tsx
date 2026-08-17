import {
  CalendarCheck,
  FileText,
  Gavel,
  Home,
  LogOut,
  MessageSquare,
  Receipt,
  Scale,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router-dom';

import { useLogout } from '@/shared/auth/api';
import { useSessionStore } from '@/shared/auth/session.store';
import { useLocale } from '@/shared/i18n/use-locale';
import { cn } from '@/shared/lib/cn';
import { ThemeToggle } from '@/shared/theme/ThemeToggle';
import { Button } from '@/shared/ui/Button';
import { OfflineBanner } from '@/shared/ui/states';
import { useOnlineStatus } from '@/shared/hooks/use-online-status';

/**
 * মক্কেলের খোলস (P1) — চেম্বারের `AppShell` থেকে ইচ্ছাকৃতভাবে আলাদা।
 *
 * তিনটি সিদ্ধান্ত persona থেকেই এসেছে:
 *
 * ১. **পাঁচটির বেশি গন্তব্য নয়।** মক্কেল ১–৩টি মামলার মানুষ, দিনে দশবার
 *    অ্যাপ খোলেন না। চেম্বারের এগারোটি মেনু তাঁর কাছে গোলকধাঁধা।
 * ২. **নিচে tab bar, পাশে sidebar নয়।** mid-range Android-এ এক হাতে
 *    ব্যবহার করা হয়; বুড়ো আঙুলের নাগালেই সব থাকা দরকার।
 * ৩. **কোনো "তৈরি করুন" বোতাম নেই।** এখানে সব read-only, তাই খোলসেও
 *    কোনো action নেই — যা করা যায় না তার বোতাম দেখানো নিষ্ঠুর।
 */
interface PortalNavItem {
  to: string;
  labelKey: string;
  icon: ComponentType<{ className?: string }>;
}

const PORTAL_NAV: PortalNavItem[] = [
  { to: '/portal', labelKey: 'portal.nav.home', icon: Home },
  { to: '/portal/cases', labelKey: 'portal.nav.cases', icon: Gavel },
  { to: '/portal/appointments', labelKey: 'portal.nav.appointments', icon: CalendarCheck },
  { to: '/portal/documents', labelKey: 'portal.nav.documents', icon: FileText },
  { to: '/portal/invoices', labelKey: 'portal.nav.invoices', icon: Receipt },
  { to: '/portal/notices', labelKey: 'portal.nav.notices', icon: MessageSquare },
];

export function PortalShell() {
  const { t } = useTranslation();
  const { locale, toggle } = useLocale();
  const user = useSessionStore((state) => state.user);
  const logout = useLogout();
  const online = useOnlineStatus();

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <a href="#main" className="skip-link">
        {t('a11y.skipToContent')}
      </a>

      {!online ? <OfflineBanner /> : null}

      <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          <Scale className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-fg">{t('common.appName')}</p>
            <p className="truncate text-xs text-fg-subtle">
              {user?.full_name_bn ?? user?.full_name}
            </p>
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
      </header>

      {/* বড় পর্দায় উপরে অনুভূমিক মেনু — ছোট পর্দায় নিচের tab bar-ই যথেষ্ট */}
      <nav
        aria-label={t('a11y.mainNavigation')}
        className="hidden border-b border-border bg-surface px-4 sm:block"
      >
        <ul className="mx-auto flex max-w-3xl gap-1">
          {PORTAL_NAV.map(({ to, labelKey, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/portal'}
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

      <main id="main" className="flex-1 px-4 py-6 pb-24 sm:pb-8">
        <div className="mx-auto max-w-3xl">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-border px-4 py-4 pb-24 sm:pb-4">
        <p className="mx-auto max-w-3xl text-xs leading-relaxed text-fg-subtle">
          {t('portal.disclaimer')}
        </p>
      </footer>

      {/* ছোট পর্দায় নিচের tab bar — বুড়ো আঙুলের নাগালে */}
      <nav
        aria-label={t('a11y.mainNavigation')}
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface sm:hidden"
      >
        <ul className="flex">
          {PORTAL_NAV.map(({ to, labelKey, icon: Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={to === '/portal'}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-touch flex-col items-center justify-center gap-0.5 px-1 py-2 text-[0.7rem] font-medium',
                    isActive ? 'text-primary' : 'text-fg-muted',
                  )
                }
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span className="truncate">{t(labelKey)}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
