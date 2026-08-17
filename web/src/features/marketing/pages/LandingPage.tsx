import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BellRing,
  CalendarClock,
  FileLock2,
  MapPinned,
  Receipt,
  Scale,
  Sparkles,
} from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { pickBilingual } from '@/shared/i18n/bilingual';
import { useLocale } from '@/shared/i18n/use-locale';
import { ThemeToggle } from '@/shared/theme/ThemeToggle';
import { Button } from '@/shared/ui/Button';

import { JUDICIAL_INSTITUTIONS } from '../institutions';

/**
 * সর্বজনীন landing page।
 *
 * ⚠ এখানে কোনো adoption metric (ব্যবহারকারী সংখ্যা, সন্তুষ্টি %) দেখানো হয়নি —
 * product এখনো pilot-এর আগে, তাই সেসব সংখ্যা বানানো হতো। পরিবর্তে
 * যাচাইযোগ্য product fact দেখানো হচ্ছে।
 */
/**
 * `calculator` slot — app layer থেকে inject করা হয় (`app/routes.tsx`)।
 * এক feature অন্য feature import করে না (docs/05-frontend-plan.md §4), তাই
 * উত্তরাধিকার ক্যালকুলেটর এখানে prop হিসেবে আসে।
 */
export default function LandingPage({ calculator }: { calculator?: ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-bg text-fg">
      <a href="#main" className="skip-link">
        {t('a11y.skipToContent')}
      </a>

      <SiteHeader />

      <main id="main">
        <Hero />
        <Features />

        {calculator ? (
          <section id="calculator" className="border-b border-border px-6 py-16 md:py-20">
            <div className="mx-auto max-w-6xl">{calculator}</div>
          </section>
        ) : null}

        <Institutions />
      </main>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 text-xs text-fg-subtle">
          <p>{t('common.footer.rights')}</p>
          <p className="max-w-3xl leading-relaxed">{t('legal.disclaimer')}</p>
        </div>
      </footer>
    </div>
  );
}

function SiteHeader() {
  const { t } = useTranslation();
  const { locale, toggle } = useLocale();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-fg">
            <Scale className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-semibold">{t('common.appName')}</span>
            <span className="block text-xs text-fg-subtle">{t('common.footer.tagline')}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label={t('a11y.mainNavigation')}>
          <a
            href="#features"
            className="rounded-md px-3 py-2 text-sm font-medium text-fg-muted hover:bg-surface-muted hover:text-fg"
          >
            {t('landing.nav.features')}
          </a>
          <a
            href="#calculator"
            className="rounded-md px-3 py-2 text-sm font-medium text-fg-muted hover:bg-surface-muted hover:text-fg"
          >
            {t('landing.calculator.navLabel')}
          </a>
          <a
            href="#institutions"
            className="rounded-md px-3 py-2 text-sm font-medium text-fg-muted hover:bg-surface-muted hover:text-fg"
          >
            {t('landing.institutions.heading')}
          </a>
        </nav>

        <div className="flex items-center gap-1">
          <Button variant="ghost" onClick={toggle} aria-label={t('a11y.languageToggle')}>
            {locale === 'bn' ? t('common.english') : t('common.bangla')}
          </Button>
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link to="/login">{t('landing.nav.signIn')}</Link>
          </Button>
          <Button asChild>
            <Link to="/login">{t('landing.nav.getStarted')}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const { t } = useTranslation();

  const stats = [
    { value: t('landing.stats.remindersValue'), label: t('landing.stats.remindersLabel') },
    { value: t('landing.stats.entryValue'), label: t('landing.stats.entryLabel') },
    { value: t('landing.stats.recordValue'), label: t('landing.stats.recordLabel') },
    { value: t('landing.stats.langValue'), label: t('landing.stats.langLabel') },
  ];

  return (
    <section className="hero-wash border-b border-border px-6 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" aria-hidden />
            {t('landing.badge')}
          </p>

          <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
            <span className="block">{t('landing.titleLine1')}</span>
            <span className="block text-primary">{t('landing.titleLine2')}</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-fg-muted">
            {t('landing.subtitle')}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/login">
                {t('landing.ctaPrimary')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a href="#features">{t('landing.ctaSecondary')}</a>
            </Button>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-xl font-bold text-primary">{stat.value}</dt>
                <dd className="mt-1 text-xs leading-snug text-fg-muted">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <HighlightsCard />
      </div>
    </section>
  );
}

/**
 * Hero-র পাশের কার্ড।
 *
 * ⚠ এখানে ইচ্ছাকৃতভাবে কোনো ড্যাশবোর্ডের ঝলক নেই — লগইন ছাড়া প্রথম পাতায়
 * আইনজীবীর ড্যাশবোর্ড (মামলা নম্বর, তারিখ, বকেয়া) দেখানো হবে না, নমুনা
 * হিসেবেও নয়। তার বদলে সর্বজনীন তথ্য ও উত্তরাধিকার ক্যালকুলেটরের পথ।
 */
function HighlightsCard() {
  const { t } = useTranslation();

  const points = [
    {
      icon: CalendarClock,
      title: t('landing.features.coreLoopTitle'),
      body: t('landing.features.coreLoopBody'),
    },
    {
      icon: BadgeCheck,
      title: t('landing.features.provenanceTitle'),
      body: t('landing.features.provenanceBody'),
    },
    {
      icon: BellRing,
      title: t('landing.features.notifyTitle'),
      body: t('landing.features.notifyBody'),
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-lg">
      <h2 className="text-base font-semibold text-fg">{t('landing.highlightsTitle')}</h2>

      <ul className="mt-5 space-y-5">
        {points.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold text-fg">{title}</span>
              <span className="mt-1 block text-sm leading-relaxed text-fg-muted">{body}</span>
            </span>
          </li>
        ))}
      </ul>

      <Button asChild variant="secondary" className="mt-6 w-full">
        <a href="#calculator">
          <Scale className="h-4 w-4" aria-hidden />
          {t('landing.calculator.navLabel')}
        </a>
      </Button>
    </div>
  );
}

