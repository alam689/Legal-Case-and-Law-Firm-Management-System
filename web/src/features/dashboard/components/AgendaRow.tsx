import type { AgendaItem } from '@caseflow/api-types';
import type { ReactNode } from 'react';
import { Clock, MapPin, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { ProvenanceBadge } from '@/shared/ui/ProvenanceBadge';

/**
 * Sprint 3-এ এই row থেকেই Quick Hearing Entry modal খুলবে
 * (docs/05-frontend-plan.md §7.1) — তাই সময়ের chip ও কাজের জায়গা
 * এখনই বাঁ-ডান দুই প্রান্তে আলাদা করে রাখা হয়েছে।
 */
export function AgendaRow({ item, action }: { item: AgendaItem; action?: ReactNode }) {
  const { t } = useTranslation();

  return (
    <li className="group flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 transition-colors hover:bg-surface-muted/60">
      <span className="flex h-11 w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-muted">
        {item.time ? (
          <>
            <Clock className="h-3 w-3 text-fg-subtle" aria-hidden />
            <span className="font-latin text-xs font-semibold tabular-nums text-fg">
              {item.time}
            </span>
          </>
        ) : (
          <span className="text-xs text-fg-subtle">—</span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-latin text-xs font-semibold tabular-nums text-fg-muted">
            {item.case_display_number}
          </span>
          <ProvenanceBadge source={item.source} />
          {item.client_attendance_required ? (
            <span className="flex items-center gap-1 rounded-md bg-info-bg px-2 py-0.5 text-xs font-medium text-info">
              <UserCheck className="h-3 w-3" aria-hidden />
              {t('dashboard.nextHearing.attendance')}
            </span>
          ) : null}
        </span>

        <Link
          to={`/cases/${item.case_id}`}
          className="mt-1 block truncate text-sm font-medium text-fg hover:text-primary hover:underline"
        >
          {item.case_title}
        </Link>

        <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-subtle">
          {item.court_name ? (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden />
              {item.court_name}
            </span>
          ) : null}
          {item.purpose ? <span>{item.purpose}</span> : null}
        </span>
      </span>

      {action ? <span className="shrink-0">{action}</span> : null}
    </li>
  );
}
