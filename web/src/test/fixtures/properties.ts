import type {
  CaseListItem,
  DeedItem,
  DeedWriteRequest,
  LandRecordItem,
  LandRecordWriteRequest,
  LandTaxItem,
  LandTaxWriteRequest,
  MutationItem,
  MutationWriteRequest,
  PropertyDetail,
  PropertyListItem,
  PropertyWriteRequest,
} from '@caseflow/api-types';

import { documentsForProperty } from './documents';
import { listCases } from './store';

/**
 * Property mock store — Sprint 6।
 *
 * বাংলাদেশে জমির পরিচয় একটিমাত্র নম্বরে হয় না — একই জমির সি.এস., এস.এ.,
 * আর.এস., বি.এস. জরিপে আলাদা খতিয়ান ও দাগ থাকে, আর মামলার তর্কটাই প্রায়ই
 * সেই অমিল নিয়ে। তাই `LandRecordItem` একটি তালিকা, একটি ঘর নয়।
 */

interface PropertyRecord extends Omit<PropertyListItem, 'dag_numbers' | 'khatian_numbers'> {
  description: string | null;
  address: string | null;
  boundaries: string | null;
  created_at: string;
  land_records: LandRecordItem[];
  deeds: DeedItem[];
  mutations: MutationItem[];
  taxes: LandTaxItem[];
  case_ids: string[];
}

let sequence = 700;
const nextId = (prefix: string): string => `${prefix}-${++sequence}`;

