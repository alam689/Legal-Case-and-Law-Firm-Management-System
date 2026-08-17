import type { CoreLoopMetrics, HearingDetail, NotificationMetrics } from '@caseflow/api-types';

import { listDispatches } from './notifications';

/**
 * Metric aggregation — বাস্তবে backend করবে; এখানে store থেকেই গণনা,
 * যাতে ডায়েরিতে ফলাফল লিখলে সংখ্যা সত্যিই নড়ে।
 *
 * প্রতিটি metric কোন pilot exit criterion-এর জন্য, তা
 * `docs/04-delivery-roadmap.md §7`-এ বাঁধা।
 */

/** PE8-এর জন্য seeded নমুনা — প্রকৃত সংগ্রহ backend-এ (setMetricsSink)। */
const SEEDED_ENTRY_SECONDS = [22, 18, 26, 14, 31, 19, 24, 17, 28, 21];

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round(((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2)
    : (sorted[middle] ?? 0);
}

export function buildCoreLoopMetrics(
  hearings: HearingDetail[],
  todayIso: string,
): CoreLoopMetrics {
  const due = hearings.filter(
    (hearing) => hearing.status !== 'SUPERSEDED' && hearing.date <= todayIso,
  );
  const recorded = due.filter((hearing) => hearing.outcome !== null);

  /** PE1 — ফলাফল শুনানির দিনেই লেখা হয়েছে কি না। */
  const sameDay = recorded.filter(
    (hearing) => hearing.outcome_recorded_at?.slice(0, 10) === hearing.date,
  );

  const stale = due.filter(
    (hearing) => hearing.status === 'SCHEDULED' && hearing.date < todayIso && !hearing.outcome,
  );

  const daily = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${todayIso}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - (6 - index));
    const iso = date.toISOString().slice(0, 10);
    const entries = recorded.filter(
      (hearing) => hearing.outcome_recorded_at?.slice(0, 10) === iso,
    ).length;
    return {
      date: iso,
      entries,
      median_seconds: entries > 0 ? median(SEEDED_ENTRY_SECONDS) : 0,
    };
  });

  return {
    same_day_entry_rate: recorded.length === 0 ? 0 : sameDay.length / recorded.length,
    median_entry_seconds: median(SEEDED_ENTRY_SECONDS),
    stale_next_date_count: stale.length,
    total_hearings_due: due.length,
    outcomes_recorded: recorded.length,
    daily,
  };
}

export function buildNotificationMetrics(): NotificationMetrics {
  const dispatches = listDispatches();
  const attempts = dispatches.flatMap((dispatch) => dispatch.attempts);

  const byChannel = (['PUSH', 'SMS', 'EMAIL', 'WHATSAPP'] as const)
    .map((channel) => {
      const channelAttempts = attempts.filter((attempt) => attempt.channel === channel);
      return {
        channel,
        sent: channelAttempts.length,
        delivered: channelAttempts.filter((attempt) => attempt.status === 'DELIVERED').length,
        failed: channelAttempts.filter(
          (attempt) => attempt.status === 'FAILED' || attempt.status === 'BOUNCED',
        ).length,
      };
    })
    .filter((metric) => metric.sent > 0);

  /** push ব্যর্থ হয়ে SMS-এ নামার হার — SMS খরচের মূল চালিকা (§8.3)। */
  const pushFailed = attempts.filter(
    (attempt) => attempt.channel === 'PUSH' && attempt.status === 'FAILED',
  ).length;
  const pushTotal = attempts.filter((attempt) => attempt.channel === 'PUSH').length;

  return {
    by_channel: byChannel,
    fallback_rate: pushTotal === 0 ? 0 : pushFailed / pushTotal,
    segments_this_period: attempts.reduce((sum, attempt) => sum + (attempt.cost_units ?? 0), 0),
  };
}
