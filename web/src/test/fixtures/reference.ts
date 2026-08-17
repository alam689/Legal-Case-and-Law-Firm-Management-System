import type {
  CourtSummary,
  CourtTypeSummary,
  WorkflowDefinitionSummary,
} from '@caseflow/api-types';
import { CIVIL_SUIT_WORKFLOW, LAND_SURVEY_TRIBUNAL_WORKFLOW } from '@caseflow/domain';

/** Reference data — বাস্তবে Sprint 1-এর seed থেকে আসবে (docs/03-data-model §14)। */

export const courtTypesFixture: CourtTypeSummary[] = [
  {
    id: 'ct-civil',
    code: 'CIVIL_DISTRICT',
    name: 'District Civil Court',
    name_bn: 'জেলা দেওয়ানি আদালত',
    is_tribunal: false,
  },
  {
    id: 'ct-land',
    code: 'LAND_SURVEY_TRIBUNAL',
    name: 'Land Survey Tribunal',
    name_bn: 'ভূমি জরিপ ট্রাইব্যুনাল',
    is_tribunal: true,
  },
  {
    id: 'ct-family',
    code: 'FAMILY_COURT',
    name: 'Family Court',
    name_bn: 'পারিবারিক আদালত',
    is_tribunal: false,
  },
];

export const courtsFixture: CourtSummary[] = [
  {
    id: 'court-1',
    name: 'Joint District Judge 2nd Court, Dhaka',
    name_bn: 'যুগ্ম জেলা জজ ২য় আদালত, ঢাকা',
    district: 'ঢাকা',
    court_type_code: 'CIVIL_DISTRICT',
  },
  {
    id: 'court-2',
    name: 'Land Survey Tribunal, Gazipur',
    name_bn: 'ভূমি জরিপ ট্রাইব্যুনাল, গাজীপুর',
    district: 'গাজীপুর',
    court_type_code: 'LAND_SURVEY_TRIBUNAL',
  },
  {
    id: 'court-3',
    name: 'Family Court, Dhaka',
    name_bn: 'পারিবারিক আদালত, ঢাকা',
    district: 'ঢাকা',
    court_type_code: 'FAMILY_COURT',
  },
  {
    id: 'court-4',
    name: 'Assistant Judge Court, Narayanganj',
    name_bn: 'সহকারী জজ আদালত, নারায়ণগঞ্জ',
    district: 'নারায়ণগঞ্জ',
    court_type_code: 'CIVIL_DISTRICT',
  },
];

export const workflowsFixture: WorkflowDefinitionSummary[] = [
  CIVIL_SUIT_WORKFLOW,
  LAND_SURVEY_TRIBUNAL_WORKFLOW,
].map((definition, index) => ({
  id: `wf-${index + 1}`,
  court_type_code: definition.courtTypeCode,
  name: definition.name.en,
  name_bn: definition.name.bn,
  version: definition.version,
  stages: definition.stages.map((stage) => ({
    code: stage.code,
    order: stage.order,
    name: stage.label.en,
    name_bn: stage.label.bn,
    is_terminal: stage.isTerminal,
  })),
}));
