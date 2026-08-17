import { Outlet, ScrollRestoration } from 'react-router-dom';

/**
 * প্রতিটি navigation-এর পরে পাতা উপরে ফেরে।
 *
 * `createBrowserRouter` নিজে থেকে scroll রিসেট করে না — browser-এর নিজস্ব
 * restoration client-side navigation-এ চলে না। ফলে লম্বা তালিকা থেকে লগইন
 * পেরিয়ে ড্যাশবোর্ডে গেলে পাতাটি মাঝখান থেকে শুরু হত, আর উপরের কার্ড ও
 * sidebar-এর শুরুটা দেখতে হাতে scroll করতে হত।
 *
 * `ScrollRestoration` data router-এর ভেতরে থাকতেই হয়, তাই একটি pathless
 * root route — এটি কোনো layout আঁকে না, শুধু আচরণটি যোগ করে।
 */
export function ScrollToTopLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}
