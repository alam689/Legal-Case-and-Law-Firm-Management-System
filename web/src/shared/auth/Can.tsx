import type { Capability } from '@caseflow/domain';
import type { ReactNode } from 'react';

import { useAllPermissions, useAnyPermission, usePermission } from './use-permission';

interface CanProps {
  /** একটি capability */
  do?: Capability;
  /** যেকোনো একটি থাকলেই যথেষ্ট */
  any?: readonly Capability[];
  /** সবগুলো থাকতে হবে */
  all?: readonly Capability[];
  children: ReactNode;
  /** অনুমতি না থাকলে যা দেখানো হবে — default: কিছুই নয় (deny-by-default) */
  fallback?: ReactNode;
}

/**
 * ```tsx
 * <Can do="hearing.confirm" fallback={<LockedHint />}>
 *   <ConfirmDateButton />
 * </Can>
 * ```
 *
 * docs/05-frontend-plan.md §6.2 — প্রতিটি RBAC matrix cell-এর একটি test আছে।
 */
export function Can({ do: single, any, all, children, fallback = null }: CanProps) {
  const hasSingle = usePermission(single ?? ('__none__' as Capability));
  const hasAny = useAnyPermission(any ?? []);
  const hasAll = useAllPermissions(all ?? []);

  let allowed = true;
  if (single) allowed = allowed && hasSingle;
  if (any && any.length > 0) allowed = allowed && hasAny;
  if (all && all.length > 0) allowed = allowed && hasAll;
  // কোনো condition দেওয়া না হলে deny — ভুলে খোলা রাখার চেয়ে বন্ধ থাকা নিরাপদ
  if (!single && !any?.length && !all?.length) allowed = false;

  return <>{allowed ? children : fallback}</>;
}
