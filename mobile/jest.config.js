/**
 * jest-expo preset — RN-এর transform, mock ও `__DEV__` সব এতেই আসে।
 *
 * ## `transformIgnorePatterns` কেন হাতে লেখা
 *
 * pnpm প্রতিটি package রাখে `node_modules/.pnpm/<নাম>@<সংস্করণ>/…`-এ, আর
 * jest-expo-র default pattern ধরে নেয় `node_modules/<নাম>/…`। ফলে RN-এর
 * নিজের preset ফাইলটিই transform ছাড়া চলত এবং প্রথম লাইনেই
 * "Cannot use import statement outside a module"।
 *
 * তাই নিয়মটি উল্টো করে লেখা: `.pnpm`-এর ভেতরের যে path-এ RN/Expo/
 * caseflow-এর নাম **নেই**, শুধু সেটিই বাদ যাবে। `@caseflow/*` লাগে কারণ
 * shared package গুলো কাঁচা TypeScript হিসেবেই ব্যবহৃত হয়
 * (`main: ./src/index.ts`), কোনো build step নেই।
 */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  resolver: '<rootDir>/jest.resolver.js',
  /**
   * কিছুই বাদ দেওয়া হয় না — ইচ্ছাকৃত।
   *
   * pnpm প্রতিটি package রাখে `node_modules/.pnpm/<নাম>@<সংস্করণ>/…`-এ,
   * তাই jest-expo-র default allowlist (`node_modules/<নাম>/…`) মেলে না।
   * হাতে allowlist লিখতে গিয়ে দেখা গেল সেটি শেষ হয় না — RN, Expo,
   * expo-router, তার নিজের `standard-navigation`… প্রতিটি ESM নির্ভরতা
   * একে একে ফেল করে, আর প্রতিবার নতুন নাম যোগ করতে হয়।
   *
   * Jest কেবল **যে ফাইলগুলো সত্যিই require হয়** সেগুলোই transform করে,
   * তাই খরচ প্রথম run-এ কয়েক সেকেন্ড — আর বিনিময়ে তালিকাটি কখনো বাসি
   * হয় না। `@caseflow/*`-ও এতে আপনিই ঢোকে (সেগুলো কাঁচা TypeScript)।
   */
  transformIgnorePatterns: [],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
