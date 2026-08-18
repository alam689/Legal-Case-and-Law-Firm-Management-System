export const bnMobile = {
  mobile: {
    /**
     * শুধু মক্কেলের অ্যাপের লেখা (docs/01-scope §4 — Client Mobile App)।
     *
     * বেশিরভাগ পর্দা `portal`, `appointments`, `billing` chunk-এর লেখাই
     * ব্যবহার করে — ওয়েবের মক্কেল-পর্দা আর অ্যাপ একই কথা বলে, দুই রকম
     * অনুবাদ নয়। এখানে কেবল সেগুলোই যা অ্যাপেই প্রথম দরকার হলো।
     */
    onboarding: {
      title: 'আপনার মামলা, আপনার হাতে',
      subtitle: 'তারিখ, কাগজ ও বিল — সব এক জায়গায়। আপনার আইনজীবীর চেম্বার থেকে সরাসরি।',
      loginTitle: 'মক্কেল লগইন',
      loginSubtitle: 'চেম্বারে যে নম্বরটি দিয়েছেন সেটিই দিন',
      start: 'শুরু করুন',
      demoNotice: 'ডেমো: {{mobile}} · পাসওয়ার্ড {{password}} · OTP {{otp}}',
    },
    tabs: {
      more: 'আরও',
    },
    more: {
      title: 'আরও',
      subtitle: 'কাগজপত্র, সম্পত্তি, আপনার আইনজীবী ও সেটিংস।',
    },
    lawyer: {
      title: 'আপনার আইনজীবী',
      subtitle: 'যিনি আপনার মামলা দেখছেন।',
      chamber: 'চেম্বার',
      call: 'ফোন করুন',
      callChamber: 'চেম্বারে ফোন করুন',
      caseCount: '{{value}}টি মামলা',
      empty: 'এখনো কোনো আইনজীবী যুক্ত হননি।',
    },
    properties: {
      title: 'আমার সম্পত্তি',
      subtitle: 'খতিয়ান, দাগ ও মৌজা — কাগজে নয়, হাতে।',
      empty: 'আপনার নামে কোনো সম্পত্তি সংরক্ষিত হয়নি।',
      mouza: 'মৌজা',
      jlNo: 'জে.এল নং',
      dag: 'দাগ',
      khatian: 'খতিয়ান',
      area: 'পরিমাণ',
      areaUnit: '{{value}} শতক',
      district: 'জেলা',
      linkedCases: 'যুক্ত মামলা',
      /** যে সম্পত্তি নিয়ে মামলা চলছে সেটিই মক্কেল আগে খোঁজেন */
      inDispute: 'মামলাধীন',
    },
    settings: {
      title: 'সেটিংস',
      subtitle: 'ভাষা, থিম ও আপনার তথ্য।',
      language: 'ভাষা',
      theme: 'থিম',
      themeSystem: 'ফোনের সেটিং অনুযায়ী',
      themeLight: 'দিনের আলো',
      themeDark: 'রাতের আঁধার',
      account: 'আপনার তথ্য',
      /** `clients.*` chunk এই পর্দায় আসে না — তাই নিজের key */
      name: 'নাম',
      mobile: 'মোবাইল নম্বর',
      logoutConfirm: 'লগ আউট করবেন?',
      logoutBody: 'আবার ঢুকতে নম্বর ও OTP লাগবে।',
      version: 'সংস্করণ {{value}}',
    },
    offline: {
      title: 'ইন্টারনেট নেই',
      body: 'সংযোগ ফিরলে তথ্য নিজে থেকেই হালনাগাদ হবে।',
    },
  },
} as const;
