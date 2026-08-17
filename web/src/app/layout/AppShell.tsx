import { FIRM_ROLE_LABELS, label } from '@caseflow/domain';
import {
  Activity,
  BellRing,
  CalendarDays,
  FileText,
  Gavel,
  LayoutDashboard,
  LogOut,
  MapPinned,
  NotebookPen,
  Receipt,
  Scale,
  Users,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { useLogout } from '@/shared/auth/api';
import { useSessionStore } from '@/shared/auth/session.store';
import { pickBilingual } from '@/shared/i18n/bilingual';
import { useLocale } from '@/shared/i18n/use-locale';
import { cn } from '@/shared/lib/cn';
import { ThemeToggle } from '@/shared/theme/ThemeToggle';
import { Button } from '@/shared/ui/Button';
import { VerificationBadge } from '@/shared/ui/CaseStatusChip';
import { DateText } from '@/shared/ui/DateText';
import { OfflineBanner } from '@/shared/ui/states';
import { useOnlineStatus } from '@/shared/hooks/use-online-status';

interface NavItem {
  to: string;
  labelKey: string;
  icon: ComponentType<{ className?: string }>;
}

/** docs/05-frontend-plan.md §5-এর route map, দুটি ভাগে — দৈনন্দিন ও চেম্বার। */
const NAV_SECTIONS: Array<{ titleKey: string; items: NavItem[] }> = [
  {
    titleKey: 'nav.sectionMain',
    items: [
      { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
      { to: '/diary', labelKey: 'nav.diary', icon: NotebookPen },
      { to: '/calendar', labelKey: 'nav.calendar', icon: CalendarDays },
      { to: '/cases', labelKey: 'nav.cases', icon: Gavel },
    ],
  },
  {
    titleKey: 'nav.sectionPractice',
    items: [
      { to: '/clients', labelKey: 'nav.clients', icon: Users },
      { to: '/documents', labelKey: 'nav.documents', icon: FileText },
      { to: '/properties', labelKey: 'nav.properties', icon: MapPinned },
      { to: '/billing/invoices', labelKey: 'nav.billing', icon: Receipt },
      { to: '/notifications', labelKey: 'nav.notifications', icon: BellRing },
      { to: '/metrics', labelKey: 'nav.metrics', icon: Activity },
    ],
  },
];

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('');
}

export function AppShell() {
  const { t } = useTranslation();
  const { locale, language, toggle } = useLocale();
  const user = useSessionStore((state) => state.user);
  const logout = useLogout();
  const online = useOnlineStatus();

  const displayName = pickBilingual(user?.full_name, user?.full_name_bn, locale);
  const firmName = pickBilingual(
    user?.firm?.name,
    user?.firm?.name_bn,
    locale,
    t('common.appName'),
  );

  return (
    <div className="min-h-screen bg-bg">
      <a href="#main" className="skip-link">
        {t('a11y.skipToContent')}
      </a>

      {!online ? <OfflineBanner /> : null}

      <div className="flex min-h-screen">
        <nav
          aria-label={t('a11y.mainNavigation')}
          className="hidden w-64 shrink-0 flex-col border-e border-border bg-surface md:flex"
        >
          <Link to="/" className="flex items-center gap-3 px-5 py-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-fg shadow-sm">
              <Scale className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-fg">{firmName}</span>
              <span className="block truncate text-xs text-fg-subtle">{t('common.appName')}</span>
            </span>
          </Link>

          <div className="flex-1 space-y-6 px-3 py-2">
            {NAV_SECTIONS.map((section) => (
              <div key={section.titleKey}>
                <p className="px-3 pb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-fg-subtle">
                  {t(section.titleKey)}
                </p>
                <ul className="space-y-0.5">
                  {section.items.map(({ to, labelKey, icon: Icon }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        end={to === '/dashboard'}
                        className={({ isActive }) =>
                          cn(
                            'relative flex h-tap items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-primary-muted text-primary'
                              : 'text-fg-muted hover:bg-surface-muted hover:text-fg',
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              aria-hidden
                              className={cn(
                                'absolute inset-y-1.5 -start-3 w-1 rounded-e-full bg-primary transition-opacity',
                                isActive ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            <Icon className="h-4 w-4 shrink-0" aria-hidden />
                            {t(labelKey)}
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="m-3 rounded-lg border border-border bg-surface-muted/60 p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-muted text-sm font-semibold text-primary">
                {initialsOf(displayName)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-fg">{displayName}</span>
                <span className="block truncate text-xs text-fg-subtle">
                  {user?.role ? label(FIRM_ROLE_LABELS, user.role, language) : null}
                </span>
              </span>
            </div>
            {user?.lawyer_profile ? (
              <div className="mt-2">
                <VerificationBadge status={user.lawyer_profile.verification_status} />
              </div>
            ) : null}
          </div>
        </nav>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface/90 px-4 backdrop-blur md:px-6">
            <div className="min-w-0">
              {/*
                আগে এখানে `dashboard.title` ছিল — অর্থাৎ নথি বা ক্যালেন্ডার
                পাতায় বসেও শিরোনাম "ড্যাশবোর্ড" দেখাত। App shell সব route-এ
                থাকে, তাই এখানকার লেখা core-এই থাকতে হবে; আর সব পাতায় সত্যি
                থাকে এমন লেখা হলো app-এর নামটিই।
              */}
              <p className="truncate text-sm font-semibold text-fg">{t('common.appName')}</p>
              <p className="truncate text-xs text-fg-subtle">
                <DateText value={new Date()} style="weekday" />
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" onClick={toggle} aria-label={t('a11y.languageToggle')}>
                {locale === 'bn' ? t('common.english') : t('common.bangla')}
              </Button>
              <ThemeToggle />
              <Button
                variant="secondary"
                onClick={() => logout.mutate()}
                loading={logout.isPending}
              >
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">{t('common.logout')}</span>
              </Button>
            </div>
          </header>

          <main id="main" className="flex-1 px-4 py-6 md:px-6 md:py-8">
            <div className="mx-auto max-w-6xl">
              <Outlet />
            </div>
          </main>

          <footer className="border-t border-border px-4 py-4 md:px-6">
            <p className="mx-auto max-w-6xl text-xs leading-relaxed text-fg-subtle">
              {t('legal.disclaimer')}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
