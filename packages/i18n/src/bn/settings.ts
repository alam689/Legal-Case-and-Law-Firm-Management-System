export const bnSettings = {
  settings: {
    title: 'সেটিংস',
    subtitle: 'চেম্বারের তথ্য — চালান ও রসিদের মাথায় যা ছাপা হবে।',
    saved: 'সংরক্ষিত হয়েছে',
    sections: {
      firm: 'চেম্বারের পরিচয়',
      letterhead: 'লেটারহেড',
      invoice: 'চালানের নিয়ম',
    },
    fields: {
      name: 'চেম্বারের নাম',
      nameBn: 'বাংলায় নাম',
      address: 'ঠিকানা',
      mobile: 'মোবাইল নম্বর',
      email: 'ইমেইল',
      logo: 'লোগো',
      letterheadNote: 'লেটারহেডের নিচের লাইন',
      letterheadNoteHint: 'বার নিবন্ধন নম্বর, চেম্বার নম্বর — যা ছাপায় থাকা দরকার।',
      invoicePrefix: 'চালান নম্বরের উপসর্গ',
      invoicePrefixHint: 'পরের চালান থেকে কার্যকর হবে।',
      nextNumber: 'পরের চালান নম্বর',
      terms: 'চালানের শর্তাবলি',
      termsHint: 'প্রতিটি চালানের নিচে ছাপা হবে।',
    },
    logo: {
      upload: 'লোগো বাছুন',
      remove: 'লোগো সরান',
      hint: 'PNG বা JPG, বর্গাকার হলে ভালো দেখায়।',
      none: 'কোনো লোগো দেওয়া হয়নি',
    },
    preview: {
      title: 'লেটারহেডের নমুনা',
      hint: 'চালান ও রসিদে এভাবেই দেখা যাবে।',
    },
    forbidden: 'চেম্বারের সেটিংস বদলানোর অনুমতি আপনার নেই।',
  },
} as const;
