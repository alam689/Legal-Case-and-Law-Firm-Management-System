/**
 * @caseflow/domain — enum, label, capability, workflow ও validation।
 * Web (React) এবং Mobile (React Native) দুটোতেই ব্যবহৃত।
 *
 * নিয়ম: এই package-এ কোনো React / DOM / React Native import যাবে না
 * (docs/05-frontend-plan.md §16) — CI-তে import boundary check।
 */

export * from './enums.js';
export * from './labels.js';
export * from './capabilities.js';
export * from './workflow.js';
export * from './calendar/index.js';
export * from './schemas.js';
export * from './inheritance/index.js';
