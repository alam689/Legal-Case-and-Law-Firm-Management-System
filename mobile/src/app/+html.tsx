import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

/**
 * Web export-এর মোড়ক HTML — শুধু `expo export --platform web`-এ ব্যবহৃত,
 * Android/iOS bundle-এ এই ফাইলটি ঢোকেই না।
 *
 * এটি ছাড়া export-করা প্রতিটি পাতার `<title>` ফাঁকা থাকে (expo-router
 * শিরোনামটি hydration-এর পরে JS দিয়ে বসায়), তাই GitHub Pages-এ browser
 * tab-এ শুধু URL দেখা যেত — আর link শেয়ার করলে কোনো নামও থাকত না।
 */
export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* `viewport-fit=cover` — notch-ওয়ালা ফোনে safe area ঠিক রাখে */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta name="description" content="CaseFlow BD — মক্কেলের অ্যাপ (ডেমো)" />
        {/*
         * FE7-এর ব্যতিক্রম, কারণসহ: এই HTML খোলসটি **build-এর সময়**
         * তৈরি হয়, তখন i18next বলে কিছু নেই — `t()` ডাকার কোনো উপায়ই
         * নেই। আর লেখাটি পণ্যের নাম (`common.appName`), যা দুই ভাষাতেই
         * অভিন্ন। অ্যাপ hydrate হওয়ার পরে প্রতিটি পর্দা নিজের অনূদিত
         * শিরোনাম বসিয়ে নেয় (`_layout.tsx`)।
         */}
        {/* eslint-disable-next-line no-restricted-syntax */}
        <title>CaseFlow BD</title>

        {/*
         * RN Web-এর ScrollView body scroll ধরে নেয়; এই reset ছাড়া
         * ডেস্কটপ ব্রাউজারে পাতা দুবার scroll হয়।
         */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
