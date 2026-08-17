import { useEffect, useState } from 'react';

/**
 * Offline banner-এর ভিত্তি (docs/05-frontend-plan.md §6.6)।
 * MVP-তে offline **write** নেই — banner শুধু জানায় যে সংরক্ষণ করা যাবে না।
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}