function seedProperties(): PropertyRecord[] {
  return [
    {
      id: 'property-1',
      title: 'শ্রীপুর মৌজার ৩৩ শতক নাল জমি',
      mouza: 'শ্রীপুর',
      jl_no: '৮৭',
      district: 'গাজীপুর',
      upazila: 'শ্রীপুর',
      land_class: 'NAL',
      total_area_decimal: '33.000',
      case_count: 1,
      document_count: 0,
      description:
        'বি.এস. রেকর্ডে মালিকের নামের বানান ভিন্ন — এই অমিল সংশোধনই মামলার মূল দাবি।',
      address: 'গ্রাম: উত্তর শ্রীপুর, ডাকঘর: শ্রীপুর, গাজীপুর',
      boundaries: 'উত্তরে সড়ক, দক্ষিণে আবদুল মজিদের জমি, পূর্বে খাল, পশ্চিমে দাগ ১১২৫',
      created_at: '2023-07-29T06:00:00Z',
      case_ids: ['case-2'],
      land_records: [
        {
          id: 'lr-1',
          record_type: 'CS',
          khatian_no: '১৪২',
          dag_no: '৫৬৭',
          mouza: 'শ্রীপুর',
          jl_no: '৮৭',
          area_decimal: '33.000',
          land_class: 'NAL',
          owner_names: ['মৃত ইদ্রিস আলী'],
          note: null,
        },
        {
          id: 'lr-2',
          record_type: 'SA',
          khatian_no: '২১৯',
          dag_no: '৮৯১',
          mouza: 'শ্রীপুর',
          jl_no: '৮৭',
          area_decimal: '33.000',
          land_class: 'NAL',
          owner_names: ['আবদুল হালিম', 'রোকেয়া বেগম'],
          note: null,
        },
        {
          id: 'lr-3',
          record_type: 'RS',
          khatian_no: '৪০৩',
          dag_no: '১১২৪',
          mouza: 'শ্রীপুর',
          jl_no: '৮৭',
          area_decimal: '33.000',
          land_class: 'NAL',
          owner_names: ['আবদুল হালিম'],
          note: null,
        },
        {
          id: 'lr-4',
          record_type: 'BS',
          khatian_no: '৯১২',
          dag_no: '১১২৪',
          mouza: 'শ্রীপুর',
          jl_no: '৮৭',
          area_decimal: '33.000',
          land_class: 'NAL',
          owner_names: ['আব্দুল হালীম'],
          note: 'নামের বানান ভুল — সংশোধনের জন্যই মামলা (৮৭/২০২৩)।',
        },
      ],
      deeds: [
        {
          id: 'deed-1',
          deed_type: 'SALE',
          deed_no: '৩৪৫৬',
          deed_date: '2011-06-19',
          registry_office: 'সাব-রেজিস্ট্রি অফিস, শ্রীপুর',
          grantor: 'মোছাঃ জরিনা খাতুন',
          grantee: 'আবদুল হালিম',
          consideration_amount: '450000.00',
          note: null,
        },
        {
          id: 'deed-2',
          deed_type: 'INHERITANCE',
          deed_no: '—',
          deed_date: '1998-03-04',
          registry_office: null,
          grantor: 'মৃত ইদ্রিস আলী',
          grantee: 'ওয়ারিশগণ',
          consideration_amount: null,
          note: 'ওয়ারিশ সনদ অনুযায়ী — দলিল নয়, উত্তরাধিকার।',
        },
      ],
      mutations: [
        {
          id: 'mut-1',
          mutation_case_no: '৫১২/২০২২-২৩',
          status: 'APPROVED',
          applied_on: '2022-09-14',
          decided_on: '2022-12-01',
          new_khatian_no: '৯১২',
          office: 'সহকারী কমিশনার (ভূমি), শ্রীপুর',
          note: null,
        },
        {
          id: 'mut-2',
          mutation_case_no: '১১৮/২০২৫-২৬',
          status: 'PENDING',
          applied_on: '2025-11-03',
          decided_on: null,
          new_khatian_no: null,
          office: 'সহকারী কমিশনার (ভূমি), শ্রীপুর',
          note: 'নামের বানান সংশোধনের আবেদন — মামলার ফলাফলের অপেক্ষায়।',
        },
      ],
      taxes: [
        {
          id: 'tax-1',
          fiscal_year: '2025-2026',
          receipt_no: 'LDT-2025-8841',
          paid_on: '2025-08-19',
          amount: '1250.00',
          office: 'ইউনিয়ন ভূমি অফিস, শ্রীপুর',
        },
        {
          id: 'tax-2',
          fiscal_year: '2024-2025',
          receipt_no: 'LDT-2024-6620',
          paid_on: '2024-09-02',
          amount: '1150.00',
          office: 'ইউনিয়ন ভূমি অফিস, শ্রীপুর',
        },
      ],
    },
    {
      id: 'property-2',
      title: 'ধানমন্ডি ৫ কাঠা ভিটি জমি',
      mouza: 'ধানমন্ডি',
      jl_no: '১২',
      district: 'ঢাকা',
      upazila: 'ধানমন্ডি',
      land_class: 'BHITI',
      total_area_decimal: '8.250',
      case_count: 1,
      document_count: 0,
      description: 'দখল ও স্বত্ব ঘোষণার মামলার বিষয়বস্তু (২৫১/২০২৪)।',
      address: 'বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা',
      boundaries: 'উত্তরে রোড ৫, দক্ষিণে বাড়ি ১৪, পূর্বে গলি, পশ্চিমে বাড়ি ১০',
      created_at: '2024-02-10T06:00:00Z',
      case_ids: ['case-1'],
      land_records: [
        {
          id: 'lr-5',
          record_type: 'RS',
          khatian_no: '৭৭৩',
          dag_no: '২২১৯',
          mouza: 'ধানমন্ডি',
          jl_no: '১২',
          area_decimal: '8.250',
          land_class: 'BHITI',
          owner_names: ['মোঃ রহিম উদ্দিন'],
          note: null,
        },
        {
          id: 'lr-6',
          record_type: 'CITY_JARIP',
          khatian_no: '১০৫৪',
          dag_no: '৩৩০৭',
          mouza: 'ধানমন্ডি',
          jl_no: '১২',
          area_decimal: '8.250',
          land_class: 'BHITI',
          owner_names: ['মোঃ রহিম উদ্দিন'],
          note: 'সিটি জরিপে দাগ নম্বর বদলেছে — প্রতিপক্ষ এটিকেই ভিন্ন জমি বলছে।',
        },
      ],
      deeds: [
        {
          id: 'deed-3',
          deed_type: 'SALE',
          deed_no: '৯১২০',
          deed_date: '2016-01-25',
          registry_office: 'সাব-রেজিস্ট্রি অফিস, ধানমন্ডি',
          grantor: 'মোঃ ইউনুস আলী',
          grantee: 'মোঃ রহিম উদ্দিন',
          consideration_amount: '4500000.00',
          note: null,
        },
      ],
      mutations: [
        {
          id: 'mut-3',
          mutation_case_no: '২২৪/২০১৬-১৭',
          status: 'APPROVED',
          applied_on: '2016-02-11',
          decided_on: '2016-05-30',
          new_khatian_no: '১০৫৪',
          office: 'সহকারী কমিশনার (ভূমি), ধানমন্ডি',
          note: null,
        },
      ],
      taxes: [
        {
          id: 'tax-3',
          fiscal_year: '2025-2026',
          receipt_no: 'LDT-2025-1177',
          paid_on: '2025-07-14',
          amount: '3400.00',
          office: 'ভূমি অফিস, ধানমন্ডি',
        },
      ],
    },
  ];
}

