/**
 * Workflow stage definitions — docs/03-data-model.md §5।
 *
 * ⚠⚠ এই দুটি taxonomy **advocate advisor দিয়ে M0-তে validate হতে হবে**
 * (Open Question Q1/Q2)। এখানের value গুলো seed default, চূড়ান্ত নয়।
 * Runtime-এ প্রকৃত stage আসবে `GET /workflows` থেকে (case-এ pinned version সহ) —
 * FE এই constant গুলো শুধু fallback, mock ও stage label-এর জন্য ব্যবহার করবে।
 *
 * Progress = completed_stages / total_stages — এটি **administrative progress**,
 * কখনো "মামলা জেতার সম্ভাবনা" হিসেবে label করা হবে না (docs/02-architecture §7)।
 */

import type { BilingualLabel } from './labels.js';

export interface WorkflowStage {
  readonly code: string;
  readonly order: number;
  readonly label: BilingualLabel;
  readonly isTerminal: boolean;
}

export interface WorkflowDefinition {
  readonly courtTypeCode: string;
  readonly name: BilingualLabel;
  readonly version: number;
  readonly stages: readonly WorkflowStage[];
}

function stage(
  code: string,
  order: number,
  bn: string,
  en: string,
  isTerminal = false,
): WorkflowStage {
  return { code, order, label: { bn, en }, isTerminal };
}

/** FILED → … → CLOSED (docs/03-data-model §5) */
export const CIVIL_SUIT_WORKFLOW: WorkflowDefinition = {
  courtTypeCode: 'CIVIL_DISTRICT',
  name: { bn: 'দেওয়ানি মোকদ্দমা', en: 'Civil suit' },
  version: 1,
  stages: [
    stage('FILED', 1, 'দায়ের', 'Filed'),
    stage('SUMMONS', 2, 'সমন জারি', 'Summons'),
    stage('APPEARANCE', 3, 'হাজিরা', 'Appearance'),
    stage('WRITTEN_STATEMENT', 4, 'লিখিত জবাব', 'Written statement'),
    stage('ISSUE_FRAMING', 5, 'বিচার্য বিষয় গঠন', 'Issue framing'),
    stage('PLAINTIFF_EVIDENCE', 6, 'বাদীর সাক্ষ্য', 'Plaintiff evidence'),
    stage('DEFENDANT_EVIDENCE', 7, 'বিবাদীর সাক্ষ্য', 'Defendant evidence'),
    stage('ARGUMENT', 8, 'যুক্তিতর্ক', 'Argument'),
    stage('JUDGMENT', 9, 'রায়', 'Judgment'),
    stage('DECREE', 10, 'ডিক্রি', 'Decree'),
    stage('EXECUTION', 11, 'জারি', 'Execution'),
    stage('APPEAL', 12, 'আপিল', 'Appeal'),
    stage('CLOSED', 13, 'সমাপ্ত', 'Closed', true),
  ],
};

/** State Acquisition and Tenancy Act §145A — record correction (docs/03-data-model §5) */
export const LAND_SURVEY_TRIBUNAL_WORKFLOW: WorkflowDefinition = {
  courtTypeCode: 'LAND_SURVEY_TRIBUNAL',
  name: { bn: 'ভূমি জরিপ ট্রাইব্যুনাল', en: 'Land Survey Tribunal' },
  version: 1,
  stages: [
    stage('FILED', 1, 'দায়ের', 'Filed'),
    stage('NOTICE', 2, 'নোটিশ জারি', 'Notice'),
    stage('APPEARANCE', 3, 'হাজিরা', 'Appearance'),
    stage('WRITTEN_STATEMENT', 4, 'লিখিত জবাব', 'Written statement'),
    stage('RECORD_EXAMINATION', 5, 'রেকর্ড পরীক্ষা', 'Record examination'),
    stage('LOCAL_INVESTIGATION', 6, 'সরেজমিন তদন্ত', 'Local investigation'),
    stage('EVIDENCE', 7, 'সাক্ষ্যগ্রহণ', 'Evidence'),
    stage('ARGUMENT', 8, 'যুক্তিতর্ক', 'Argument'),
    stage('JUDGMENT', 9, 'রায়', 'Judgment'),
    stage('RECORD_CORRECTION_ORDER', 10, 'রেকর্ড সংশোধন আদেশ', 'Record correction order'),
    stage('APPEAL', 11, 'আপিল', 'Appeal'),
    stage('CLOSED', 12, 'সমাপ্ত', 'Closed', true),
  ],
};

export const SEED_WORKFLOWS: readonly WorkflowDefinition[] = [
  CIVIL_SUIT_WORKFLOW,
  LAND_SURVEY_TRIBUNAL_WORKFLOW,
];

export function findStage(
  definition: WorkflowDefinition,
  code: string | null | undefined,
): WorkflowStage | undefined {
  if (!code) return undefined;
  return definition.stages.find((s) => s.code === code);
}

/**
 * Quick Entry-তে stage dropdown-এর default — পরবর্তী stage।
 * Transition validation **soft**: lawyer ধাপ লাফ দিতে পারবেন, শুধু warning দেখানো হবে
 * (docs/02-architecture §7 — আদালতে বাস্তবে ধাপ লাফ দেয়)।
 */
export function nextStage(
  definition: WorkflowDefinition,
  currentCode: string | null | undefined,
): WorkflowStage | undefined {
  const current = findStage(definition, currentCode);
  if (!current) return definition.stages[0];
  if (current.isTerminal) return current;
  return definition.stages.find((s) => s.order === current.order + 1);
}

/** Administrative progress (0–1) — কখনো outcome probability নয়। */
export function stageProgress(
  definition: WorkflowDefinition,
  currentCode: string | null | undefined,
): number {
  const current = findStage(definition, currentCode);
  if (!current) return 0;
  return current.order / definition.stages.length;
}
