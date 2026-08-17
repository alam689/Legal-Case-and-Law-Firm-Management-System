import type { EstateAssets, HeirCounts } from '@caseflow/domain';
import { useRef, useState } from 'react';

import { InheritanceCalculator } from './InheritanceCalculator';
import { InheritanceFaq } from './components/InheritanceFaq';
import { DEFAULT_ASSETS } from './defaults';

/**
 * ক্যালকুলেটর ও জিজ্ঞাসা — একই state ভাগ করে, তাই কোনো উদাহরণে ক্লিক করলে
 * সেটি সরাসরি ক্যালকুলেটরে বসে যায়। উদাহরণ পড়া থেকে নিজের হিসাব করা
 * পর্যন্ত পথটি এক ক্লিকের।
 */
export function InheritanceSection() {
  const [counts, setCounts] = useState<HeirCounts>({});
  const [assets, setAssets] = useState<EstateAssets>(DEFAULT_ASSETS);
  const calculatorRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-14">
      <div ref={calculatorRef}>
        <InheritanceCalculator
          counts={counts}
          onCountsChange={setCounts}
          assets={assets}
          onAssetsChange={setAssets}
        />
      </div>

      <InheritanceFaq
        onTryExample={(heirs) => {
          setCounts(heirs);
          calculatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      />
    </div>
  );
}