let properties = seedProperties();

export function resetPropertyData(): void {
  sequence = 700;
  properties = seedProperties();
}

function dagNumbers(record: PropertyRecord): string[] {
  return [...new Set(record.land_records.map((item) => item.dag_no).filter(Boolean))];
}

function khatianNumbers(record: PropertyRecord): string[] {
  return [...new Set(record.land_records.map((item) => item.khatian_no).filter(Boolean))];
}

function toListItem(record: PropertyRecord): PropertyListItem {
  return {
    id: record.id,
    title: record.title,
    mouza: record.mouza,
    jl_no: record.jl_no,
    district: record.district,
    upazila: record.upazila,
    land_class: record.land_class,
    total_area_decimal: record.total_area_decimal,
    dag_numbers: dagNumbers(record),
    khatian_numbers: khatianNumbers(record),
    case_count: record.case_ids.length,
    document_count: documentsForProperty(record.id).length,
  };
}

export interface PropertyListFilters {
  search?: string;
  caseId?: string;
}

/**
 * F-PROP-04 — একটিই search box, কিন্তু দাগ/খতিয়ান/মৌজা তিনটিই মেলে।
 * আইনজীবী হাতে যা লেখা আছে সেটিই টাইপ করেন; কোন ঘরে বসাতে হবে সেটি
 * তাঁর মনে রাখার কথা নয়।
 */
