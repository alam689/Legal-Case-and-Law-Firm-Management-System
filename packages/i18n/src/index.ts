/**
 * @caseflow/i18n — web ও mobile-এর shared string catalogue।
 * Enum label এখানে নয় — সেগুলো `@caseflow/domain`-এ (docs/05-frontend-plan.md §6.5)।
 *
 * ## কেন catalogue ভাগ করা
 *
 * সব string একসাথে initial bundle-এ গেলে প্রতিটি নতুন feature-এর copy
 * প্রথম load-এর ওজন বাড়ায় — অথচ লগইন পর্দায় খাজনার রসিদের লেখা কেউ
 * পড়ে না। Sprint 6-এ শুধু দুটি namespace যোগ হয়েই initial JS ৬.২ KB
 * বেড়েছিল, আর budget-এর ৯৬% খরচ হয়ে গিয়েছিল (STATUS §7, R3)।
 *
 * তাই এখন: **core static, বাকিটা route-এর সাথে lazy**। App shell, auth,
 * ত্রুটি ও validation-এর লেখা সবসময় লাগে; feature-এর লেখা তখনই আসে যখন
 * সেই route খোলা হয়।
 */

import { bnCore } from './bn/core.js';
import { enCore } from './en/core.js';

export type { Mirror } from './mirror.js';
export type { Resources } from './full.js';

export const LOCALES = ['bn', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** NFR N9 — বাংলা default, English toggle। */
export const DEFAULT_LOCALE: Locale = 'bn';

/**
 * প্রথম load-এ যা লাগে: app shell, auth, theme, ত্রুটি, validation ও
 * আইনি বিজ্ঞপ্তি। এগুলো ছাড়া কোনো পর্দাই সম্পূর্ণ render হয় না।
 */
export const coreResources = { bn: bnCore, en: enCore } as const;

/** Route-এর সাথে যে অংশগুলো lazy আসে। */
export const LOCALE_CHUNKS = [
  'landing',
  'dashboard',
  'clients',
  'cases',
  'hearings',
  'documents',
  'properties',
  'notifications',
  'metrics',
  'billing',
  'settings',
  'staff',
  'portal',
  'admin',
  'appointments',
] as const;
export type LocaleChunk = (typeof LOCALE_CHUNKS)[number];

/**
 * প্রতিটি chunk-এর dynamic importer।
 *
 * Map-টি হাতে লেখা, কোনো template-literal import নয় — bundler কেবল
 * আক্ষরিক path দেখলেই আলাদা chunk তৈরি করতে পারে।
 */
const LOADERS: Record<Locale, Record<LocaleChunk, () => Promise<Record<string, unknown>>>> = {
  bn: {
    landing: () => import('./bn/landing.js').then((m) => m.bnLanding),
    dashboard: () => import('./bn/dashboard.js').then((m) => m.bnDashboard),
    clients: () => import('./bn/clients.js').then((m) => m.bnClients),
    cases: () => import('./bn/cases.js').then((m) => m.bnCases),
    hearings: () => import('./bn/hearings.js').then((m) => m.bnHearings),
    documents: () => import('./bn/documents.js').then((m) => m.bnDocuments),
    properties: () => import('./bn/properties.js').then((m) => m.bnProperties),
    notifications: () => import('./bn/notifications.js').then((m) => m.bnNotifications),
    metrics: () => import('./bn/metrics.js').then((m) => m.bnMetrics),
    billing: () => import('./bn/billing.js').then((m) => m.bnBilling),
    settings: () => import('./bn/settings.js').then((m) => m.bnSettings),
    staff: () => import('./bn/staff.js').then((m) => m.bnStaff),
    portal: () => import('./bn/portal.js').then((m) => m.bnPortal),
    admin: () => import('./bn/admin.js').then((m) => m.bnAdmin),
    appointments: () => import('./bn/appointments.js').then((m) => m.bnAppointments),
  },
  en: {
    landing: () => import('./en/landing.js').then((m) => m.enLanding),
    dashboard: () => import('./en/dashboard.js').then((m) => m.enDashboard),
    clients: () => import('./en/clients.js').then((m) => m.enClients),
    cases: () => import('./en/cases.js').then((m) => m.enCases),
    hearings: () => import('./en/hearings.js').then((m) => m.enHearings),
    documents: () => import('./en/documents.js').then((m) => m.enDocuments),
    properties: () => import('./en/properties.js').then((m) => m.enProperties),
    notifications: () => import('./en/notifications.js').then((m) => m.enNotifications),
    metrics: () => import('./en/metrics.js').then((m) => m.enMetrics),
    billing: () => import('./en/billing.js').then((m) => m.enBilling),
    settings: () => import('./en/settings.js').then((m) => m.enSettings),
    staff: () => import('./en/staff.js').then((m) => m.enStaff),
    portal: () => import('./en/portal.js').then((m) => m.enPortal),
    admin: () => import('./en/admin.js').then((m) => m.enAdmin),
    appointments: () => import('./en/appointments.js').then((m) => m.enAppointments),
  },
};

export function loadLocaleChunk(
  locale: Locale,
  chunk: LocaleChunk,
): Promise<Record<string, unknown>> {
  return LOADERS[locale][chunk]();
}

/**
 * Namespace = catalogue-এর top-level key। parity test এগুলোর উপস্থিতি
 * যাচাই করে, তাই তালিকাটি এক জায়গায় থাকা দরকার।
 */
export const NAMESPACES = [
  'common',
  'nav',
  'auth',
  'landing',
  'theme',
  'dashboard',
  'clients',
  'cases',
  'documents',
  'properties',
  'diary',
  'calendar',
  'notifications',
  'metrics',
  'billing',
  'settings',
  'staff',
  'portal',
  'admin',
  'appointments',
  'state',
  'errors',
  'validation',
  'hearing',
  'a11y',
  'legal',
] as const;
export type Namespace = (typeof NAMESPACES)[number];
