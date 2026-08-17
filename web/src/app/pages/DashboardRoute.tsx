import type { AgendaItem } from '@caseflow/api-types';
import { Suspense, lazy, useState } from 'react';

import { todayIso } from '@/shared/i18n/formatters';
import { SkeletonList } from '@/shared/ui/Skeleton';

const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));

const OutcomeEntryButton = lazy(() =>
  import('@/features/hearings/components/OutcomeEntryButton').then((module) => ({
    default: module.OutcomeEntryButton,
  })),
);

const QuickOutcomeDialog = lazy(() =>
  import('@/features/hearings/components/QuickOutcomeDialog').then((module) => ({
    default: module.QuickOutcomeDialog,
  })),
);

/**
 * Dashboard-এর agenda সারিতে core loop-এর বোতাম বসানো হয় এখানে —
 * dashboard feature নিজে hearings feature চেনে না (docs/05 §4)।
 *
 * Dialog-এর state পর্দার স্তরে: সংরক্ষণের পরে সারিটি তালিকা থেকে সরে যায়,
 * কিন্তু সাফল্যের বার্তা তখনো দেখা যেতে হবে।
 */
export default function DashboardRoute() {
  const [active, setActive] = useState<AgendaItem | null>(null);

  return (
    <Suspense fallback={<SkeletonList rows={4} />}>
      <DashboardPage
        renderRowAction={(item) => (
          <Suspense fallback={null}>
            <OutcomeEntryButton item={item} onOpen={setActive} />
          </Suspense>
        )}
      />

      {active ? (
        <Suspense fallback={null}>
          <QuickOutcomeDialog
            item={active}
            hearingDate={todayIso()}
            open
            onOpenChange={(open) => !open && setActive(null)}
            source="dashboard"
          />
        </Suspense>
      ) : null}
    </Suspense>
  );
}
