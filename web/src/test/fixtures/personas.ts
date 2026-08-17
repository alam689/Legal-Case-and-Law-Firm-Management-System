import type { FirmSummary, MeResponse, TokenPair } from '@caseflow/api-types';
import {
  CLIENT_CAPABILITIES,
  PLATFORM_ADMIN_CAPABILITIES,
  capabilitiesForRole,
} from '@caseflow/domain';

/**
 * পাঁচটি persona-র `GET /auth/me` (docs/01-scope §2)।
 *
 * প্রতিটির capability তালিকা `@caseflow/domain` থেকেই আসে, হাতে লেখা নয় —
 * নাহলে matrix বদলালে fixture চুপচাপ পুরনো থেকে যেত এবং test মিথ্যা
 * আশ্বাস দিত।
 *
 * Firm ও আইনজীবীর fixture এখানেই রাখা (index.ts-এ নয়), নাহলে
 * index → personas → index চক্র তৈরি হত।
 *
 * Fixture-এ **বাংলা নাম ও দীর্ঘ string** ব্যবহার করা হয়, `Test User` নয় —
 * layout bug (Bangla string ২০–৪০% চওড়া) আগে ধরা পড়ে (docs/05 §11)।
 */

export const firmFixture: FirmSummary = {
  id: '9f1c1e2a-0000-4000-8000-000000000001',
  name: 'Alam & Associates',
  name_bn: 'আলম অ্যান্ড অ্যাসোসিয়েটস',
  slug: 'alam-associates',
  firm_type: 'CHAMBER',
  logo_url: null,
  default_language: 'BN',
  sms_quota_monthly: 2000,
  sms_used_current_period: 317,
};

/** P2/P3 — চেম্বার প্রধান তথা প্রধান আইনজীবী। */
export const lawyerFixture: MeResponse = {
  id: '9f1c1e2a-0000-4000-8000-000000000002',
  mobile: '01712345678',
  email: 'advocate@example.com',
  full_name: 'Md Khorshed Alam',
  full_name_bn: 'মোঃ খোরশেদ আলম',
  user_type: 'LAWYER',
  preferred_language: 'BN',
  firm: firmFixture,
  role: 'FIRM_ADMIN',
  capabilities: capabilitiesForRole('FIRM_ADMIN'),
  lawyer_profile: {
    bar_enrollment_no: 'D-12345',
    enrollment_level: 'DISTRICT_COURT',
    // F-AUTH-04 — MVP-তে অধিকাংশ lawyer এই অবস্থাতেই থাকবেন
    verification_status: 'SELF_DECLARED',
    years_of_practice: 12,
    photo_url: null,
  },
};

export const tokenFixture: TokenPair = {
  access: 'access-token-fixture',
  expires_in: 900,
};

/** P3-এর অধীনস্থ — নিজের মামলা দেখেন, staff ব্যবস্থাপনা পান না। */
export const associateFixture: MeResponse = {
  id: '9f1c1e2a-0000-4000-8000-000000000003',
  mobile: '01712345679',
  email: 'associate@example.com',
  full_name: 'Nusrat Jahan',
  full_name_bn: 'নুসরাত জাহান',
  user_type: 'LAWYER',
  preferred_language: 'BN',
  firm: firmFixture,
  role: 'ASSOCIATE',
  capabilities: capabilitiesForRole('ASSOCIATE'),
  lawyer_profile: {
    bar_enrollment_no: 'D-20881',
    enrollment_level: 'DISTRICT_COURT',
    verification_status: 'SELF_DECLARED',
    years_of_practice: 4,
    photo_url: null,
  },
};

/**
 * P4 — চেম্বার সহকারী। তারিখ লেখেন ও নথি তোলেন, কিন্তু চালান বানাতে
 * বা internal note পড়তে পারেন না (docs/01-scope §5-এর matrix)।
 */
export const assistantFixture: MeResponse = {
  id: '9f1c1e2a-0000-4000-8000-000000000004',
  mobile: '01712345680',
  email: null,
  full_name: 'Sumon Chandra Das',
  full_name_bn: 'সুমন চন্দ্র দাস',
  user_type: 'STAFF',
  preferred_language: 'BN',
  firm: firmFixture,
  role: 'ASSISTANT',
  capabilities: capabilitiesForRole('ASSISTANT'),
  lawyer_profile: null,
};

/**
 * P1 — মক্কেল। `firm` ইচ্ছাকৃতভাবে `null`: মক্কেল কোনো চেম্বারের সদস্য
 * নন, তিনি একজন গ্রাহক। কোন চেম্বার তাঁর মামলা দেখছে সেটি portal-এর
 * নিজস্ব endpoint থেকে আসে।
 *
 * মোবাইল নম্বরটি `store.ts`-এর `client-1`-এর সাথে মেলানো, তাই portal-এ
 * সত্যিকারের মামলা, শুনানি ও চালান দেখা যায়।
 */
export const clientUserFixture: MeResponse = {
  id: '9f1c1e2a-0000-4000-8000-000000000005',
  mobile: '01711223344',
  email: null,
  full_name: 'Md Rahim Uddin',
  full_name_bn: 'মোঃ রহিম উদ্দিন',
  user_type: 'CLIENT',
  preferred_language: 'BN',
  firm: null,
  role: null,
  capabilities: [...CLIENT_CAPABILITIES],
  lawyer_profile: null,
};

/** P5 — SaaS operator। কোনো চেম্বারের data দেখেন না, শুধু tenant-এর হিসাব। */
export const platformAdminFixture: MeResponse = {
  id: '9f1c1e2a-0000-4000-8000-000000000006',
  mobile: '01700000000',
  email: 'ops@caseflow.example',
  full_name: 'Platform Operations',
  full_name_bn: 'প্ল্যাটফর্ম পরিচালনা',
  user_type: 'PLATFORM_ADMIN',
  preferred_language: 'BN',
  firm: null,
  role: null,
  capabilities: [...PLATFORM_ADMIN_CAPABILITIES],
  lawyer_profile: null,
};

/** demo.ts-এর persona key → `GET /auth/me`-এর উত্তর। */
export const PERSONA_FIXTURES = {
  advocate: lawyerFixture,
  associate: associateFixture,
  assistant: assistantFixture,
  client: clientUserFixture,
  platformAdmin: platformAdminFixture,
} as const;

export type PersonaKey = keyof typeof PERSONA_FIXTURES;

/** মক্কেল persona-র সাথে যুক্ত `store.ts`-এর মক্কেল রেকর্ড। */
export const DEMO_CLIENT_ID = 'client-1';
