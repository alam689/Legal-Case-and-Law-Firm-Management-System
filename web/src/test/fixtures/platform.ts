import type {
  PlatformSummary,
  TenantCreateRequest,
  TenantDetail,
  TenantListItem,
  TenantPlanUpdateRequest,
  TenantStatusUpdateRequest,
} from '@caseflow/api-types';
import type { SubscriptionPlan } from '@caseflow/domain';

/**
 * Platform admin-এর tenant store (P5) — Sprint 8।
 *
 * এটি চেম্বারের data নয়, চেম্বার **সম্পর্কে** data। Operator কারও মামলা
 * দেখেন না — দেখেন কে কত ব্যবহার করছে, কে টাকা দিচ্ছে, আর SMS-এর খরচ
 * কোথায় যাচ্ছে। সেই সীমানাটি ইচ্ছাকৃত: support-এর নামে মক্কেলের তথ্য
 * পড়ার সুযোগ থাকা উচিত নয়।
 */

/** প্ল্যান অনুযায়ী মাসিক মূল্য ও SMS কোটা — বিলিং-এর একমাত্র উৎস। */
const PLAN_TERMS: Record<SubscriptionPlan, { price: string; smsQuota: number }> = {
  TRIAL: { price: '0.00', smsQuota: 200 },
  SOLO: { price: '1500.00', smsQuota: 1000 },
  CHAMBER: { price: '4500.00', smsQuota: 2000 },
  FIRM: { price: '12000.00', smsQuota: 6000 },
};

interface TenantRecord extends Omit<TenantListItem, 'mrr' | 'sms_quota_monthly'> {
  email: string | null;
  address: string | null;
  sms_quota_override: number | null;
  usage: TenantDetail['usage'];
}

let sequence = 300;
const nextId = (prefix: string): string => `${prefix}-${++sequence}`;

function usageSeries(base: number): TenantDetail['usage'] {
  return ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08'].map((month, index) => ({
    month,
    active_cases: base + index * 7,
    hearings_recorded: Math.round(base * 0.6) + index * 4,
    sms_segments: Math.round(base * 1.8) + index * 12,
  }));
}

