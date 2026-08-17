import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';

import { FullPageLoader } from '@/shared/ui/FullPageLoader';

import { restoreSession } from './api';
import { onAuthBroadcast } from './broadcast';
import { refreshAccessToken } from './refresh';
import { useSessionStore } from './session.store';

/**
 * Session bootstrap + tab sync।
 *
 * Reload-এ access token memory থেকে হারিয়ে যায় (ADR FE-0013) — তাই প্রথমে
 * refresh cookie দিয়ে নতুন access token, তারপর `/auth/me`।
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const status = useSessionStore((state) => state.status);
  const clear = useSessionStore((state) => state.clear);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const token = await refreshAccessToken();
      if (token) await restoreSession();
      else clear();
      if (!cancelled) setBootstrapped(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [clear]);

  useEffect(
    () =>
      onAuthBroadcast((message) => {
        if (message.type !== 'logout') return;
        clear();
        queryClient.clear();
      }),
    [clear, queryClient],
  );

  if (!bootstrapped && status === 'unknown') return <FullPageLoader />;

  return <>{children}</>;
}
