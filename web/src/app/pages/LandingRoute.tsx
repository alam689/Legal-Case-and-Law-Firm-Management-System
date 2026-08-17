import { Suspense, lazy } from 'react';

import { SkeletonList } from '@/shared/ui/Skeleton';

const LandingPage = lazy(() => import('@/features/marketing/pages/LandingPage'));

const InheritanceSection = lazy(() =>
  import('@/features/inheritance/InheritanceSection').then((module) => ({
    default: module.InheritanceSection,
  })),
);

/**
 * Landing page ও উত্তরাধিকার ক্যালকুলেটর — দুটি আলাদা feature।
 * এক feature অন্য feature import করে না, তাই সংযোগটি app layer-এ
 * (docs/05-frontend-plan.md §4-এর dependency rule)।
 *
 * ক্যালকুলেটর নিজস্ব chunk-এ — hero দেখার জন্য যেন ফারায়েজ engine
 * ডাউনলোড করতে না হয় (§12-এর bundle budget)।
 */
export default function LandingRoute() {
  return (
    <Suspense fallback={<SkeletonList rows={4} />}>
      <LandingPage
        calculator={
          <Suspense fallback={<SkeletonList rows={4} />}>
            <InheritanceSection />
          </Suspense>
        }
      />
    </Suspense>
  );
}