function seedTenants(): TenantRecord[] {
  return [
    {
      id: 'firm-1',
      name: 'Alam & Associates',
      name_bn: 'আলম অ্যান্ড অ্যাসোসিয়েটস',
      slug: 'alam-associates',
      firm_type: 'CHAMBER',
      plan: 'CHAMBER',
      status: 'ACTIVE',
      district: 'ঢাকা',
      owner_name: 'মোঃ খোরশেদ আলম',
      owner_mobile: '01712345678',
      email: 'advocate@example.com',
      address: 'কোর্ট হাউস স্ট্রিট, ঢাকা',
      lawyer_count: 4,
      case_count: 500,
      sms_used_current_period: 317,
      sms_quota_override: null,
      trial_ends_on: null,
      created_at: '2021-04-02T06:00:00Z',
      last_active_at: '2026-08-17T05:10:00Z',
      usage: usageSeries(180),
    },
    {
      id: 'firm-2',
      name: 'Rahman Legal Chamber',
      name_bn: 'রহমান লিগ্যাল চেম্বার',
      slug: 'rahman-legal',
      firm_type: 'FIRM',
      plan: 'FIRM',
      status: 'ACTIVE',
      district: 'চট্টগ্রাম',
      owner_name: 'সৈয়দা নাজনীন রহমান',
      owner_mobile: '01819876543',
      email: 'chamber@rahmanlegal.example',
      address: 'আগ্রাবাদ, চট্টগ্রাম',
      lawyer_count: 11,
      case_count: 1240,
      // কোটার ৮৮% — operator-এর তালিকায় "কোটার কাছাকাছি" হিসেবে উঠবে
      sms_used_current_period: 5280,
      sms_quota_override: null,
      trial_ends_on: null,
      created_at: '2022-09-11T06:00:00Z',
      last_active_at: '2026-08-17T03:40:00Z',
      usage: usageSeries(390),
    },
    {
      id: 'firm-3',
      name: 'Shahjalal Law Associates',
      name_bn: 'শাহজালাল ল অ্যাসোসিয়েটস',
      slug: 'shahjalal-law',
      firm_type: 'CHAMBER',
      plan: 'TRIAL',
      status: 'TRIAL',
      district: 'সিলেট',
      owner_name: 'মোঃ আনোয়ার হোসেন',
      owner_mobile: '01611122233',
      email: null,
      address: 'জিন্দাবাজার, সিলেট',
      lawyer_count: 2,
      case_count: 38,
      sms_used_current_period: 42,
      sms_quota_override: null,
      trial_ends_on: '2026-09-01',
      created_at: '2026-08-02T06:00:00Z',
      last_active_at: '2026-08-16T12:20:00Z',
      usage: usageSeries(12),
    },
    {
      id: 'firm-4',
      name: 'Padma Chamber',
      name_bn: 'পদ্মা চেম্বার',
      slug: 'padma-chamber',
      firm_type: 'SOLO',
      plan: 'SOLO',
      status: 'PAST_DUE',
      district: 'রাজশাহী',
      owner_name: 'কামরুল ইসলাম',
      owner_mobile: '01555566677',
      email: null,
      address: 'সাহেব বাজার, রাজশাহী',
      lawyer_count: 1,
      case_count: 96,
      sms_used_current_period: 640,
      sms_quota_override: null,
      trial_ends_on: null,
      created_at: '2024-03-19T06:00:00Z',
      last_active_at: '2026-07-28T08:00:00Z',
      usage: usageSeries(64),
    },
    {
      id: 'firm-5',
      name: 'Meghna Legal',
      name_bn: 'মেঘনা লিগ্যাল',
      slug: 'meghna-legal',
      firm_type: 'CHAMBER',
      plan: 'CHAMBER',
      status: 'SUSPENDED',
      district: 'খুলনা',
      owner_name: 'রুমানা পারভীন',
      owner_mobile: '01744455566',
      email: null,
      address: 'শিববাড়ি, খুলনা',
      lawyer_count: 3,
      case_count: 141,
      sms_used_current_period: 0,
      sms_quota_override: null,
      trial_ends_on: null,
      created_at: '2023-06-05T06:00:00Z',
      last_active_at: '2026-05-02T10:15:00Z',
      usage: usageSeries(88),
    },
  ];
}

let tenants = seedTenants();

export function resetPlatformData(): void {
  sequence = 300;
  tenants = seedTenants();
}

function quotaFor(record: TenantRecord): number {
  return record.sms_quota_override ?? PLAN_TERMS[record.plan].smsQuota;
}

/** স্থগিত বা বাতিল চেম্বার থেকে কোনো আয় ধরা হয় না। */
function mrrFor(record: TenantRecord): string {
  const earning = record.status === 'ACTIVE' || record.status === 'PAST_DUE';
  return earning ? PLAN_TERMS[record.plan].price : '0.00';
}

function toListItem(record: TenantRecord): TenantListItem {
  const { email: _email, address: _address, usage: _usage, sms_quota_override: _q, ...rest } = record;
  return { ...rest, mrr: mrrFor(record), sms_quota_monthly: quotaFor(record) };
}

export function listTenants(search?: string): TenantListItem[] {
  const query = search?.trim().toLowerCase();
  return tenants
    .filter((record) => {
      if (!query) return true;
      return [record.name, record.name_bn, record.district, record.owner_name, record.owner_mobile]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    })
    .map(toListItem);
}

export function getTenant(id: string): TenantDetail | undefined {
  const record = tenants.find((item) => item.id === id);
  if (!record) return undefined;
  return { ...toListItem(record), email: record.email, address: record.address, usage: record.usage };
}

