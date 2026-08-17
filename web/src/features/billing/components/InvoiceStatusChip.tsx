import { INVOICE_STATUS_LABELS, type InvoiceStatus, type Tone, label } from '@caseflow/domain';

import { useLocale } from '@/shared/i18n/use-locale';
import { Badge } from '@/shared/ui/Badge';

/**
 * অবস্থার রঙ — মেয়াদোত্তীর্ণ লাল, বকেয়া হলুদ, পরিশোধিত সবুজ।
 *
 * খসড়া ও বাতিল দুটোই নিষ্প্রভ, কারণ কোনোটিই টাকার হিসাবে গোনা হয় না —
 * তালিকায় সেগুলো চোখে কম পড়াই ঠিক।
 */
const TONES: Record<InvoiceStatus, Tone> = {
  DRAFT: 'neutral',
  ISSUED: 'info',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  OVERDUE: 'danger',
  CANCELLED: 'neutral',
};

export function InvoiceStatusChip({ status }: { status: InvoiceStatus }) {
  const { language } = useLocale();
  return <Badge tone={TONES[status]}>{label(INVOICE_STATUS_LABELS, status, language)}</Badge>;
}
