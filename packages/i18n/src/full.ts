/**
 * সম্পূর্ণ catalogue — **শুধু type ও test-এর জন্য**।
 *
 * ⚠ App code কখনো এখান থেকে import করবে না। এই file-টি ছুঁলেই bundler
 * দশটি chunk-ই initial bundle-এ টেনে আনে, এবং lazy locale loading-এর
 * পুরো উদ্দেশ্যটাই ব্যর্থ হয় (docs/05-frontend-plan.md §12)।
 *
 * App-এর পথ: `index.ts`-এর `coreResources` (static) + `loadLocaleChunk()`
 * (route-এর সাথে lazy)।
 */

import { bnBilling } from './bn/billing.js';
import { bnCases } from './bn/cases.js';
import { bnClients } from './bn/clients.js';
import { bnCore } from './bn/core.js';
import { bnDashboard } from './bn/dashboard.js';
import { bnDocuments } from './bn/documents.js';
import { bnHearings } from './bn/hearings.js';
import { bnLanding } from './bn/landing.js';
import { bnMetrics } from './bn/metrics.js';
import { bnNotifications } from './bn/notifications.js';
import { bnProperties } from './bn/properties.js';
import { bnSettings } from './bn/settings.js';
import { bnStaff } from './bn/staff.js';
import { bnPortal } from './bn/portal.js';
import { bnAdmin } from './bn/admin.js';
import { bnAppointments } from './bn/appointments.js';

import { enBilling } from './en/billing.js';
import { enCases } from './en/cases.js';
import { enClients } from './en/clients.js';
import { enCore } from './en/core.js';
import { enDashboard } from './en/dashboard.js';
import { enDocuments } from './en/documents.js';
import { enHearings } from './en/hearings.js';
import { enLanding } from './en/landing.js';
import { enMetrics } from './en/metrics.js';
import { enNotifications } from './en/notifications.js';
import { enProperties } from './en/properties.js';
import { enSettings } from './en/settings.js';
import { enStaff } from './en/staff.js';
import { enPortal } from './en/portal.js';
import { enAdmin } from './en/admin.js';
import { enAppointments } from './en/appointments.js';

export const bn = {
  ...bnCore,
  ...bnLanding,
  ...bnDashboard,
  ...bnClients,
  ...bnCases,
  ...bnHearings,
  ...bnDocuments,
  ...bnProperties,
  ...bnNotifications,
  ...bnMetrics,
  ...bnBilling,
  ...bnSettings,
  ...bnStaff,
  ...bnPortal,
  ...bnAdmin,
  ...bnAppointments,
} as const;

export const en = {
  ...enCore,
  ...enLanding,
  ...enDashboard,
  ...enClients,
  ...enCases,
  ...enHearings,
  ...enDocuments,
  ...enProperties,
  ...enNotifications,
  ...enMetrics,
  ...enBilling,
  ...enSettings,
  ...enStaff,
  ...enPortal,
  ...enAdmin,
  ...enAppointments,
};

export type Resources = typeof bn;

export const resources = { bn, en } as const;
