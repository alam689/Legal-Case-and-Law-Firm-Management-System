# CaseFlow BD — মক্কেলের অ্যাপ (Client Mobile App)

Expo React Native app for **persona P1 — the client**
(docs/01-scope §4 "Client Mobile App"; ADR 0007 "Expo React Native")।

চেম্বারের অ্যাপ নয়। আইনজীবীর সব কাজ ওয়েবে (`web/`); Lawyer mobile app
Phase 2 (docs/04 §P2-S5)।

---

## চালানো

```bash
pnpm --filter @caseflow/mobile start
```

তারপর Expo Go-তে QR স্ক্যান, অথবা `a` (Android) / `i` (iOS)।

Backend এখনো নেই, তাই অ্যাপ default-এ নিজের ভেতরের mock server-এ কথা বলে
(`src/shared/api/mock/`)। ডেমো অ্যাকাউন্ট লগইন পর্দাতেই লেখা থাকে:

| | |
|---|---|
| মোবাইল | `01711223344` |
| পাসওয়ার্ড | `demo1234` |
| OTP | `123456` |

আসল server-এ যেতে:

```bash
EXPO_PUBLIC_API_MOCKING=false EXPO_PUBLIC_API_BASE_URL=https://api.example/api/v1 pnpm --filter @caseflow/mobile start
```

---

## পর্দা (docs/01-scope §4)

```
Onboarding → OTP
🏠 হোম          — পরবর্তী তারিখ, উপস্থিতির দাবি, বকেয়া, আইনজীবী
⚖️ আমার মামলা   — তালিকা → বিবরণ (টাইমলাইন / তারিখ / কাগজ)
📅 সাক্ষাৎ      — অনুরোধ (আইনজীবী বাছাই সহ), বাতিল
💰 বিল          — চালান, বকেয়া
⋯ আরও          → কাগজপত্র · বার্তা · আমার সম্পত্তি · আমার আইনজীবী · সেটিংস
```

নিচে **পাঁচটির বেশি ট্যাব নয়** — scope-এর নয়টি পর্দা নয়টি ট্যাব হলে
mid-range Android-এ প্রতিটি এত সরু হত যে বুড়ো আঙুলে লক্ষ্যভেদ লটারি হয়ে
যেত। রোজকার চারটি নিচে, বাকিগুলো "আরও"-তে।

---

## ওয়েবের সাথে কী ভাগ করা, কী নয়

docs/05-frontend-plan.md §16-এর নিয়ম হুবহু মানা হয়েছে।

| ভাগ করা | ভাগ করা হয়নি |
|---|---|
| `@caseflow/api-types` — API-র আকার | Component (web = Tailwind/Radix, mobile = RN primitive) |
| `@caseflow/domain` — enum, label, zod schema | Navigation ও styling |
| `@caseflow/i18n` — সব লেখা (`mobile` chunk এখানেই যোগ হয়েছে) | Token storage (web = memory + cookie, mobile = SecureStore) |
| Query key ও HTTP client-এর **interface** | HTTP adapter |

`packages/*`-এ কোনো `react-dom` বা `react-native` import যায় না — eslint
সেটি আটকায়।

দুটি জিনিস ইচ্ছাকৃতভাবে **নকল করা** হয়েছে, ভাগ নয়:

1. **`src/shared/i18n/formatters.ts`** — ওয়েবের একই ফাইলের প্রতিচ্ছবি।
   তারিখ/টাকার নিয়ম দুই app-এ অবিকল এক থাকতে হবে; সরাতে হলে ওয়েবের সব
   import বদলাতে হয়, সেটি আলাদা কাজ। **দুটো হাতে মিলিয়ে রাখতে হবে।**
2. **`src/shared/theme/tokens.ts`** — `globals.css`-এর HSL মানগুলোর
   অনুবাদ। CSS custom property RN-এ চলে না।

---

## পরীক্ষা

```bash
pnpm --filter @caseflow/mobile test        # jest-expo + @testing-library/react-native
pnpm --filter @caseflow/mobile typecheck
```

