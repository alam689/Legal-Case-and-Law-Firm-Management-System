import { create } from 'zustand';

import { type OutcomeEntryMetrics, setMetricsSink } from './entry-metrics';

/**
 * এই ব্রাউজার সেশনে মাপা entry গুলো।
 *
 * প্রকৃত aggregate backend-এ যাবে; কিন্তু pilot-এর সময় "instrumentation
 * আদৌ কাজ করছে কি না" তা প্রমাণ করার জন্য একটি জীবন্ত জানালা দরকার —
 * নাহলে metric না আসার কারণ খুঁজতে খুঁজতেই pilot শেষ হয়ে যাবে
 * (docs/04-roadmap §7)।
 */
interface SessionMetricsState {
  entries: OutcomeEntryMetrics[];
  add: (metrics: OutcomeEntryMetrics) => void;
  clear: () => void;
}

const MAX_ENTRIES = 50;

export const useSessionMetrics = create<SessionMetricsState>((set) => ({
  entries: [],
  add: (metrics) =>
    set((state) => ({ entries: [metrics, ...state.entries].slice(0, MAX_ENTRIES) })),
  clear: () => set({ entries: [] }),
}));

/**
 * App bootstrap-এ একবার। Sink চেইন করা হয় — dev console-এর log হারায় না,
 * এবং backend analytics যুক্ত হলে এখানেই তৃতীয় consumer বসবে।
 */
export function installSessionMetrics(): void {
  setMetricsSink((metrics) => {
    useSessionMetrics.getState().add(metrics);
  });
}

/** মধ্যক — গড় নয়, কারণ একটি দীর্ঘ entry গড়কে বিভ্রান্তিকর করে তোলে। */
export function medianDuration(entries: OutcomeEntryMetrics[]): number {
  if (entries.length === 0) return 0;
  const sorted = entries.map((entry) => entry.durationMs).sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round(((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2)
    : (sorted[middle] ?? 0);
}
