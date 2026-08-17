/**
 * Capability layer — docs/01-scope-and-requirements.md §5 (RBAC matrix)।
 *
 * ⚠ FE3: UI কখনো security boundary নয়। প্রকৃত authority হলো server-এর
 * `GET /auth/me` → `capabilities[]`। এখানের ROLE_CAPABILITIES শুধু
 * (ক) MSW mock ও test fixture তৈরির জন্য, এবং
 * (খ) matrix test-এর expected value হিসেবে।
 * Runtime-এ কোনো component role দেখে সিদ্ধান্ত নেবে না — capability দেখে নেবে।
 */

import type { FirmRole } from './enums.js';

export const CAPABILITIES = [
  'case.view_firm',
  'case.create',
  'case.edit',
  'case.internal_notes',
  'hearing.entry',
  'hearing.confirm',
  'document.upload',
  'document.delete',
  'document.visibility',
  'invoice.create',
  'payment.record',
  'report.financial',
  'message.client',
  'staff.manage',
  'firm.settings',
  'audit.view',
  'appointment.manage',

  /**
   * মক্কেলের portal (P1) — কোনো FirmRole-এর সাথে যুক্ত নয়।
   *
   * আলাদা নামস্থান ইচ্ছাকৃত: চেম্বারের `case.view_firm` মানে firm-এর সব
   * মামলা, আর মক্কেলের `portal.case.view` মানে **শুধু তাঁর নিজের** মামলা,
   * তাও কেবল যেটুকু দৃশ্যমান করা হয়েছে (rule A4)। একই নাম ব্যবহার করলে
   * কোনো দিন ভুল করে চেম্বারের পর্দা মক্কেলকে দেখানো হয়ে যেত।
   */
  'portal.case.view',
  'portal.document.view',
  'portal.invoice.view',
  'portal.appointment.request',

  /** Platform admin (P5) — tenant, subscription ও ব্যবহারের হিসাব। */
  'platform.firm.manage',
  'platform.usage.view',
] as const;

export type Capability = (typeof CAPABILITIES)[number];

/**
 * Scope — matrix-এর `○` (own records only) বনাম `✓` (all)।
 * Server object-level check করে; FE এটি শুধু list filter default ও
 * hint copy-এর জন্য ব্যবহার করে।
 */
export type CapabilityScope = 'all' | 'own';

export type RoleCapabilityMap = Readonly<
  Record<FirmRole, Readonly<Partial<Record<Capability, CapabilityScope>>>>
>;

/**
 * docs/01-scope §5-এর matrix হুবহু।
 * MVP-তে শুধু FIRM_ADMIN ব্যবহৃত হবে; বাকি ৪টি role Phase 2-এ activate হবে —
 * কিন্তু matrix এখনই encode করা আছে যাতে Phase 2-তে UI rewrite করতে না হয়।
 */
export const ROLE_CAPABILITIES: RoleCapabilityMap = {
  FIRM_ADMIN: {
    'case.view_firm': 'all',
    'case.create': 'all',
    'case.edit': 'all',
    'case.internal_notes': 'all',
    'hearing.entry': 'all',
    'hearing.confirm': 'all',
    'document.upload': 'all',
    'document.delete': 'all',
    'document.visibility': 'all',
    'invoice.create': 'all',
    'payment.record': 'all',
    'report.financial': 'all',
    'message.client': 'all',
    'staff.manage': 'all',
    'firm.settings': 'all',
    'audit.view': 'all',
    'appointment.manage': 'all',
  },
  SENIOR_ADVOCATE: {
    'case.view_firm': 'all',
    'case.create': 'all',
    'case.edit': 'all',
    'case.internal_notes': 'all',
    'hearing.entry': 'all',
    'hearing.confirm': 'all',
    'document.upload': 'all',
    'document.delete': 'own',
    'document.visibility': 'all',
    'invoice.create': 'all',
    'payment.record': 'all',
    'report.financial': 'own',
    'message.client': 'all',
    'appointment.manage': 'all',
  },
  ASSOCIATE: {
    'case.view_firm': 'all',
    'case.create': 'all',
    'case.edit': 'all',
    'case.internal_notes': 'all',
    'hearing.entry': 'all',
    'hearing.confirm': 'all',
    'document.upload': 'all',
    'document.delete': 'own',
    'document.visibility': 'all',
    'invoice.create': 'all',
    'payment.record': 'all',
    'report.financial': 'own',
    'message.client': 'all',
    'appointment.manage': 'all',
  },
  JUNIOR: {
    'case.view_firm': 'own',
    'case.create': 'own',
    'case.edit': 'own',
    'case.internal_notes': 'own',
    'hearing.entry': 'own',
    'hearing.confirm': 'own',
    'document.upload': 'own',
    'document.visibility': 'own',
    'message.client': 'own',
    'appointment.manage': 'own',
  },
  ASSISTANT: {
    'case.view_firm': 'all',
    'hearing.entry': 'all',
    'document.upload': 'all',
    'payment.record': 'all',
    'message.client': 'all',
    'appointment.manage': 'all',
  },
};

export function capabilitiesForRole(role: FirmRole): Capability[] {
  return Object.keys(ROLE_CAPABILITIES[role]) as Capability[];
}

/**
 * মক্কেল ও platform admin-এর capability — `FirmRole`-এর বাইরে, কারণ
 * তাঁরা কোনো চেম্বারের সদস্য নন। `UserType` থেকেই নির্ধারিত হয়।
 */
export const CLIENT_CAPABILITIES: readonly Capability[] = [
  'portal.case.view',
  'portal.document.view',
  'portal.invoice.view',
  'portal.appointment.request',
];

export const PLATFORM_ADMIN_CAPABILITIES: readonly Capability[] = [
  'platform.firm.manage',
  'platform.usage.view',
];

export function hasCapability(granted: readonly string[], required: Capability): boolean {
  return granted.includes(required);
}

export function hasAnyCapability(
  granted: readonly string[],
  required: readonly Capability[],
): boolean {
  return required.some((cap) => granted.includes(cap));
}

export function hasAllCapabilities(
  granted: readonly string[],
  required: readonly Capability[],
): boolean {
  return required.every((cap) => granted.includes(cap));
}