export function listProperties(filters: PropertyListFilters = {}): PropertyListItem[] {
  const query = filters.search?.trim().toLowerCase();

  return properties
    .filter((record) => {
      if (filters.caseId && !record.case_ids.includes(filters.caseId)) return false;
      if (!query) return true;
      return [
        record.title,
        record.mouza,
        record.jl_no,
        record.district,
        record.upazila,
        ...dagNumbers(record),
        ...khatianNumbers(record),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    })
    .map(toListItem);
}

export function getProperty(id: string): PropertyDetail | undefined {
  const record = properties.find((item) => item.id === id);
  if (!record) return undefined;

  const allCases = listCases();
  return {
    ...toListItem(record),
    description: record.description,
    address: record.address,
    boundaries: record.boundaries,
    created_at: record.created_at,
    land_records: record.land_records,
    deeds: record.deeds,
    mutations: record.mutations,
    taxes: record.taxes,
    cases: record.case_ids
      .map((caseId) => allCases.find((item) => item.id === caseId))
      .filter(Boolean) as CaseListItem[],
  };
}

export function createProperty(body: PropertyWriteRequest): PropertyDetail {
  const record: PropertyRecord = {
    id: nextId('property'),
    title: body.title,
    mouza: body.mouza ?? null,
    jl_no: body.jl_no ?? null,
    district: body.district ?? null,
    upazila: body.upazila ?? null,
    land_class: body.land_class ?? null,
    total_area_decimal: body.total_area_decimal,
    case_count: 0,
    document_count: 0,
    description: body.description ?? null,
    address: body.address ?? null,
    boundaries: body.boundaries ?? null,
    created_at: '2026-08-17T06:00:00Z',
    case_ids: [],
    land_records: [],
    deeds: [],
    mutations: [],
    taxes: [],
  };
  properties = [record, ...properties];
  return getProperty(record.id) as PropertyDetail;
}

export function updateProperty(
  id: string,
  body: PropertyWriteRequest,
): PropertyDetail | undefined {
  const index = properties.findIndex((item) => item.id === id);
  const existing = properties[index];
  if (!existing) return undefined;

  properties[index] = {
    ...existing,
    title: body.title,
    mouza: body.mouza ?? null,
    jl_no: body.jl_no ?? null,
    district: body.district ?? null,
    upazila: body.upazila ?? null,
    land_class: body.land_class ?? null,
    total_area_decimal: body.total_area_decimal,
    address: body.address ?? null,
    boundaries: body.boundaries ?? null,
    description: body.description ?? null,
  };
  return getProperty(id);
}

export function deleteProperty(id: string): boolean {
  const before = properties.length;
  properties = properties.filter((item) => item.id !== id);
  return properties.length !== before;
}

/* ── Child collections ───────────────────────────────────────────────── */

/** চারটি সংগ্রহ একই আকারের, তাই একটিই generic helper — নাহলে চারবার একই কোড। */
function addChild<K extends 'land_records' | 'deeds' | 'mutations' | 'taxes'>(
  propertyId: string,
  key: K,
  prefix: string,
  body: Omit<PropertyRecord[K][number], 'id'>,
): PropertyDetail | undefined {
  const index = properties.findIndex((item) => item.id === propertyId);
  const existing = properties[index];
  if (!existing) return undefined;

  const child = { ...body, id: nextId(prefix) } as PropertyRecord[K][number];
  properties[index] = { ...existing, [key]: [...existing[key], child] } as PropertyRecord;
  return getProperty(propertyId);
}

function removeChild(
  propertyId: string,
  key: 'land_records' | 'deeds' | 'mutations' | 'taxes',
  childId: string,
): PropertyDetail | undefined {
  const index = properties.findIndex((item) => item.id === propertyId);
  const existing = properties[index];
  if (!existing) return undefined;

  properties[index] = {
    ...existing,
    [key]: existing[key].filter((child) => child.id !== childId),
  } as PropertyRecord;
  return getProperty(propertyId);
}

export const addLandRecord = (propertyId: string, body: LandRecordWriteRequest) =>
  addChild(propertyId, 'land_records', 'lr', body);

export const addDeed = (propertyId: string, body: DeedWriteRequest) =>
  addChild(propertyId, 'deeds', 'deed', body);

export const addMutation = (propertyId: string, body: MutationWriteRequest) =>
  addChild(propertyId, 'mutations', 'mut', body);

export const addLandTax = (propertyId: string, body: LandTaxWriteRequest) =>
  addChild(propertyId, 'taxes', 'tax', body);

export const removeLandRecord = (propertyId: string, childId: string) =>
  removeChild(propertyId, 'land_records', childId);

export const removeDeed = (propertyId: string, childId: string) =>
  removeChild(propertyId, 'deeds', childId);

export const removeMutation = (propertyId: string, childId: string) =>
  removeChild(propertyId, 'mutations', childId);

export const removeLandTax = (propertyId: string, childId: string) =>
  removeChild(propertyId, 'taxes', childId);

/* ── Case linkage (F-PROP-07) ────────────────────────────────────────── */

export function linkPropertyCase(propertyId: string, caseId: string): PropertyDetail | undefined {
  const index = properties.findIndex((item) => item.id === propertyId);
  const existing = properties[index];
  if (!existing) return undefined;
  if (existing.case_ids.includes(caseId)) return getProperty(propertyId);

  properties[index] = { ...existing, case_ids: [...existing.case_ids, caseId] };
  return getProperty(propertyId);
}

export function unlinkPropertyCase(propertyId: string, caseId: string): PropertyDetail | undefined {
  const index = properties.findIndex((item) => item.id === propertyId);
  const existing = properties[index];
  if (!existing) return undefined;

  properties[index] = {
    ...existing,
    case_ids: existing.case_ids.filter((id) => id !== caseId),
  };
  return getProperty(propertyId);
}

/** মামলার বিস্তারিত পাতার "সম্পত্তি" অংশ। */
export function propertiesForCase(caseId: string): PropertyListItem[] {
  return listProperties({ caseId });
}
