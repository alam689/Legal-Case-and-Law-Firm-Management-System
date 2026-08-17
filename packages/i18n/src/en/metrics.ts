import type { Mirror } from '../mirror.js';
import type { bnMetrics } from '../bn/metrics.js';

export const enMetrics: Mirror<typeof bnMetrics> = {
  metrics: {
    title: 'Pilot metrics',
    subtitle:
      'The pilot decision rests on these numbers, so each one carries the criterion it answers.',
    criterion: 'Criterion {{code}}',
    target: 'Target {{value}}',
    coreLoop: {
      heading: 'Core loop health',
      sameDayRate: 'Outcomes recorded on the hearing day',
      sameDayTarget: '80% or more',
      medianSeconds: 'Median time per entry',
      medianTarget: 'Under 30 seconds',
      staleCount: 'Date passed with no outcome',
      staleTarget: 'Zero',
      recorded: '{{done}} of {{total}} due hearings recorded',
      seconds: '{{value}}s',
      daily: 'Entries over the last 7 days',
    },
    notifications: {
      heading: 'Notification delivery',
      channel: 'Channel',
      sent: 'Sent',
      delivered: 'Delivered',
      failed: 'Failed',
      rate: 'Success',
      fallbackRate: 'Push failed and fell back to SMS',
      fallbackHint: 'The higher this rate, the higher the SMS bill.',
      segments: 'SMS segments this month',
      deliveryTarget: '97% or more',
    },
    session: {
      heading: 'Entries in this session',
      empty:
        'No outcome has been recorded in this session yet. Record one from the diary or dashboard and it will appear here.',
      hint: 'Measured in this browser just now — this is where you can see the instrumentation working.',
      duration: 'Duration',
      edits: 'Field edits',
      source: 'Source',
      sources: {
        dashboard: 'Dashboard',
        diary: 'Diary',
        case: 'Case page',
      },
    },
    pending: 'Once the backend is connected these figures come from real usage.',
  },
};
