/**
 * Expo config — `app.json` থেকে সরিয়ে আনা হয়েছে একটিই কারণে: **baseUrl**।
 *
 * GitHub Pages-এ অ্যাপটি `/<repo>/app/`-এর নিচে বসে, root-এ নয়। সেটি
 * static JSON-এ হাতে লিখে রাখলে local dev-ও ওই path-এ চলে যেত। তাই
 * env থেকে নেওয়া হয় — সাধারণ ক্ষেত্রে খালি (root), আর deploy workflow-এ
 * `EXPO_BASE_URL` বসিয়ে দেওয়া হয়।
 *
 * `output: 'static'` ইচ্ছাকৃত (`single` নয়): Pages কোনো SPA fallback
 * দেয় না, তাই `/app/settings` সরাসরি খুললে `single`-এ 404 হত। `static`
 * প্রতিটি route-এর জন্য আলাদা HTML আগেই তৈরি করে রাখে।
 */
const baseUrl = process.env.EXPO_BASE_URL ?? '';

module.exports = {
  expo: {
    name: 'CaseFlow BD',
    slug: 'caseflow-bd-client',
    scheme: 'caseflowbd',
    version: '0.1.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0B3C7A',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'bd.caseflow.client',
    },
    android: {
      package: 'bd.caseflow.client',
      adaptiveIcon: {
        backgroundColor: '#0B3C7A',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    plugins: ['expo-router', 'expo-secure-store', 'expo-localization'],
    experiments: {
      typedRoutes: true,
      baseUrl,
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/favicon.png',
    },
  },
};
