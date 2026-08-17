import type { Mirror } from '../mirror.js';
import type { bnStaff } from '../bn/staff.js';

export const enStaff: Mirror<typeof bnStaff> = {
  staff: {
    title: 'Chamber members',
    subtitle: 'Who is here, what they may do, and how much each is carrying.',
    count: '{{value}} members',
    add: 'Add member',
    addTitle: 'New member',
    searchLabel: 'Search by name or number',
    empty: {
      title: 'It is just you',
      body: 'Add an assistant or junior so they can record dates under their own name.',
    },
    emptySearch: {
      title: 'Nobody found',
      body: 'Try a different name or number.',
    },
    table: {
      name: 'Name',
      role: 'Role',
      mobile: 'Mobile',
      cases: 'Active cases',
      hearings: 'Hearings this week',
      due: 'Outstanding',
      status: 'Status',
    },
    fields: {
      fullName: 'Full name',
      fullNameBn: 'Name in Bangla',
      mobile: 'Mobile number',
      email: 'Email',
      role: 'Role',
    },
    active: 'Active',
    inactive: 'Inactive',
    invited: 'Invited',
    neverActive: 'Never signed in',
    lastActive: 'Last seen {{value}}',
    changeRole: 'Change role',
    changeRoleTitle: 'Change role',
    changeRoleBody: "Changing {{name}}'s role changes what they can do, straight away.",
    deactivate: 'Deactivate',
    deactivateTitle: 'Deactivate this member?',
    deactivateBody:
      '{{name}} will no longer be able to sign in. Dates and documents they recorded stay — who wrote them remains in the history.',
    reactivate: 'Reactivate',
    lastAdminWarning: 'At least one firm admin must remain.',
    inviteNote: 'After the invite they can sign in themselves with this number and an OTP.',
    workload: {
      title: 'Workload',
      subtitle: 'Who is carrying how many cases — and which belong to nobody.',
      unassigned: 'Unassigned',
      unassignedHint: 'These cases are in nobody’s name — the main way a case quietly gets lost.',
      totalCases: 'Total active cases',
      viewCases: 'View those cases',
    },
  },
};
