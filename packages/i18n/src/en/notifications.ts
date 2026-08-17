import type { Mirror } from '../mirror.js';
import type { bnNotifications } from '../bn/notifications.js';

export const enNotifications: Mirror<typeof bnNotifications> = {
  notifications: {
    title: 'Notifications',
    subtitle: 'What was sent, to whom, over which channel, and whether it arrived.',
    empty: 'No notifications have been sent yet.',
    urgent: 'Urgent',
    recipient: 'Recipient',
    sentAt: 'Sent',
    channels: 'Channels',
    segments: '{{value}} SMS segments',
    tabs: {
      log: 'Sent messages',
      preferences: 'Preferences',
    },
    preferences: {
      title: 'Which message goes over which channel',
      categories: {
        HEARING_REMINDER: 'Hearing reminders',
        DATE_CHANGE: 'Date changes',
        DOCUMENT: 'New documents',
        BILLING: 'Invoices and payments',
      },
      push: 'Push',
      sms: 'SMS',
      email: 'Email',
      quietHours: 'Quiet hours',
      quietHoursHint: 'Nothing but urgent messages is sent during these hours.',
      quietFrom: 'From',
      quietTo: 'To',
      leadTimes: 'How far ahead to remind',
      leadTimeDay: '{{value}} days before',
      leadTimeSameDay: 'On the morning of the hearing',
      dateChangeLocked:
        'Date-change messages cannot be turned off — it is the most urgent thing a client needs.',
      saved: 'Preferences saved',
      save: 'Save',
    },
    sms: {
      title: 'SMS cost',
      used: '{{used}} / {{quota}} segments',
      remaining: '{{value}} segments left',
      periodLabel: 'This month',
      lowWarning: '80% of the quota has been used.',
    },
  },
};