Test গুলো hook mock করে না — আসল mock server, আসল query key, আসল locale
chunk-এর ভেতর দিয়ে যায়। তাই fixture বা query key-র ভুলও ধরা পড়ে, শুধু
component-এর নয়।

Metro সত্যিই bundle করতে পারে কি না তা যাচাই করতে:

```bash
pnpm --filter @caseflow/mobile exec expo export --platform android
```

---

## Monorepo-র তিনটি ফাঁদ (সমাধান সহ)

pnpm + Metro + Jest একসাথে করতে গিয়ে তিনটি জায়গায় হোঁচট খেতে হয়েছে।
কনফিগে মন্তব্য আছে, কিন্তু সারাংশ:

1. **`disableHierarchicalLookup` কখনো `true` নয়** (`metro.config.js`)।
   Monorepo-র বহু উদাহরণে এটি চালু করা হয়; pnpm-এ সেটিই বিপর্যয়, কারণ
   প্রতিটি package-এর নিজস্ব নির্ভরতা থাকে `.pnpm/<নাম>@<সংস্করণ>/`-এ আর
   Metro সেগুলো খুঁজে পায় শুধু উপরে হেঁটে।

2. **`.js` → `.ts` resolution**। `packages/*` NodeNext শৈলীতে লেখা
   (`export * from './enums.js'`, ফাইল `enums.ts`)। Vite নিজে সামলায়,
   Metro ও Jest নয় — তাই `metro.config.js`-এ `resolveRequest` আর
   `jest.resolver.js`-এ একই fallback।

3. **`import()` test-এ**। Locale chunk lazy আসে; Jest-এর CJS runtime
   dynamic import পারে না। `babel.config.js`-এ শুধু `env.test`-এ
   `babel-plugin-dynamic-import-node` — আসল bundle-এ code splitting অক্ষত।

আর root `package.json`-এ `pnpm.packageExtensions`: web React 18-এ, mobile
React 19-এ (Expo 57-এর দাবি)। `react-router-dom` ও `lucide-react`
`@types/react` ঘোষণা করে না, তাই pnpm-এর hoisted কপি (১৯) তুলে নিত এবং
**ওয়েবের** typecheck ভাঙত। Peer হিসেবে ঘোষণা করায় প্রত্যেকে নিজের
সংস্করণ পায়।

---

## GitHub Pages

`main`-এ push হলে অ্যাপটি `/<repo>/app/`-এ প্রকাশিত হয়
([`pages.yml`](../.github/workflows/pages.yml))।

দুটি জিনিস sub-path-এর জন্য দরকার হয়েছে:

- **`app.config.js`** (`app.json` নয়) — `experiments.baseUrl` env থেকে আসে
  (`EXPO_BASE_URL`), নাহলে local dev-ও ওই path-এ চলে যেত।
- **`output: 'static'`** (`single` নয়) — Pages কোনো SPA fallback দেয় না,
  তাই `/app/settings` সরাসরি খুললে `single`-এ 404 হত। `static` প্রতিটি
  route-এর HTML আগেই তৈরি করে রাখে।

`src/app/+html.tsx` কেবল web export-এর মোড়ক — `<title>` ও viewport
সেখানেই। এটি ছাড়া প্রকাশিত পাতার শিরোনাম ফাঁকা থাকত।

---

## এখনো বাকি

- **Push notification** — `expo-notifications` + FCM registration
  (docs/04 Sprint 3-এর কাজ)। সেটি না থাকায় সেটিংসে কোনো notification
  সুইচ রাখা হয়নি; যে সুইচ কিছু বদলায় না তা মিথ্যা বলা।
- **Offline cache** — react-query persister; এখন শুধু in-memory।
- **Case linking (কোড/OTP দিয়ে)** — scope §4-এ আছে, backend ছাড়া অর্থহীন।
- **নথি খোলা** — এখন `Linking.openURL`; in-app viewer হলে ভালো।
