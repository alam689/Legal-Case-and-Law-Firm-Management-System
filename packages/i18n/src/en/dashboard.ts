import type { Mirror } from '../mirror.js';
import type { bnDashboard } from '../bn/dashboard.js';

export const enDashboard: Mirror<typeof bnDashboard> = {
  dashboard: {
    title: 'Dashboard',
    greeting: 'Assalamu alaikum, {{name}}',
    todayAgenda: "Today's agenda",
    agendaCount: '{{count}} hearings',
    viewAll: 'View all',
    quickEntry: 'Record outcome',
    nextHearing: {
      label: 'Next hearing',
      none: 'No hearing scheduled ahead',
      attendance: 'Client attendance required',
      viewCase: 'Open case',
    },
    alerts: {
      heading: 'Needs attention',
      STALE_NEXT_DATE: 'Date has passed with no outcome recorded',
      MISSING_OUTCOME: 'Hearing outcome still to be recorded',
      SMS_QUOTA_LOW: 'SMS quota is running low',
      UNLINKED_CLIENT: 'Client has not joined the app yet',
    },
    counters: {
      today: "Today's hearings",
      tomorrow: 'Tomorrow',
      thisWeek: 'This week',
      activeCases: 'Active cases',
      outstanding: 'Outstanding',
    },
    empty: {
      agendaTitle: 'No hearings today',
      agendaBody: 'No hearing is scheduled for today.',
      firstCaseTitle: 'No cases yet',
      firstCaseBody: "Add your first case and today's agenda will appear here.",
      firstCaseAction: 'Add your first case',
    },
  },
};
