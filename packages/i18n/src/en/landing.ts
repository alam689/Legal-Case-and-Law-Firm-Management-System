import type { Mirror } from '../mirror.js';
import type { bnLanding } from '../bn/landing.js';

export const enLanding: Mirror<typeof bnLanding> = {
  landing: {
    nav: {
      features: 'Features',
      howItWorks: 'How it works',
      signIn: 'Sign in',
      getStarted: 'Get started',
    },
    badge: 'Pilot chamber registration is open',
    titleLine1: 'Every date accounted for,',
    titleLine2: 'every client informed.',
    subtitle:
      'Case, hearing, document, land record and billing management for advocates — a dependable successor to the paper diary.',
    ctaPrimary: 'Get started',
    ctaSecondary: 'How it works',
    stats: {
      remindersValue: '7 / 3 / 1 / 0',
      remindersLabel: 'Day-ahead automatic reminders',
      entryValue: '≤ 15s',
      entryLabel: 'To record a hearing outcome',
      recordValue: 'CS–BS',
      recordLabel: 'Khatian, dag and mouza records',
      langValue: 'Bangla',
      langLabel: 'First language, English toggle',
    },
    highlightsTitle: 'At a glance',
    features: {
      eyebrow: 'Platform',
      heading: 'Everything a chamber needs, in one system',
      subheading:
        'From the paper diary to client notifications — the whole working day in a single system.',
      coreLoopTitle: 'The core loop',
      coreLoopBody:
        'Record the outcome and next date once — timeline, calendar, reminders and diary all update together.',
      provenanceTitle: 'Date provenance',
      provenanceBody:
        'Every date is labelled — lawyer entered, confirmed, or synced from an official source.',
      notifyTitle: 'Client notifications',
      notifyBody: 'Push first, SMS if it does not arrive. The same message never goes twice.',
      landTitle: 'Land and khatian',
      landBody:
        'Dag, khatian, mouza and deeds as structured records — not free text, so they are searchable.',
      documentTitle: 'Documents and visibility',
      documentBody: 'Versioned storage; what the client can see stays entirely under your control.',
      billingTitle: 'Billing and ledger',
      billingBody:
        'Fee agreements, invoices, collections and dues — the chamber ledger at a glance.',
    },
    calculator: {
      navLabel: 'Inheritance calculator',
      heading: 'Inheritance calculator',
      subheading: 'Select the heirs and enter the estate — shares are calculated as you type.',
      disclaimer:
        'This is an indicative calculation based on the supplied rules, not legal advice. It applies to what remains after bequests, debts and funeral expenses have been deducted. Consult a practising advocate before any final distribution.',
      heirsTitle: 'List of heirs (Muslim)',
      assetsTitle: 'Estate details',
      resultTitle: 'Result',
      rulesTitle: 'Rules and calculation steps',
      reset: 'Clear all',
      countLabel: '{{heir}} — number',
      assets: {
        land: 'Land',
        landUnit: 'Decimal',
        gold: 'Gold',
        goldUnit: 'Vori',
        silver: 'Silver',
        silverUnit: 'Vori',
        currency: 'Cash',
        currencyUnit: 'Taka',
      },
      table: {
        heir: 'Heir',
        count: 'No.',
        share: 'Share',
        basis: 'Basis',
        land: 'Land (decimal)',
        gold: 'Gold (vori)',
        silver: 'Silver (vori)',
        currency: 'Cash (taka)',
        totalRow: 'Total',
      },
      basis: {
        QURANIC: 'Fixed share',
        RESIDUARY: 'Residuary',
        QURANIC_AND_RESIDUARY: 'Fixed share and residue',
        EXCLUDED: 'Excluded',
      },
      notes: {
        AWL: 'Awl applied — the fixed shares added up to more than 1, so every share was reduced proportionally.',
        RADD: 'Radd applied — there is no residuary, so the shares other than the spouse’s were increased proportionally.',
        UNDISTRIBUTED_RESIDUE:
          'Part of the estate could not be distributed — no further heir is listed. This case needs an advocate’s advice.',
        NO_HEIRS: 'No heir has been selected.',
        UMARIYYATAIN:
          'Umariyyatain — with a spouse and the father present, the mother takes 1/3 of the residue.',
      },
      emptyTitle: 'Select the heirs',
      emptyBody: 'Pick at least one heir from the list above to see the calculation.',
      rules: {
        quranicHeading: 'Quranic heirs (fixed shares)',
        residuaryHeading: 'Asaba (residuaries)',
        stepsHeading: 'Property distribution steps',
        show: 'Show rules',
        hide: 'Hide rules',
      },
      appliedRules: 'Rules applied',
      faq: {
        heading: 'Frequently asked questions',
        subheading: '23 worked examples — any of them can be loaded into the calculator.',
        answerLabel: 'Answer',
        tryExample: 'Open in calculator',
        discrepancyLabel: 'Differs from the published answer',
        note: 'The shares shown are as computed by this calculator.',
      },
    },
    institutions: {
      heading: 'Judiciary institutions',
      note: 'External government websites. CaseFlow BD is not affiliated with or endorsed by these institutions.',
      newTab: '(opens in a new tab)',
    },
  },
};
