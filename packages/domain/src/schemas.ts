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

export type ClientWriteInput = z.input<typeof clientWriteSchema>;
export type CaseWriteInput = z.input<typeof caseWriteSchema>;
export type LoginInput = z.input<typeof loginSchema>;
export type OtpRequestInput = z.input<typeof otpRequestSchema>;
export type OtpVerifyInput = z.input<typeof otpVerifySchema>;
export type HearingOutcomeInput = z.input<typeof hearingOutcomeSchema>;
export type HearingOutcomePayload = z.output<typeof hearingOutcomeSchema>;
