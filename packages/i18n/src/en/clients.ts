import type { Mirror } from '../mirror.js';
import type { bnClients } from '../bn/clients.js';

export const enClients: Mirror<typeof bnClients> = {
  clients: {
    title: 'Clients',
    add: 'New client',
    edit: 'Edit details',
    searchLabel: 'Search by name, mobile or code',
    count: '{{value}} clients',
    backToList: 'Back to clients',
    table: {
      name: 'Name',
      mobile: 'Mobile',
      district: 'District',
      cases: 'Active cases',
      due: 'Outstanding',
      link: 'App',
    },
    linked: 'Linked',
    notLinked: 'Not linked',
    empty: {
      title: 'No clients yet',
      body: 'Add your first client and the list will appear here.',
    },
    emptySearch: {
      title: 'No clients found',
      body: 'Try a different name or mobile number.',
    },
    form: {
      fullName: 'Full name (English)',
      fullNameBn: 'Full name (Bangla)',
      mobile: 'Mobile number',
      altMobile: 'Alternate mobile',
      email: 'Email',
      address: 'Address',
      district: 'District',
      notes: 'Internal notes',
      notesHint: 'The client will never see these notes.',
      nidNotice: 'NID is not collected in the MVP — only the data actually needed.',
      create: 'Add client',
      update: 'Save changes',
    },
    detail: {
      contact: 'Contact',
      cases: 'Cases',
      noCases: 'No cases are linked to this client.',
      addedOn: 'Added on',
    },
    invitation: {
      title: 'App invitation code',
      description:
        'Give this code to the client — they can use it in the app to see their own hearing dates and documents.',
      generate: 'Generate code',
      regenerate: 'New code',
      copy: 'Copy code',
      copied: 'Code copied',
      expires: 'Expires',
      alreadyLinked: 'This client has already joined the app.',
    },
    import: {
      title: 'Import clients from CSV',
      description:
        'Bring in many clients at once from an old register. The first row must contain column names.',
      columns:
        'Required columns: full_name, mobile — optional: full_name_bn, district, address, email',
      chooseFile: 'Choose CSV file',
      preview: 'First {{count}} rows',
      confirm: 'Import {{count}} rows',
      resultCreated: '{{value}} new clients added',
      resultSkipped: '{{value}} skipped (mobile number already exists)',
      resultErrors: '{{value}} rows missing a name or mobile',
      parseError: 'Could not read the file — please check it is a CSV.',
      open: 'Import CSV',
    },
  },
};
