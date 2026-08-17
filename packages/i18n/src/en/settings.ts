import type { Mirror } from '../mirror.js';
import type { bnSettings } from '../bn/settings.js';

export const enSettings: Mirror<typeof bnSettings> = {
  settings: {
    title: 'Settings',
    subtitle: 'Chamber details — what gets printed at the top of invoices and receipts.',
    saved: 'Saved',
    sections: {
      firm: 'Chamber identity',
      letterhead: 'Letterhead',
      invoice: 'Invoice rules',
    },
    fields: {
      name: 'Chamber name',
      nameBn: 'Name in Bangla',
      address: 'Address',
      mobile: 'Mobile number',
      email: 'Email',
      logo: 'Logo',
      letterheadNote: 'Letterhead footer line',
      letterheadNoteHint: 'Bar registration number, chamber number — whatever belongs in print.',
      invoicePrefix: 'Invoice number prefix',
      invoicePrefixHint: 'Applies from the next invoice onwards.',
      nextNumber: 'Next invoice number',
      terms: 'Invoice terms',
      termsHint: 'Printed at the bottom of every invoice.',
    },
    logo: {
      upload: 'Choose logo',
      remove: 'Remove logo',
      hint: 'PNG or JPG; square images look best.',
      none: 'No logo set',
    },
    preview: {
      title: 'Letterhead preview',
      hint: 'This is how invoices and receipts will look.',
    },
    forbidden: 'You do not have permission to change chamber settings.',
  },
};
