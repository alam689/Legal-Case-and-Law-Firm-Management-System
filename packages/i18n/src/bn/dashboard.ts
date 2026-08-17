export const bnDashboard = {
  dashboard: {
    title: 'ড্যাশবোর্ড',
    greeting: 'আসসালামু আলাইকুম, {{name}}',
    todayAgenda: 'আজকের কার্যতালিকা',
    agendaCount: '{{count}}টি শুনানি',
    viewAll: 'সব দেখুন',
    quickEntry: 'ফলাফল লিখুন',
    nextHearing: {
      label: 'পরবর্তী শুনানি',
      none: 'সামনে কোনো শুনানি নির্ধারিত নেই',
      attendance: 'মক্কেলের উপস্থিতি প্রয়োজন',
      viewCase: 'মামলা দেখুন',
    },
    alerts: {
      heading: 'মনোযোগ প্রয়োজন',
      STALE_NEXT_DATE: 'তারিখ পেরিয়ে গেছে, ফলাফল লেখা হয়নি',
      MISSING_OUTCOME: 'শুনানির ফলাফল লেখা বাকি',
      SMS_QUOTA_LOW: 'SMS কোটা কমে আসছে',
      UNLINKED_CLIENT: 'মক্কেল এখনো অ্যাপে যুক্ত হননি',
    },
    counters: {
      today: 'আজকের শুনানি',
      tomorrow: 'আগামীকাল',
      thisWeek: 'এ সপ্তাহে',
      activeCases: 'চলমান মামলা',
      outstanding: 'বকেয়া',
    },
    empty: {
      agendaTitle: 'আজ কোনো শুনানি নেই',
      agendaBody: 'আজকের তারিখে কোনো মামলার শুনানি নির্ধারিত নেই।',
      firstCaseTitle: 'এখনো কোনো মামলা যোগ করা হয়নি',
      firstCaseBody: 'প্রথম মামলা যোগ করলে আজকের কার্যতালিকা এখানে দেখা যাবে।',
      firstCaseAction: 'প্রথম মামলা যোগ করুন',
    },
  },
} as const;
