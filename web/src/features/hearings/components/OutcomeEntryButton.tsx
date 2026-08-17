import type { AgendaItem } from '@caseflow/api-types';
import { useTranslation } from 'react-i18next';

import { Can } from '@/shared/auth/Can';
import { Button } from '@/shared/ui/Button';

/**
 * Agenda সারিতে core loop খোলার বোতাম — শুধুই trigger।
 *
 * ⚠ Dialog ইচ্ছাকৃতভাবে এই component-এর ভিতরে নেই। ফলাফল সংরক্ষণের পরে
 * সারিটি কার্যতালিকা থেকে সরে যায় (সেটিই তো উদ্দেশ্য), আর dialog সারির
 * ভিতরে থাকলে সাফল্যের বার্তা দেখানোর আগেই সে-ও unmount হয়ে যেত।
 * তাই dialog-এর state থাকে পর্দার স্তরে, সারিতে নয়।
 */
export function OutcomeEntryButton({
  item,
  onOpen,
}: {
  item: AgendaItem;
  onOpen: (item: AgendaItem) => void;
}) {
  const { t } = useTranslation();

  if (item.outcome) return null;

  return (
    <Can do="hearing.entry">
      <Button variant="secondary" onClick={() => onOpen(item)}>
        {t('hearing.entry.open')}
      </Button>
    </Can>
  );
}
