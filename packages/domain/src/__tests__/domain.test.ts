import { describe, expect, it } from 'vitest';

import {
  CASE_STATUSES,
  CASE_STATUS_LABELS,
  CIVIL_SUIT_WORKFLOW,
  DATE_SOURCES,
  DATE_SOURCE_LABELS,
  HEARING_OUTCOMES,
  HEARING_OUTCOME_DEFAULT_ORDER,
  HEARING_OUTCOME_LABELS,
  LAND_SURVEY_TRIBUNAL_WORKFLOW,
  ROLE_CAPABILITIES,
  bdMobileSchema,
  capabilitiesForRole,
  hasCapability,
  hearingOutcomeSchema,
  invitationCodeSchema,
  label,
  nextStage,
  normalizeBdMobile,
  optionsOf,
  stageProgress,
} from '../index.js';

describe('labels', () => {
  it('প্রতিটি enum value-এর bn ও en label আছে', () => {
    for (const status of CASE_STATUSES) {
      expect(CASE_STATUS_LABELS[status].bn.length).toBeGreaterThan(0);
      expect(CASE_STATUS_LABELS[status].en.length).toBeGreaterThan(0);
    }
    for (const source of DATE_SOURCES) {
      expect(DATE_SOURCE_LABELS[source].bn.length).toBeGreaterThan(0);
    }
    for (const outcome of HEARING_OUTCOMES) {
      expect(HEARING_OUTCOME_LABELS[outcome].bn.length).toBeGreaterThan(0);
    }
  });

  it('bn default, en toggle', () => {
    expect(label(CASE_STATUS_LABELS, 'ACTIVE')).toBe('চলমান');
    expect(label(CASE_STATUS_LABELS, 'ACTIVE', 'EN')).toBe('Active');
  });

  it('null value-তে crash না করে em-dash দেয়', () => {
    expect(label(CASE_STATUS_LABELS, null)).toBe('—');
  });

  it('optionsOf enum order রক্ষা করে', () => {
    const options = optionsOf(CASE_STATUSES, CASE_STATUS_LABELS);
    expect(options).toHaveLength(CASE_STATUSES.length);
    expect(options[0]?.value).toBe('ACTIVE');
  });

  it('outcome default order-এ সব outcome আছে এবং ADJOURNED প্রথম', () => {
    expect([...HEARING_OUTCOME_DEFAULT_ORDER].sort()).toEqual([...HEARING_OUTCOMES].sort());
    expect(HEARING_OUTCOME_DEFAULT_ORDER[0]).toBe('ADJOURNED');
  });
});

describe('capabilities (RBAC matrix — docs/01-scope §5)', () => {
  it('FIRM_ADMIN-এর সব capability আছে', () => {
    const caps = capabilitiesForRole('FIRM_ADMIN');
    expect(caps).toContain('firm.settings');
    expect(caps).toContain('audit.view');
    expect(caps).toContain('staff.manage');
  });

  it('ASSISTANT case create বা invoice create করতে পারে না', () => {
    const caps = capabilitiesForRole('ASSISTANT');
    expect(hasCapability(caps, 'hearing.entry')).toBe(true);
    expect(hasCapability(caps, 'case.create')).toBe(false);
    expect(hasCapability(caps, 'invoice.create')).toBe(false);
    expect(hasCapability(caps, 'hearing.confirm')).toBe(false);
  });

  it('JUNIOR শুধু own scope পায়', () => {
    expect(ROLE_CAPABILITIES.JUNIOR['case.view_firm']).toBe('own');
    expect(ROLE_CAPABILITIES.ASSOCIATE['case.view_firm']).toBe('all');
  });

  it('FIRM_ADMIN ছাড়া কেউ staff manage / firm settings / audit পায় না', () => {
    for (const role of ['SENIOR_ADVOCATE', 'ASSOCIATE', 'JUNIOR', 'ASSISTANT'] as const) {
      expect(hasCapability(capabilitiesForRole(role), 'staff.manage')).toBe(false);
      expect(hasCapability(capabilitiesForRole(role), 'firm.settings')).toBe(false);
      expect(hasCapability(capabilitiesForRole(role), 'audit.view')).toBe(false);
    }
  });
});

describe('workflow', () => {
  it('civil suit FILED থেকে শুরু, CLOSED terminal', () => {
    expect(CIVIL_SUIT_WORKFLOW.stages[0]?.code).toBe('FILED');
    const last = CIVIL_SUIT_WORKFLOW.stages.at(-1);
    expect(last?.code).toBe('CLOSED');
    expect(last?.isTerminal).toBe(true);
  });

  it('land tribunal-এ record correction stage আছে', () => {
    const codes = LAND_SURVEY_TRIBUNAL_WORKFLOW.stages.map((s) => s.code);
    expect(codes).toContain('RECORD_CORRECTION_ORDER');
    expect(codes).toContain('LOCAL_INVESTIGATION');
  });

  it('nextStage পরবর্তী stage দেয়, terminal-এ আটকে থাকে', () => {
    expect(nextStage(CIVIL_SUIT_WORKFLOW, 'FILED')?.code).toBe('SUMMONS');
    expect(nextStage(CIVIL_SUIT_WORKFLOW, 'CLOSED')?.code).toBe('CLOSED');
    expect(nextStage(CIVIL_SUIT_WORKFLOW, null)?.code).toBe('FILED');
  });

  it('progress 0–1 এর মধ্যে', () => {
    expect(stageProgress(CIVIL_SUIT_WORKFLOW, 'FILED')).toBeGreaterThan(0);
    expect(stageProgress(CIVIL_SUIT_WORKFLOW, 'CLOSED')).toBe(1);
    expect(stageProgress(CIVIL_SUIT_WORKFLOW, 'UNKNOWN_STAGE')).toBe(0);
  });
});

describe('schemas', () => {
  it('বাংলাদেশি mobile normalize করে', () => {
    expect(normalizeBdMobile('+8801712345678')).toBe('01712345678');
    expect(normalizeBdMobile('01712-345678')).toBe('01712345678');
    expect(normalizeBdMobile('1712345678')).toBe('01712345678');
  });

  it('বৈধ mobile গ্রহণ, অবৈধ প্রত্যাখ্যান', () => {
    expect(bdMobileSchema.parse('+880 1712 345678')).toBe('01712345678');
    expect(bdMobileSchema.safeParse('0121234567').success).toBe(false);
    expect(bdMobileSchema.safeParse('01234567890').success).toBe(false);
  });

  it('invitation code uppercase করে যাচাই করে', () => {
    expect(invitationCodeSchema.parse('case-8f29k')).toBe('CASE-8F29K');
    expect(invitationCodeSchema.safeParse('8F29K').success).toBe(false);
  });

  it('adjourned outcome-এ next date বাধ্যতামূলক', () => {
    const missing = hearingOutcomeSchema.safeParse({ outcome: 'ADJOURNED' });
    expect(missing.success).toBe(false);

    const ok = hearingOutcomeSchema.safeParse({
      outcome: 'ADJOURNED',
      nextDate: '2026-08-25',
    });
    expect(ok.success).toBe(true);
    expect(ok.success && ok.data.notifyClient).toBe(true);
  });

  it('terminal outcome-এ next date ছাড়াই চলে', () => {
    expect(hearingOutcomeSchema.safeParse({ outcome: 'DISPOSED' }).success).toBe(true);
    expect(hearingOutcomeSchema.safeParse({ outcome: 'SETTLED' }).success).toBe(true);
  });
});
