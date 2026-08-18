/**
 * Shared validation — web ও mobile-এ একই নিয়ম।
 * Server-ই চূড়ান্ত authority; এগুলো round-trip বাঁচানোর জন্য।
 */

import { z } from 'zod';
import { HEARING_OUTCOMES } from './enums.js';

/** বাংলাদেশি mobile: 01[3-9] + ৮ digit। `+880` / `880` prefix গ্রহণযোগ্য। */
export const BD_MOBILE_RE = /^01[3-9]\d{8}$/;

export function normalizeBdMobile(input: string): string {
  const digits = input.replace(/[^\d]/g, '');
  if (digits.startsWith('880')) return `0${digits.slice(3)}`;
  if (digits.length === 10 && digits.startsWith('1')) return `0${digits}`;
  return digits;
}

export const bdMobileSchema = z
  .string()
  .trim()
  .min(1, 'validation.mobile.required')
  .transform(normalizeBdMobile)
  .refine((v) => BD_MOBILE_RE.test(v), 'validation.mobile.invalid');

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'validation.otp.invalid');

export const passwordSchema = z.string().min(8, 'validation.password.tooShort');

/** F-CLI-04 — `CASE-8F29K` ধরনের invitation code। */
export const invitationCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^CASE-[A-Z0-9]{5,8}$/, 'validation.invitationCode.invalid');

export const caseNumberSchema = z.string().trim().min(1, 'validation.caseNumber.required').max(50);

export const caseYearSchema = z
  .number()
  .int()
  .min(1950, 'validation.caseYear.tooOld')
  .max(new Date().getFullYear() + 1, 'validation.caseYear.tooFuture');

/** ISO `yyyy-MM-dd` — API-তে date সবসময় এই format-এ যায়। */
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.date.invalid');

export const moneySchema = z
  .number()
  .nonnegative('validation.money.negative')
  .max(9_999_999_999.99, 'validation.money.tooLarge');

export const loginSchema = z.object({
  mobile: bdMobileSchema,
  password: passwordSchema,
});

export const otpRequestSchema = z.object({
  mobile: bdMobileSchema,
});

export const otpVerifySchema = z.object({
  mobile: bdMobileSchema,
  code: otpCodeSchema,
});

/**
 * ★ Core loop payload — docs/05-frontend-plan.md §7.1।
 * `notifyClient` default true; terminal outcome-এ `nextDate` optional।
 */
export const hearingOutcomeSchema = z
  .object({
    outcome: z.enum(HEARING_OUTCOMES),
    nextDate: isoDateSchema.nullable().optional(),
    nextPurpose: z.string().trim().max(200).optional(),
    stage: z.string().trim().max(60).optional(),
    note: z.string().trim().max(2000).optional(),
    notifyClient: z.boolean().default(true),
    clientAttendanceRequired: z.boolean().default(false),
    documentsRequired: z.string().trim().max(500).optional(),
  })
  .refine(
    (v) => {
      const terminal = v.outcome === 'SETTLED' || v.outcome === 'DISPOSED';
      return terminal || Boolean(v.nextDate);
    },
    { message: 'validation.hearing.nextDateRequired', path: ['nextDate'] },
  );

