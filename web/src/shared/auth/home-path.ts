import type { UserType } from '@caseflow/domain';

/**
 * কে লগইন করলে কোথায় যাবেন।
 *
 * একই app-এ তিনটি আলাদা জগৎ: চেম্বারের কর্মপরিসর (`/dashboard`), মক্কেলের
 * portal (`/portal`) ও platform-এর admin console (`/admin`)। তিনটি আলাদা
 * app না বানিয়ে একটিতেই রাখা হয়েছে — domain, i18n, design token ও API
 * client সবই ভাগাভাগি হয়, আর মক্কেলের পর্দায় চেম্বারের নিয়ম ভাঙলে
 * সেটি একই test suite-এ ধরা পড়ে।
 *
 * ভাগটি user_type-এ, capability-তে নয়: মক্কেল কোনো "কম অনুমতির আইনজীবী"
 * নন, তিনি সম্পূর্ণ আলাদা দর্শক।
 */
export function homePathFor(userType: UserType | null | undefined): string {
  switch (userType) {
    case 'CLIENT':
      return '/portal';
    case 'PLATFORM_ADMIN':
      return '/admin';
    default:
      return '/dashboard';
  }
}
