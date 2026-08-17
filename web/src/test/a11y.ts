import axe, { type AxeResults, type Result, type RunOptions } from 'axe-core';

/**
 * WCAG 2.1 AA — docs/05-frontend-plan.md §9।
 *
 * jsdom-এ যা যাচাই করা যায় শুধু তা-ই চালানো হয়: ভূমিকা, নাম, label,
 * heading-ক্রম, তালিকা ও টেবিলের গঠন। রঙের বৈসাদৃশ্য (`color-contrast`)
 * ইচ্ছাকৃতভাবে বাদ — jsdom CSS cascade গণনা করে না, তাই ফল অর্থহীন হত।
 * বৈসাদৃশ্য token স্তরে হাতে যাচাই হয় (docs/05-frontend-plan.md §9)।
 */
const RUN_OPTIONS: RunOptions = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
  },
  rules: {
    'color-contrast': { enabled: false },
    // MemoryRouter-এ শুধু page component render হয়, পুরো document নয় —
    // তাই landmark/region নিয়ম এখানে মিথ্যা ব্যর্থতা দেয়। App shell-এর
    // landmark গঠন আলাদা করে যাচাই হয় (AppLayout-এর নিজস্ব test)।
    region: { enabled: false },
  },
};

export interface A11yViolation {
  id: string;
  impact: string;
  help: string;
  nodes: string[];
}

function summarise(violations: Result[]): A11yViolation[] {
  return violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact ?? 'unknown',
    help: violation.help,
    nodes: violation.nodes.map((node) => node.html.slice(0, 160)),
  }));
}

/**
 * ব্যর্থ হলে assertion বার্তায় ভাঙা markup-ও দেখা যায়, নাহলে শুধু
 * "expected [] to equal []" পড়ে কেউ ঠিক করতে পারে না।
 */
export async function findA11yViolations(container: HTMLElement): Promise<A11yViolation[]> {
  const results = (await axe.run(container, RUN_OPTIONS)) as AxeResults;
  return summarise(results.violations);
}
