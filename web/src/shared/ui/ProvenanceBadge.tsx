import { type DateSource, DATE_SOURCE_LABELS, DATE_SOURCE_TONES, label } from '@caseflow/domain';
import { BadgeCheck, Landmark, PenLine, UserRound } from 'lucide-react';
import type { ComponentType } from 'react';

import { useLocale } from '@/shared/i18n/use-locale';

import { Badge } from './Badge';

const ICONS: Record<DateSource, ComponentType<{ className?: string }>> = {
  LAWYER_ENTERED: PenLine,
  CONFIRMED: BadgeCheck,
  OFFICIAL_SYNC: Landmark,
  CLIENT_REPORTED: UserRound,
};

/**
 * ★ Architectural rule A1 / FE4 — যেখানেই তারিখ, সেখানেই এই badge।
 * কোনো screen-এ "নগ্ন" তারিখ থাকবে না; client-কে সবসময় জানতে হবে
 * তারিখটি আইনজীবী লিখেছেন নাকি দাপ্তরিকভাবে যাচাই হয়েছে।
 */
export function ProvenanceBadge({
  source,
  actorName,
  at,
  className,
}: {
  source: DateSource;
  actorName?: string | null;
  at?: string | null;
  className?: string;
}) {
  const { language } = useLocale();
  const Icon = ICONS[source];
  const text = label(DATE_SOURCE_LABELS, source, language);
  const tooltip = [text, actorName, at].filter(Boolean).join(' · ');

  return (
    <Badge
      tone={DATE_SOURCE_TONES[source]}
      className={className}
      title={tooltip}
      icon={<Icon className="h-3 w-3" />}
    >
      {text}
    </Badge>
  );
}
