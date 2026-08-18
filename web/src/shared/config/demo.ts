import { env } from './env';

/**
 * Demo/mock credential — MSW handler ও sign-in page-এর demo panel
 * দুটোই এখান থেকেই পড়ে, যাতে কখনো অমিল না হয়।
 *
 * ⚠ এই constant গুলো UI-তে দেখানো হয় **শুধু** `showDemoCredentials` true হলে,
 * এবং সেটি `import.meta.env.DEV`-এর সাথে বাঁধা — production build-এ Vite
 * পুরো শাখাটি বাদ দেয়, তাই credential hint কখনো production bundle-এ যাবে না।
 */
export const DEMO_PASSWORD = 'demo1234';
export const DEMO_OTP = '123456';

/**
 * পাঁচটি persona, পাঁচটি নম্বর (docs/01-scope §2)।
 *
 * Backend না থাকায় "চেম্বার প্রধান হিসেবে দেখি" বা "মক্কেল কী দেখেন"
 * যাচাই করার আর কোনো উপায় নেই। নম্বর বদলে লগইন করলেই persona বদলায়,
 * তাই pilot lawyer-কে দেখানোর সময় পাঁচটি দৃষ্টিকোণই দেখানো যায়।
 *
 * অন্য যেকোনো বৈধ নম্বর দিলে আইনজীবীর (P2) পর্দাই আসে — demo-তে ভুল
 * নম্বরে আটকে যাওয়ার চেয়ে সবচেয়ে সাধারণ persona-তে পড়া ভালো।
 */
export const DEMO_PERSONAS = [
  { key: 'advocate', mobile: '01712345678' },
  { key: 'associate', mobile: '01712345679' },
  { key: 'assistant', mobile: '01712345680' },
  { key: 'client', mobile: '01711223344' },
  { key: 'platformAdmin', mobile: '01700000000' },
] as const;

export type DemoPersonaKey = (typeof DEMO_PERSONAS)[number]['key'];

export function demoPersonaFor(mobile: string): DemoPersonaKey {
  return DEMO_PERSONAS.find((persona) => persona.mobile === mobile)?.key ?? 'advocate';
}

/** Backend যুক্ত হলে (`VITE_API_MOCKING=disabled`) panel নিজে থেকেই হারিয়ে যাবে। */
export const showDemoCredentials =
  (import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true') && env.apiMocking;
