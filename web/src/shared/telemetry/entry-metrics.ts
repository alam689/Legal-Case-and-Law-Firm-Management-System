/**
 * ★ Core loop-এর সময় মাপা — docs/05-frontend-plan.md §7.1।
 *
 * Pilot exit criterion **PE8** হলো "প্রতি hearing entry ≤ ৩০ সেকেন্ড"
 * (docs/04-roadmap §3)। এই measurement ছাড়া সেটি যাচাই করার কোনো উপায় নেই —
 * তাই modal খোলার প্রথম দিন থেকেই সময় ও সংশোধনের সংখ্যা গোনা হয়।
 *
 * ⚠ কোনো PII নয় — শুধু id, সময় ও গণনা (docs/05 §15)।
 */

export interface OutcomeEntryMetrics {
  hearingId: string;
  /** modal খোলা থেকে সফল save পর্যন্ত (ms) */
  durationMs: number;
  /** ব্যবহারকারী কতবার ঘরের মান বদলেছেন — বেশি হলে default গুলো ভুল */
  fieldEdits: number;
  /** ব্যর্থ চেষ্টার সংখ্যা */
  failedAttempts: number;
  outcome: string;
  hadNextDate: boolean;
  usedQuickDateChip: boolean;
  notifiedClient: boolean;
  /** diary-তে পরপর entry, নাকি একক modal */
  source: 'dashboard' | 'diary' | 'case';
}

type MetricsSink = (metrics: OutcomeEntryMetrics) => void;

/**
 * Sink — Sprint 4-এর metric dashboard এখানেই যুক্ত হবে।
 * ডিফল্টে dev-এ console, production-এ নীরব (Sentry/analytics না আসা পর্যন্ত)।
 */
let sink: MetricsSink = (metrics) => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console -- dev-only visibility until the metrics pipeline lands
    console.info('[hearing_outcome_entry]', metrics);
  }
};

export function setMetricsSink(next: MetricsSink): void {
  sink = next;
}

export function reportOutcomeEntry(metrics: OutcomeEntryMetrics): void {
  sink(metrics);
}

/** Modal খোলার সময় শুরু হয়, save সফল হলে থামে। */
export function createEntryTimer(hearingId: string, source: OutcomeEntryMetrics['source']) {
  const startedAt = performance.now();
  let fieldEdits = 0;
  let failedAttempts = 0;
  let usedQuickDateChip = false;

  return {
    countEdit: () => {
      fieldEdits += 1;
    },
    countFailure: () => {
      failedAttempts += 1;
    },
    markQuickChip: () => {
      usedQuickDateChip = true;
    },
    complete: (input: {
      outcome: string;
      hadNextDate: boolean;
      notifiedClient: boolean;
    }): OutcomeEntryMetrics => {
      const metrics: OutcomeEntryMetrics = {
        hearingId,
        durationMs: Math.round(performance.now() - startedAt),
        fieldEdits,
        failedAttempts,
        usedQuickDateChip,
        source,
        ...input,
      };
      reportOutcomeEntry(metrics);
      return metrics;
    },
  };
}

export type EntryTimer = ReturnType<typeof createEntryTimer>;
