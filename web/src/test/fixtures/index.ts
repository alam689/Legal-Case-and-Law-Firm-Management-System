import type {
  AgendaItem,
  DashboardSummary,
  FirmSummary,
  MeResponse,
  TokenPair,
} from '@caseflow/api-types';
import { capabilitiesForRole } from '@caseflow/domain';

/**
 * Fixture-এ **বাংলা নাম ও দীর্ঘ string** ব্যবহার করা হয়, `Test User` নয় —
 * layout bug (Bangla string ২০–৪০% চওড়া) আগে ধরা পড়ে (docs/05-frontend-plan.md §11)।
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

export const agendaFixture: AgendaItem[] = [
  {
    hearing_id: '9f1c1e2a-0000-4000-8000-000000000101',
    case_id: '9f1c1e2a-0000-4000-8000-000000000201',
    case_display_number: '২৫১/২০২৪',
    case_title: 'মোঃ রহিম উদ্দিন বনাম মোঃ করিম মিয়া ও অন্যান্য',
    time: '10:30',
    court_name: 'যুগ্ম জেলা জজ ২য় আদালত, ঢাকা',
    purpose: 'সাক্ষ্যগ্রহণ',
    stage: 'PLAINTIFF_EVIDENCE',
    client_names: ['মোঃ রহিম উদ্দিন'],
    source: 'LAWYER_ENTERED',
    outcome: null,
    client_attendance_required: true,
  },
  {
    hearing_id: '9f1c1e2a-0000-4000-8000-000000000102',
    case_id: '9f1c1e2a-0000-4000-8000-000000000202',
    case_display_number: '৮৭/২০২৩',
    case_title: 'আবদুল হালিম বনাম সরকার (ভূমি জরিপ ট্রাইব্যুনাল)',
    time: '11:15',
    court_name: 'ভূমি জরিপ ট্রাইব্যুনাল, গাজীপুর',
    purpose: 'রেকর্ড পরীক্ষা',
    stage: 'RECORD_EXAMINATION',
    client_names: ['আবদুল হালিম', 'রোকেয়া বেগম'],
    source: 'CONFIRMED',
    outcome: null,
    client_attendance_required: false,
  },
  {
    hearing_id: '9f1c1e2a-0000-4000-8000-000000000103',
    case_id: '9f1c1e2a-0000-4000-8000-000000000203',
    case_display_number: '১৪/২০২৫',
    case_title: 'শাহানা আক্তার বনাম মোঃ জাহাঙ্গীর আলম',
    time: null,
    court_name: 'পারিবারিক আদালত, ঢাকা',
    purpose: 'যুক্তিতর্ক',
    stage: 'ARGUMENT',
    client_names: ['শাহানা আক্তার'],
    source: 'LAWYER_ENTERED',
    outcome: null,
    client_attendance_required: false,
  },
];

export const dashboardFixture: DashboardSummary = {
  counters: {
    hearings_today: agendaFixture.length,
    hearings_tomorrow: 5,
    hearings_this_week: 18,
    active_cases: 214,
    outstanding_amount: '486500.00',
  },
  agenda: agendaFixture,
  alerts: [
    {
      id: 'stale-1',
      kind: 'STALE_NEXT_DATE',
      severity: 'WARNING',
      message: '৪টি মামলার তারিখ পেরিয়ে গেছে কিন্তু ফলাফল লেখা হয়নি',
      case_id: null,
      count: 4,
    },
  ],
};

export const emptyDashboardFixture: DashboardSummary = {
  counters: {
    hearings_today: 0,
    hearings_tomorrow: 0,
    hearings_this_week: 0,
    active_cases: 0,
    outstanding_amount: '0.00',
  },
  agenda: [],
  alerts: [],
};

export * from './reference';
export * from './store';
export * from './hearings';
export * from './notifications';
export * from './metrics';
