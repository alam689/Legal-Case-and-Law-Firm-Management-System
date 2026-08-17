import type { VirusScanStatus } from '@caseflow/api-types';
import type { Tone } from '@caseflow/domain';
import { CheckCircle2, Loader2, ShieldAlert, ShieldOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/shared/ui/Badge';

/**
 * স্ক্যান অবস্থা — "আপলোড হয়েছে" আর "খোলা যাবে" আলাদা কথা।
 *
 * `CLEAN` অবস্থায় কোনো badge দেখানো হয় না; সব ঠিক থাকলে চুপ থাকাই ভালো,
 * নাহলে তালিকার প্রতিটি সারিতে একটি সবুজ চিহ্ন জমে গিয়ে সত্যিকারের
 * সতর্কতাগুলো চোখ এড়িয়ে যায়।
 */
const CONFIG: Record<VirusScanStatus, { tone: Tone; icon: ReactNode; key: string } | null> = {
  CLEAN: null,
  PENDING: {
    tone: 'warning',
    icon: <Loader2 className="h-3 w-3 animate-spin" aria-hidden />,
    key: 'documents.scan.pending',
  },
  INFECTED: {
    tone: 'danger',
    icon: <ShieldAlert className="h-3 w-3" aria-hidden />,
    key: 'documents.scan.infected',
  },
  SKIPPED: {
    tone: 'neutral',
    icon: <ShieldOff className="h-3 w-3" aria-hidden />,
    key: 'documents.scan.skipped',
  },
};

export function ScanStatusBadge({
  status,
  showClean = false,
}: {
  status: VirusScanStatus;
  /** সংস্করণ তালিকায় সব সারিতেই অবস্থা দেখানো হয় — সেখানে `true`। */
  showClean?: boolean;
}) {
  const { t } = useTranslation();
  const config = CONFIG[status];

  if (!config) {
    if (!showClean) return null;
    return (
      <Badge tone="success" icon={<CheckCircle2 className="h-3 w-3" aria-hidden />}>
        {t('documents.scan.clean')}
      </Badge>
    );
  }

  const hintKey =
    status === 'PENDING'
      ? 'documents.scan.pendingHint'
      : status === 'INFECTED'
        ? 'documents.scan.infectedHint'
        : undefined;

  return (
    <Badge tone={config.tone} icon={config.icon} title={hintKey ? t(hintKey) : undefined}>
      {t(config.key)}
    </Badge>
  );
}
