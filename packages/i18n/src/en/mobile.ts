import type { Mirror } from '../mirror.js';
import type { bnMobile } from '../bn/mobile.js';

export const enMobile: Mirror<typeof bnMobile> = {
  mobile: {
    onboarding: {
      title: 'Your case, in your hand',
      subtitle: 'Dates, papers and bills in one place — straight from your advocate’s chamber.',
      loginTitle: 'Client sign in',
      loginSubtitle: 'Use the number you gave the chamber',
      start: 'Get started',
      demoNotice: 'Demo: {{mobile}} · password {{password}} · OTP {{otp}}',
    },
    tabs: {
      more: 'More',
    },
    more: {
      title: 'More',
      subtitle: 'Papers, property, your advocate and settings.',
    },
    lawyer: {
      title: 'Your advocate',
      subtitle: 'Who is handling your case.',
      chamber: 'Chamber',
      call: 'Call',
      callChamber: 'Call the chamber',
      caseCount: '{{value}} cases',
      empty: 'No advocate has been linked yet.',
    },
    properties: {
      title: 'My property',
      subtitle: 'Khatian, dag and mouza — in hand, not on paper.',
      empty: 'No property has been recorded in your name.',
      mouza: 'Mouza',
      jlNo: 'JL no.',
      dag: 'Dag',
      khatian: 'Khatian',
      area: 'Area',
      areaUnit: '{{value}} decimal',
      district: 'District',
      linkedCases: 'Linked cases',
      inDispute: 'Under litigation',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Language, theme and your details.',
      language: 'Language',
      theme: 'Theme',
      themeSystem: 'Match my phone',
      themeLight: 'Light',
      themeDark: 'Dark',
      account: 'Your details',
      name: 'Name',
      mobile: 'Mobile number',
      logoutConfirm: 'Sign out?',
      logoutBody: 'You will need your number and an OTP to get back in.',
      version: 'Version {{value}}',
    },
    offline: {
      title: 'No internet',
      body: 'Everything refreshes on its own once you are back online.',
    },
  },
};
