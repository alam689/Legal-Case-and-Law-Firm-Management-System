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

const CaseDocumentsTab = lazy(() =>
  import('@/features/documents/components/CaseDocumentsTab').then((module) => ({
    default: module.CaseDocumentsTab,
  })),
);

const CasePropertyTab = lazy(() =>
  import('@/features/properties/components/CasePropertyTab').then((module) => ({
    default: module.CasePropertyTab,
  })),
);

const CaseBillingTab = lazy(() =>
  import('@/features/billing/components/CaseBillingTab').then((module) => ({
    default: module.CaseBillingTab,
  })),
);

/** Case detail-এর tab গুলোতে অন্য feature-এর content যুক্ত করা হয় (§4)। */
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
        renderDocuments={(caseId) => (
          <Suspense fallback={<SkeletonList rows={4} />}>
            <CaseDocumentsTab caseId={caseId} />
          </Suspense>
        )}
        renderProperty={(caseId) => (
          <Suspense fallback={<SkeletonList rows={3} />}>
            <CasePropertyTab caseId={caseId} />
          </Suspense>
        )}
        renderBilling={(caseId) => (
          <Suspense fallback={<SkeletonList rows={4} />}>
            <CaseBillingTab caseId={caseId} />
          </Suspense>
        )}
      />
    </Suspense>
  );
}
