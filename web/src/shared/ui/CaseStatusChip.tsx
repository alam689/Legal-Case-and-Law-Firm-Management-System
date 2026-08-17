import {
  CASE_STATUS_LABELS,
  CASE_STATUS_TONES,
  type CaseStatus,
  VERIFICATION_STATUS_LABELS,
  VERIFICATION_STATUS_TONES,
  type VerificationStatus,
  label,
} from '@caseflow/domain';

import { useLocale } from '@/shared/i18n/use-locale';

import { Badge } from './Badge';

export function CaseStatusChip({ status, className }: { status: CaseStatus; className?: string }) {
  const { language } = useLocale();
  return (
    <Badge tone={CASE_STATUS_TONES[status]} className={className}>
      {label(CASE_STATUS_LABELS, status, language)}
    </Badge>
  );
}

/**
 * F-AUTH-04 — verification status UI-তে **সৎভাবে** দেখানো হবে।
 * `SELF_DECLARED` কখনো "verified" বলে চালানো হবে না।
 */
export function VerificationBadge({
  status,
  className,
}: {
  status: VerificationStatus;
  className?: string;
}) {
  const { language } = useLocale();
  return (
    <Badge tone={VERIFICATION_STATUS_TONES[status]} className={className}>
      {label(VERIFICATION_STATUS_LABELS, status, language)}
    </Badge>
  );
}
