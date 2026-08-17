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

/** Backend যুক্ত হলে (`VITE_API_MOCKING=disabled`) panel নিজে থেকেই হারিয়ে যাবে। */
export const showDemoCredentials = import.meta.env.DEV && env.apiMocking;