function Features() {
  const { t } = useTranslation();

  const items: Array<{
    icon: ComponentType<{ className?: string }>;
    title: string;
    body: string;
  }> = [
    {
      icon: CalendarClock,
      title: t('landing.features.coreLoopTitle'),
      body: t('landing.features.coreLoopBody'),
    },
    {
      icon: BadgeCheck,
      title: t('landing.features.provenanceTitle'),
      body: t('landing.features.provenanceBody'),
    },
    {
      icon: BellRing,
      title: t('landing.features.notifyTitle'),
      body: t('landing.features.notifyBody'),
    },
    {
      icon: MapPinned,
      title: t('landing.features.landTitle'),
      body: t('landing.features.landBody'),
    },
    {
      icon: FileLock2,
      title: t('landing.features.documentTitle'),
      body: t('landing.features.documentBody'),
    },
    {
      icon: Receipt,
      title: t('landing.features.billingTitle'),
      body: t('landing.features.billingBody'),
    },
  ];

  return (
    <section id="features" className="border-b border-border px-6 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="inline-block rounded-full bg-primary-muted px-3 py-1 text-xs font-medium text-primary">
            {t('landing.features.eyebrow')}
          </span>
          <h2 className="mt-4 text-3xl font-bold">{t('landing.features.heading')}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted">
            {t('landing.features.subheading')}
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-lg border border-border bg-surface p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-muted text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * বিচার সংশ্লিষ্ট প্রতিষ্ঠানের বাহ্যিক লিংক।
 * Affiliation নেই — সেটি heading-এর নিচেই স্পষ্ট লেখা (positioning, README)।
 */
function Institutions() {
  const { t } = useTranslation();
  const { locale } = useLocale();

  return (
    <section id="institutions" className="bg-surface-muted px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold">{t('landing.institutions.heading')}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-xs leading-relaxed text-fg-subtle">
          {t('landing.institutions.note')}
        </p>

        <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {JUDICIAL_INSTITUTIONS.map((institution) => (
            <li key={institution.url}>
              <a
                href={institution.url}
                target="_blank"
                rel="noreferrer noopener"
                className="group flex items-center gap-2 rounded-md px-2 py-2 text-sm text-fg-muted hover:bg-surface hover:text-primary"
              >
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-primary/70 group-hover:text-primary"
                  aria-hidden
                />
                <span>{pickBilingual(institution.nameEn, institution.nameBn, locale)}</span>
                <span className="sr-only">{t('landing.institutions.newTab')}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
