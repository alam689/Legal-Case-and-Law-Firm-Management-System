import type { Capability } from '@caseflow/domain';
import { hasAllCapabilities, hasAnyCapability, hasCapability } from '@caseflow/domain';

import { useSessionStore } from './session.store';

/**
 * FE3 — UI কখনো security boundary নয়। Server-ই authority; এই hook শুধু
 * "যে action server reject করবে সেটি দেখানো হবে না" নিশ্চিত করে।
 *
 * Capability আসে `GET /auth/me` থেকে — কোনো component role hardcode করবে না,
 * নাহলে Phase 2-তে ৫টি role যোগ হলে সব screen ছুঁতে হবে।
 */
/**
 * Stable reference — selector প্রতি render-এ নতুন array ফেরত দিলে
 * `useSyncExternalStore` অসীম re-render loop-এ পড়ে (anonymous user-এ ধরা পড়েছিল)।
 */
const NO_CAPABILITIES: readonly string[] = Object.freeze([]);

export function useCapabilities(): readonly string[] {
  return useSessionStore((state) => state.user?.capabilities ?? NO_CAPABILITIES);
}

export function usePermission(capability: Capability): boolean {
  const capabilities = useCapabilities();
  return hasCapability(capabilities, capability);
}

export function useAnyPermission(capabilities: readonly Capability[]): boolean {
  const granted = useCapabilities();
  return hasAnyCapability(granted, capabilities);
}

export function useAllPermissions(capabilities: readonly Capability[]): boolean {
  const granted = useCapabilities();
  return hasAllCapabilities(granted, capabilities);
}