/** F-CLI-01 — মক্কেল তৈরি/সম্পাদনা। MVP-তে NID নেওয়া হয় না (NFR N11)। */
export const clientWriteSchema = z.object({
  full_name: z.string().trim().min(2, 'validation.name.tooShort').max(150),
  full_name_bn: z.string().trim().max(150).optional().or(z.literal('')),
  mobile: bdMobileSchema,
  alt_mobile: z
    .string()
    .trim()
    .transform(normalizeBdMobile)
    .refine((v) => v === '' || BD_MOBILE_RE.test(v), 'validation.mobile.invalid')
    .optional()
    .or(z.literal('')),
  email: z.string().trim().email('validation.email.invalid').optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  district: z.string().trim().max(80).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

/** F-CASE-01 — মামলা তৈরি। */
export const caseWriteSchema = z.object({
  case_number: caseNumberSchema,
  case_year: caseYearSchema,
  title: z.string().trim().min(3, 'validation.caseTitle.required').max(300),
  court_id: z.string().trim().min(1, 'validation.court.required'),
  case_category: z.string().trim().min(1, 'validation.required'),
  our_side: z.string().trim().min(1, 'validation.required'),
  status: z.string().trim().min(1, 'validation.required'),
  filing_date: isoDateSchema.optional().or(z.literal('')),
  current_stage: z.string().trim().optional().or(z.literal('')),
  client_ids: z.array(z.string()).default([]),
  subject_matter: z.string().trim().max(2000).optional().or(z.literal('')),
  relief_sought: z.string().trim().max(2000).optional().or(z.literal('')),
  internal_notes: z.string().trim().max(4000).optional().or(z.literal('')),
});

/* ── Sprint 6 — document & property ──────────────────────────────────── */

/**
 * F-DOC-02 — MVP-র আপলোড সীমা ২৫ MB।
 *
 * এটি UI-র সৌজন্য, নিরাপত্তা নয় (FE3) — server একই সীমা আলাদা করে বসায়।
 * আদালতের স্ক্যান করা কাগজ প্রায়ই ৫–১৫ MB হয়, তাই সীমা উদার।
 */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const ACCEPTED_UPLOAD_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export function isAcceptedUploadType(mime: string): boolean {
  return (ACCEPTED_UPLOAD_MIME_TYPES as readonly string[]).includes(mime);
}

export const documentUploadSchema = z.object({
  title: z.string().trim().min(2, 'validation.document.titleRequired').max(200),
  category: z.string().trim().min(1, 'validation.required'),
  case_id: z.string().trim().optional().or(z.literal('')),
  property_id: z.string().trim().optional().or(z.literal('')),
  document_date: isoDateSchema.optional().or(z.literal('')),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  /** Rule A4 — form-এর default সবসময় false, কখনো মনে রাখা মান নয়। */
  client_visible: z.boolean().default(false),
});

/**
 * শতক — DECIMAL(10,3)। ইনপুট string, কারণ float rounding-এ জমির পরিমাণ
 * বদলে যাওয়া এই domain-এ অগ্রহণযোগ্য।
 */
export const areaDecimalSchema = z
  .string()
  .trim()
  .min(1, 'validation.required')
  .regex(/^\d{1,7}(\.\d{1,3})?$/, 'validation.area.invalid');

/** দাগ/খতিয়ান নম্বর বাংলা বা ইংরেজি অঙ্কে, কখনো হরফ-সংখ্যা মিশ্রিত। */
export const landNumberSchema = z.string().trim().min(1, 'validation.required').max(40);

export const propertyWriteSchema = z.object({
  title: z.string().trim().min(3, 'validation.property.titleRequired').max(200),
  mouza: z.string().trim().max(120).optional().or(z.literal('')),
  jl_no: z.string().trim().max(40).optional().or(z.literal('')),
  district: z.string().trim().max(80).optional().or(z.literal('')),
  upazila: z.string().trim().max(80).optional().or(z.literal('')),
  land_class: z.string().trim().optional().or(z.literal('')),
  total_area_decimal: areaDecimalSchema,
  address: z.string().trim().max(500).optional().or(z.literal('')),
  boundaries: z.string().trim().max(500).optional().or(z.literal('')),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
});

export const landRecordWriteSchema = z.object({
  record_type: z.string().trim().min(1, 'validation.required'),
  khatian_no: landNumberSchema,
  dag_no: landNumberSchema,
  mouza: z.string().trim().max(120).optional().or(z.literal('')),
  jl_no: z.string().trim().max(40).optional().or(z.literal('')),
  area_decimal: areaDecimalSchema,
  land_class: z.string().trim().optional().or(z.literal('')),
  /** কমা দিয়ে আলাদা — form-এ একটি ঘর, API-তে array */
  owner_names: z.string().trim().max(500).optional().or(z.literal('')),
  note: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const deedWriteSchema = z.object({
  deed_type: z.string().trim().min(1, 'validation.required'),
  deed_no: z.string().trim().min(1, 'validation.required').max(60),
  deed_date: isoDateSchema.optional().or(z.literal('')),
  registry_office: z.string().trim().max(150).optional().or(z.literal('')),
  grantor: z.string().trim().max(150).optional().or(z.literal('')),
  grantee: z.string().trim().max(150).optional().or(z.literal('')),
  consideration_amount: z
    .string()
    .trim()
    .regex(/^\d{0,12}(\.\d{1,2})?$/, 'validation.money.invalid')
    .optional()
    .or(z.literal('')),
  note: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const mutationWriteSchema = z.object({
  mutation_case_no: z.string().trim().max(60).optional().or(z.literal('')),
  status: z.string().trim().min(1, 'validation.required'),
  applied_on: isoDateSchema.optional().or(z.literal('')),
  decided_on: isoDateSchema.optional().or(z.literal('')),
  new_khatian_no: z.string().trim().max(40).optional().or(z.literal('')),
  office: z.string().trim().max(150).optional().or(z.literal('')),
  note: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const landTaxWriteSchema = z.object({
  /** অর্থবছর `2025-2026` — জুলাই থেকে জুন */
  fiscal_year: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{4}$/, 'validation.fiscalYear.invalid'),
  receipt_no: z.string().trim().max(60).optional().or(z.literal('')),
  paid_on: isoDateSchema.optional().or(z.literal('')),
  amount: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .regex(/^\d{1,12}(\.\d{1,2})?$/, 'validation.money.invalid'),
  office: z.string().trim().max(150).optional().or(z.literal('')),
});

/* ── Sprint 7 — billing & firm settings ──────────────────────────────── */

/**
 * টাকা string হিসেবেই যাচাই ও পাঠানো হয়।
 *
 * `number`-এ নিলে ০.১ + ০.২ ধরনের float ত্রুটি চালানে ঢুকত, আর ফি নিয়ে
 * মক্কেলের সাথে তর্কে এক পয়সার গরমিলও ব্যয়বহুল।
 */
const decimalString = (message: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{1,12}(\.\d{1,2})?$/, message);

export const amountSchema = decimalString('validation.money.invalid');

/** পরিমাণ ভগ্নাংশ হতে পারে — ঘণ্টা (২.৫) বা পাতা (১২)। */
export const quantitySchema = z
  .string()
  .trim()
  .regex(/^\d{1,6}(\.\d{1,2})?$/, 'validation.quantity.invalid');

export const invoiceLineSchema = z.object({
  category: z.string().trim().min(1, 'validation.required'),
  description: z.string().trim().min(1, 'validation.invoice.descriptionRequired').max(300),
  quantity: quantitySchema,
  unit_amount: amountSchema,
});

export const invoiceWriteSchema = z.object({
  case_id: z.string().trim().optional().or(z.literal('')),
  client_id: z.string().trim().min(1, 'validation.invoice.clientRequired'),
  issue_date: isoDateSchema.optional().or(z.literal('')),
  due_date: isoDateSchema.optional().or(z.literal('')),
  discount: amountSchema.optional().or(z.literal('')),
  note: z.string().trim().max(1000).optional().or(z.literal('')),
  /** খালি চালান issue করা যায় না — অন্তত একটি সারি লাগে */
  lines: z.array(invoiceLineSchema).min(1, 'validation.invoice.lineRequired'),
});

export const paymentWriteSchema = z.object({
  amount: amountSchema,
  method: z.string().trim().min(1, 'validation.required'),
  paid_on: isoDateSchema,
  reference: z.string().trim().max(80).optional().or(z.literal('')),
  note: z.string().trim().max(500).optional().or(z.literal('')),
});

export const feeAgreementSchema = z.object({
  fee_type: z.string().trim().min(1, 'validation.required'),
  total_amount: amountSchema,
  hourly_rate: amountSchema.optional().or(z.literal('')),
  note: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const firmSettingsSchema = z.object({
  name: z.string().trim().min(2, 'validation.name.tooShort').max(150),
  name_bn: z.string().trim().max(150).optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  mobile: z
    .string()
    .trim()
    .transform(normalizeBdMobile)
    .refine((v) => v === '' || BD_MOBILE_RE.test(v), 'validation.mobile.invalid')
    .optional()
    .or(z.literal('')),
  email: z.string().trim().email('validation.email.invalid').optional().or(z.literal('')),
  letterhead_note: z.string().trim().max(300).optional().or(z.literal('')),
  /** `INV` — চালান নম্বরের উপসর্গ, বদলালে পরের চালান থেকে কার্যকর */
  invoice_prefix: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .max(10)
    .regex(/^[A-Za-z0-9-]+$/, 'validation.invoicePrefix.invalid'),
  terms: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type InvoiceWriteInput = z.input<typeof invoiceWriteSchema>;
export type InvoiceLineInput = z.input<typeof invoiceLineSchema>;
export type PaymentWriteInput = z.input<typeof paymentWriteSchema>;
export type FeeAgreementInput = z.input<typeof feeAgreementSchema>;
export type FirmSettingsInput = z.input<typeof firmSettingsSchema>;

/* ── P3/P5 — staff ও tenant ──────────────────────────────────────────── */

/** F-FIRM-02 — চেম্বারে সদস্য যোগ। মোবাইল নম্বরই পরিচয়, তাই সেটিই বাধ্যতামূলক। */
export const staffInviteSchema = z.object({
  full_name: z.string().trim().min(2, 'validation.name.tooShort').max(150),
  full_name_bn: z.string().trim().max(150).optional().or(z.literal('')),
  mobile: bdMobileSchema,
  email: z.string().trim().email('validation.email.invalid').optional().or(z.literal('')),
  role: z.string().trim().min(1, 'validation.required'),
});

/** P5 — নতুন চেম্বার onboarding। */
export const tenantCreateSchema = z.object({
  name: z.string().trim().min(2, 'validation.name.tooShort').max(150),
  name_bn: z.string().trim().max(150).optional().or(z.literal('')),
  firm_type: z.string().trim().min(1, 'validation.required'),
  district: z.string().trim().max(80).optional().or(z.literal('')),
  owner_name: z.string().trim().min(2, 'validation.name.tooShort').max(150),
  owner_mobile: bdMobileSchema,
  email: z.string().trim().email('validation.email.invalid').optional().or(z.literal('')),
  plan: z.string().trim().min(1, 'validation.required'),
});

/** মক্কেলের সাক্ষাতের অনুরোধ (P1)। */
export const appointmentRequestSchema = z.object({
  requested_date: isoDateSchema,
  requested_time: z.string().trim().max(20).optional().or(z.literal('')),
  mode: z.string().trim().min(1, 'validation.required'),
  /** কারণ বাধ্যতামূলক — চেম্বার প্রস্তুত হয়ে বসতে পারে, আর সময়ও কম লাগে */
  reason: z.string().trim().min(3, 'validation.appointment.reasonRequired').max(500),
  case_id: z.string().trim().optional().or(z.literal('')),
  /**
   * কোন আইনজীবী — বাধ্যতামূলক।
   *
   * এক চেম্বারে একাধিক আইনজীবী থাকলে "কারো একজনের" অনুরোধ কার্যত কারোরই
   * নয়; কেউ দায়িত্ব নেয় না বলে সেটি পড়ে থাকে। মক্কেলের একজনই আইনজীবী
   * হলে ফর্ম নিজেই তাঁকে বসিয়ে দেয়, তাই বাড়তি ক্লিক লাগে না।
   */
  lawyer_id: z.string().trim().min(1, 'validation.appointment.lawyerRequired'),
});

export const appointmentDecisionSchema = z.object({
  confirmed_date: isoDateSchema.optional().or(z.literal('')),
  confirmed_time: z.string().trim().max(20).optional().or(z.literal('')),
  response_note: z.string().trim().max(500).optional().or(z.literal('')),
});

export type AppointmentRequestInput = z.input<typeof appointmentRequestSchema>;
export type AppointmentDecisionInput = z.input<typeof appointmentDecisionSchema>;

export type StaffInviteInput = z.input<typeof staffInviteSchema>;
export type TenantCreateInput = z.input<typeof tenantCreateSchema>;

export type DocumentUploadInput = z.input<typeof documentUploadSchema>;
export type PropertyWriteInput = z.input<typeof propertyWriteSchema>;
export type LandRecordWriteInput = z.input<typeof landRecordWriteSchema>;
export type DeedWriteInput = z.input<typeof deedWriteSchema>;
export type MutationWriteInput = z.input<typeof mutationWriteSchema>;
export type LandTaxWriteInput = z.input<typeof landTaxWriteSchema>;

export type ClientWriteInput = z.input<typeof clientWriteSchema>;
export type CaseWriteInput = z.input<typeof caseWriteSchema>;
export type LoginInput = z.input<typeof loginSchema>;
export type OtpRequestInput = z.input<typeof otpRequestSchema>;
export type OtpVerifyInput = z.input<typeof otpVerifySchema>;
export type HearingOutcomeInput = z.input<typeof hearingOutcomeSchema>;
export type HearingOutcomePayload = z.output<typeof hearingOutcomeSchema>;
