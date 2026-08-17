import type {
  FirmWorkload,
  StaffInviteRequest,
  StaffMember,
  StaffRoleUpdateRequest,
} from '@caseflow/api-types';

import { activeCaseCount, caseLoadByLawyer, unassignedCaseCount } from './store';

/**
 * চেম্বারের সদস্য (P3) — Sprint 8।
 *
 * মামলার সংখ্যা ও বকেয়া এখানে হাতে লেখা নেই, `store.ts` থেকে গণনা করা হয়।
 * নাহলে মামলা অন্য কারও নামে বসানোর পরেও তালিকায় পুরনো সংখ্যা থেকে যেত,
 * আর "কার উপরে কত চাপ" পর্দাটি মিথ্যা বলত।
 */

interface StaffRecord extends Omit<StaffMember, 'active_case_count' | 'outstanding_amount'> {
  /** এখনো লগইন করেননি এমন আমন্ত্রিত সদস্য */
  invited: boolean;
}

let sequence = 900;
const nextId = (prefix: string): string => `${prefix}-${++sequence}`;

function seedStaff(): StaffRecord[] {
  return [
    {
      id: 'staff-1',
      full_name: 'Md Khorshed Alam',
      full_name_bn: 'মোঃ খোরশেদ আলম',
      mobile: '01712345678',
      email: 'advocate@example.com',
      role: 'FIRM_ADMIN',
      is_active: true,
      invited: false,
      bar_enrollment_no: 'D-12345',
      joined_at: '2021-04-02T06:00:00Z',
      last_active_at: '2026-08-17T05:10:00Z',
      hearings_this_week: 9,
    },
    {
      id: 'staff-2',
      full_name: 'Nusrat Jahan',
      full_name_bn: 'নুসরাত জাহান',
      mobile: '01712345679',
      email: 'associate@example.com',
      role: 'ASSOCIATE',
      is_active: true,
      invited: false,
      bar_enrollment_no: 'D-20881',
      joined_at: '2023-01-15T06:00:00Z',
      last_active_at: '2026-08-16T11:40:00Z',
      hearings_this_week: 6,
    },
    {
      id: 'staff-3',
      full_name: 'Sumon Chandra Das',
      full_name_bn: 'সুমন চন্দ্র দাস',
      mobile: '01712345680',
      email: null,
      role: 'ASSISTANT',
      is_active: true,
      invited: false,
      bar_enrollment_no: null,
      joined_at: '2024-06-01T06:00:00Z',
      last_active_at: '2026-08-17T04:05:00Z',
      hearings_this_week: 0,
    },
    {
      id: 'staff-4',
      full_name: 'Tanvir Hasan',
      full_name_bn: 'তানভীর হাসান',
      mobile: '01812345699',
      email: null,
      role: 'JUNIOR',
      is_active: true,
      // আমন্ত্রণ পেয়েছেন, এখনো ঢোকেননি — এই অবস্থাটিও পর্দায় দেখা দরকার
      invited: true,
      bar_enrollment_no: 'D-31207',
      joined_at: '2026-08-10T06:00:00Z',
      last_active_at: null,
      hearings_this_week: 3,
    },
    {
      id: 'staff-5',
      full_name: 'Farzana Akter',
      full_name_bn: 'ফারজানা আক্তার',
      mobile: '01912345670',
      email: null,
      role: 'JUNIOR',
      is_active: false,
      invited: false,
      bar_enrollment_no: null,
      joined_at: '2022-02-20T06:00:00Z',
      last_active_at: '2025-11-30T09:00:00Z',
      hearings_this_week: 0,
    },
  ];
}

let staff = seedStaff();

export function resetStaffData(): void {
  sequence = 900;
  staff = seedStaff();
}

function toMember(record: StaffRecord): StaffMember {
  const load = caseLoadByLawyer().get(record.id) ?? { cases: 0, due: 0 };
  const { invited: _invited, ...rest } = record;
  return {
    ...rest,
    active_case_count: load.cases,
    outstanding_amount: load.due.toFixed(2),
  };
}

export function listStaff(search?: string): StaffMember[] {
  const query = search?.trim().toLowerCase();
  return staff
    .filter((record) => {
      if (!query) return true;
      return [record.full_name, record.full_name_bn, record.mobile]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    })
    .map(toMember);
}

export function getStaffMember(id: string): StaffMember | undefined {
  const record = staff.find((item) => item.id === id);
  return record ? toMember(record) : undefined;
}

export function inviteStaff(body: StaffInviteRequest): StaffMember {
  const record: StaffRecord = {
    id: nextId('staff'),
    full_name: body.full_name,
    full_name_bn: body.full_name_bn ?? null,
    mobile: body.mobile,
    email: body.email ?? null,
    role: body.role,
    is_active: true,
    invited: true,
    bar_enrollment_no: null,
    joined_at: '2026-08-17T06:00:00Z',
    last_active_at: null,
    hearings_this_week: 0,
  };
  staff = [...staff, record];
  return toMember(record);
}

/**
 * শেষ অ্যাডমিনকে সরানো যায় না।
 *
 * নাহলে চেম্বার প্রধান নিজের ভূমিকা বদলে ফেলে চিরতরে নিজের চেম্বার থেকে
 * তালাবন্ধ হয়ে যেতে পারতেন, আর backend ছাড়া উদ্ধারের কোনো পথ নেই।
 */
export function isLastActiveAdmin(id: string): boolean {
  const admins = staff.filter((item) => item.role === 'FIRM_ADMIN' && item.is_active);
  return admins.length === 1 && admins[0]?.id === id;
}

export function updateStaffRole(
  id: string,
  body: StaffRoleUpdateRequest,
): StaffMember | undefined {
  const index = staff.findIndex((item) => item.id === id);
  const existing = staff[index];
  if (!existing) return undefined;

  staff[index] = { ...existing, role: body.role };
  return toMember(staff[index] as StaffRecord);
}

export function setStaffActive(id: string, isActive: boolean): StaffMember | undefined {
  const index = staff.findIndex((item) => item.id === id);
  const existing = staff[index];
  if (!existing) return undefined;

  staff[index] = { ...existing, is_active: isActive };
  return toMember(staff[index] as StaffRecord);
}

export function buildFirmWorkload(): FirmWorkload {
  return {
    members: staff.filter((record) => record.is_active).map(toMember),
    unassigned_case_count: unassignedCaseCount(),
    total_active_cases: activeCaseCount(),
  };
}

/** মামলা অন্যের নামে বসানোর সময় নাম মেলাতে। */
export function staffNameFor(id: string): string | null {
  const record = staff.find((item) => item.id === id);
  return record ? (record.full_name_bn ?? record.full_name) : null;
}
