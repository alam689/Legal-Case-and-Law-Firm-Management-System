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
  },
  ASSISTANT: {
    'case.view_firm': 'all',
    'hearing.entry': 'all',
    'document.upload': 'all',
    'payment.record': 'all',
    'message.client': 'all',
  },
};

export function capabilitiesForRole(role: FirmRole): Capability[] {
  return Object.keys(ROLE_CAPABILITIES[role]) as Capability[];
}

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
