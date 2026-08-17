import { Suspense, lazy } from 'react';

import { SkeletonList } from '@/shared/ui/Skeleton';

const CaseDetailPage = lazy(() => import('@/features/cases/pages/CaseDetailPage'));

const CaseTimeline = lazy(() =>
  import('@/features/hearings/components/CaseTimeline').then((module) => ({
    default: module.CaseTimeline,
  })),
);

const CaseHearingsTab = lazy(() =>
  import('@/features/hearings/components/CaseHearingsTab').then((module) => ({
    default: module.CaseHearingsTab,
  })),
);

/** Case detail-এর tab গুলোতে hearings feature-এর content যুক্ত করা হয় (§4)। */
export default function CaseDetailRoute() {
  return (
    <Suspense fallback={<SkeletonList rows={5} />}>
      <CaseDetailPage
        renderTimeline={(caseId) => (
          <Suspense fallback={<SkeletonList rows={4} />}>
            <CaseTimeline caseId={caseId} />
          </Suspense>
        )}
        renderHearings={(caseId) => (
          <Suspense fallback={<SkeletonList rows={4} />}>
            <CaseHearingsTab caseId={caseId} />
          </Suspense>
        )}
      />
    </Suspense>
  );
}