export function createTenant(body: TenantCreateRequest): TenantDetail {
  const record: TenantRecord = {
    id: nextId('firm'),
    name: body.name,
    name_bn: body.name_bn ?? null,
    slug: body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'chamber',
    firm_type: body.firm_type,
    plan: body.plan,
    // নতুন চেম্বার TRIAL প্ল্যানে হলে অবস্থাও TRIAL — দুটো আলাদা হলে
    // operator-এর তালিকায় বিভ্রান্তি তৈরি হয়
    status: body.plan === 'TRIAL' ? 'TRIAL' : 'ACTIVE',
    district: body.district ?? null,
    owner_name: body.owner_name,
    owner_mobile: body.owner_mobile,
    email: body.email ?? null,
    address: null,
    lawyer_count: 1,
    case_count: 0,
    sms_used_current_period: 0,
    sms_quota_override: null,
    trial_ends_on: body.plan === 'TRIAL' ? '2026-09-16' : null,
    created_at: '2026-08-17T06:00:00Z',
    last_active_at: null,
    usage: [],
  };
  tenants = [record, ...tenants];
  return getTenant(record.id) as TenantDetail;
}

export function updateTenantStatus(
  id: string,
  body: TenantStatusUpdateRequest,
): TenantDetail | undefined {
  const index = tenants.findIndex((item) => item.id === id);
  const existing = tenants[index];
  if (!existing) return undefined;
  tenants[index] = { ...existing, status: body.status };
  return getTenant(id);
}

export function updateTenantPlan(
  id: string,
  body: TenantPlanUpdateRequest,
): TenantDetail | undefined {
  const index = tenants.findIndex((item) => item.id === id);
  const existing = tenants[index];
  if (!existing) return undefined;

  tenants[index] = {
    ...existing,
    plan: body.plan,
    sms_quota_override: body.sms_quota_monthly ?? null,
    // ট্রায়াল থেকে সরালে অবস্থাও সাথে সরে
    status: existing.status === 'TRIAL' && body.plan !== 'TRIAL' ? 'ACTIVE' : existing.status,
    trial_ends_on: body.plan === 'TRIAL' ? existing.trial_ends_on : null,
  };
  return getTenant(id);
}

/** কোটার ৮০% পেরোলে আগেই কথা বলা দরকার — বিল আসার পরে নয়। */
const QUOTA_WARNING_RATIO = 0.8;

export function buildPlatformSummary(): PlatformSummary {
  const smsSegments = tenants.reduce((sum, t) => sum + t.sms_used_current_period, 0);
  // ০.৩৫ টাকা/segment — বাংলাদেশি aggregator-এর প্রচলিত হার
  const smsCost = (smsSegments * 0.35).toFixed(2);

  return {
    firm_count: tenants.length,
    active_firm_count: tenants.filter((t) => t.status === 'ACTIVE').length,
    trial_count: tenants.filter((t) => t.status === 'TRIAL').length,
    past_due_count: tenants.filter((t) => t.status === 'PAST_DUE').length,
    suspended_count: tenants.filter((t) => t.status === 'SUSPENDED').length,
    total_lawyers: tenants.reduce((sum, t) => sum + t.lawyer_count, 0),
    total_cases: tenants.reduce((sum, t) => sum + t.case_count, 0),
    mrr_total: tenants.reduce((sum, t) => sum + Number(mrrFor(t)), 0).toFixed(2),
    sms_segments_this_period: smsSegments,
    sms_cost_this_period: smsCost,
    firms_near_sms_quota: tenants.filter(
      (t) => t.sms_used_current_period >= quotaFor(t) * QUOTA_WARNING_RATIO,
    ).length,
    signups: [
      { month: '2026-04', count: 3 },
      { month: '2026-05', count: 5 },
      { month: '2026-06', count: 4 },
      { month: '2026-07', count: 7 },
      { month: '2026-08', count: 6 },
    ],
  };
}
