# CaseFlow BD — Lawyer Web

React 18 + Vite + TypeScript. পূর্ণ পরিকল্পনা → [`docs/05-frontend-plan.md`](../docs/05-frontend-plan.md)

**Sprint 1–7 সম্পন্ন — lawyer web app feature-সম্পূর্ণ।** Foundation,
Client & Case, ★ Core loop, Diary/Calendar/Notifications, metric ও a11y,
Documents & Property, এবং Billing & Settings — সবই চালু; কোনো
"Coming soon" placeholder অবশিষ্ট নেই।
Backend এখনো নেই; সব API call MSW mock-এ যায় (§11)। Mock store in-memory —
তৈরি করা মক্কেল ও মামলা পাতা reload না করা পর্যন্ত টিকে থাকে।

## চালানো

```bash
pnpm install
cp web/.env.example web/.env.local
pnpm dev            # http://localhost:5173
```

**Mock দিয়ে login:**

| ঘর | মান |
|---|---|
| মোবাইল | যেকোনো বৈধ নম্বর — `01XXXXXXXXX` |
| পাসওয়ার্ড | `demo1234` |
| OTP | `123456` |

এই credential গুলো sign-in screen-এ "ডেমো অ্যাকাউন্ট" প্যানেলেও দেখানো হয় —
তবে **শুধু** `import.meta.env.DEV && VITE_API_MOCKING=enabled` হলে।
Production build-এ Vite পুরো শাখাটি বাদ দেয় ([`shared/config/demo.ts`](src/shared/config/demo.ts))।

Backend তৈরি হলে `web/.env.local`-এ `VITE_API_MOCKING=disabled` করুন এবং
`VITE_API_PROXY_TARGET` Django server-এ দেখান।

## Command

| Command | কাজ |
|---|---|
| `pnpm dev` | Dev server (MSW সহ) |
| `pnpm verify` | typecheck → lint → test → build → bundle budget (CI যা চালায়) |
| `pnpm test` | Vitest (workspace-এর সব package) |
| `pnpm --filter @caseflow/web test:watch` | Watch mode |
| `pnpm --filter @caseflow/web test:coverage` | Coverage |
| `pnpm lint` / `pnpm format` | ESLint / Prettier |
| `pnpm --filter @caseflow/web size` | Bundle budget (build-এর পরে) |
| `pnpm build && pnpm --filter @caseflow/web preview` | Production build দেখা |

## গঠন

```
web/src/
├── app/         bootstrap, routing, layout, providers
├── shared/      api, auth, i18n, theme, ui, hooks, config, lib
├── features/    marketing, auth, dashboard, clients, cases, hearings,
│               documents, properties, billing, settings, notifications,
│               metrics, inheritance
└── test/        msw handler, fixture, render helper
```

**Route:** `/` সর্বজনীন landing (উত্তরাধিকার ক্যালকুলেটর সহ) · `/login`, `/otp` auth ·
`/dashboard` থেকে app (auth-gated)।

## ★ Core loop (Sprint 3 / M1)

শুনানির ফলাফল লেখা → পরবর্তী শুনানি, টাইমলাইন এন্ট্রি, পর্যায় পরিবর্তন ও
মক্কেলের নোটিফিকেশন — একবার সংরক্ষণেই।
[`features/hearings/`](src/features/hearings/) · spec: docs/05-frontend-plan.md §7

- **কখনো optimistic নয়** — server নিশ্চিত করার পরেই সাফল্যের বার্তা (FE9)।
- **Draft সুরক্ষিত** — সংরক্ষণ ব্যর্থ হলেও লেখা localStorage-এ থাকে।
- **PE8 measurement** — modal খোলা থেকে save পর্যন্ত সময়, সংশোধনের সংখ্যা ও
  quick-chip ব্যবহার রিপোর্ট হয় ([`entry-metrics.ts`](src/features/hearings/lib/entry-metrics.ts))।
  Sprint 4-এর metric dashboard `setMetricsSink()` দিয়ে যুক্ত হবে।
- **তারিখের ব্যবধান শেখে** — firm-এর median gap মনে রেখে পরের বার সেটিই default।

## কোর্ট ডায়েরি ও ক্যালেন্ডার (Sprint 4)

- **ডায়েরি** ([`pages/DiaryPage`](src/features/hearings/pages/DiaryPage.tsx)) — দিনের সব
  শুনানি এক পর্দায়, keyboard-first। `Ctrl+Enter` সংরক্ষণ করে পরের সারিতে নিয়ে যায়।
  দিনের roster স্থির থাকে; সংরক্ষণের পরেও সারি ও গণনা মিলিয়ে দেখা যায়।
- **ক্যালেন্ডার** — মাসের ছকে দৈনিক গণনা, ভারী দিন ও "ফলাফল লেখা হয়নি" আলাদা রঙে।
- **নোটিফিকেশন** — কোন বার্তা কোন মাধ্যমে গেছে, push→SMS fallback সহ; SMS segment
  গণনা (বাংলা Unicode ৭০ অক্ষর/segment) ও কোটার widget।

## ছুটির দিন

ক্যালেন্ডারে বন্ধের দিন নিষ্প্রভ, আর কারণটি ঘরের accessible name-এ
লেখা থাকে (শুধু রঙে নয় — WCAG 1.4.1)।

| ধরন | উৎস | কেন |
| --- | --- | --- |
| সাপ্তাহিক ছুটি (শুক্র, শনি) | `@caseflow/domain` | স্থির নিয়ম, offline-এও চলে |
| স্থির জাতীয় দিবস (২১ ফেব, ২৬ মার্চ, ১৪ এপ্রিল, ১ মে, ১৬ ও ২৫ ডিসেম্বর) | `@caseflow/domain` | ইংরেজি তারিখ বদলায় না |
| ঈদ, আশুরা, পূজা, আদালতের অবকাশ | **backend (গেজেট)** | চান্দ্র/প্রশাসনিক — অনুমান করা বিপজ্জনক |

চান্দ্র ছুটির তারিখ কোডে **লেখা হয়নি এবং লেখা উচিতও নয়** — চাঁদ দেখার
উপর নির্ভরশীল। ভুল দিনে "আদালত বন্ধ" দেখালে আইনজীবী শুনানি হারাতে
পারেন, তাই backend গেজেট না পাঠানো পর্যন্ত সেসব দিন সাধারণ কর্মদিবস
হিসেবেই দেখাবে। `CalendarDay.holiday` সেই তথ্যের জায়গা; একটি domain
test নিশ্চিত করে যে স্থির তালিকায় কখনো চান্দ্র ছুটি ঢোকেনি।

একাধিক কারণ মিললে অগ্রাধিকার: গেজেট → স্থির জাতীয় দিবস → সাপ্তাহিক
ছুটি। তাই ২৫ ডিসেম্বর শুক্রবারে পড়লেও "বড়দিন" দেখায়। বন্ধের দিনে
শুনানি লেখা থাকলে দিনের প্যানেলে সতর্কবার্তা ওঠে — শুনানি লুকানো হয় না।

## নথি ও সম্পত্তি (Sprint 6)

[`features/documents/`](src/features/documents/) · [`features/properties/`](src/features/properties/)

**নথি** — drag-drop বা native picker, একাধিক ফাইল একসাথে। প্রতিটি ফাইলের
নিজস্ব অবস্থা ও **আলাদা retry**: আদালত থেকে ফেরার পথে ৩G-তে পাঁচটি স্ক্যান
পাঠানোর সময় একটি ব্যর্থ হলে পুরো ব্যাচ আবার পাঠানো নিষ্ঠুর।

- **স্ক্যান শেষ না হলে ফাইল খোলা যায় না** — "আপলোড হয়েছে" আর "খোলা যাবে"
  আলাদা কথা। server স্ক্যান `CLEAN` না হওয়া পর্যন্ত কোনো URL-ই দেয় না, আর
  `PENDING` থাকলে তালিকা নিজে থেকেই আবার আনে।
- **শতাংশ নয়, ধাপ** — mock ও `fetch` কোনোটিই বিশ্বাসযোগ্য byte-progress দেয়
  না, আর বানানো শতাংশ মিথ্যা অগ্রগতি (FE9-এর বিপরীত)। ব্যাচে সত্যিকারের
  "কত-র মধ্যে কত" দেখানো হয়।
- **পুরনো সংস্করণ মুছে না** — ছয় মাস পরে "কোনটি আদালতে দাখিল হয়েছিল"
  প্রশ্নের উত্তর দিতে না পারাটাই সবচেয়ে বড় ক্ষতি।
- **দৃশ্যমানতা (rule A4)** — নতুন নথি শুধু চেম্বারের। খোলা **ও** বন্ধ করা
  দুটোতেই confirm লাগে, এবং কোথাও optimistic নয়।

**সম্পত্তি** — একই জমির সি.এস./এস.এ./আর.এস./বি.এস. জরিপে আলাদা খতিয়ান ও দাগ
থাকে, আর মামলার তর্কটাই প্রায়ই সেই অমিল নিয়ে। তাই জরিপ রেকর্ড একটি ঘর নয়,
একটি তালিকা — সবগুলো পাশাপাশি দেখা যায়।

- দলিল, নামজারি ও খাজনা আলাদা tab-এ; নামজারির অবস্থা রঙে চিহ্নিত।
- **একটিই খোঁজার ঘর, তিন রকম চাবি** — দাগ, খতিয়ান বা মৌজা। আইনজীবী হাতে যা
  লেখা আছে সেটিই টাইপ করেন; কোন ঘরে বসাতে হবে সেটি তাঁর মনে রাখার কথা নয়।
- একই জমি একাধিক মামলায় থাকতে পারে (দেওয়ানি + নামজারি আপিল) — সংযোগ
  সম্পত্তির পাতা থেকে, আর মামলার পাতায় শুধু দেখা ও যাওয়া।

## বিলিং ও সেটিংস (Sprint 7)

[`features/billing/`](src/features/billing/) · [`features/settings/`](src/features/settings/)

**টাকার হিসাব পয়সায়, float-এ নয়** ([`money.ts`](../packages/domain/src/money.ts))।
`0.1 + 0.2 === 0.30000000000000004` — দশটি সারি যোগ করলে সেই ভুল জমে গিয়ে
মোট অঙ্ক এক পয়সা এদিক-ওদিক হয়, আর মক্কেল সেটি ধরলে পুরো হিসাবের
বিশ্বাসযোগ্যতা প্রশ্নের মুখে পড়ে। **UI-র live total আর MSW mock একই
`invoiceTotals()` ব্যবহার করে**, তাই টাইপ করতে করতে যা দেখা যায় আর
সংরক্ষণের পরে যা থাকে — দুটো এক।

- **খসড়া → প্রদত্ত অপরিবর্তনীয়** — issue করার পরে সম্পাদনা বন্ধ, শুধু পরিশোধ
  বা বাতিল। Server-ও ৪০৯ দেয়; UI শুধু বোতাম লুকায় (FE3)।
- **বকেয়ার চেয়ে বেশি পরিশোধে সতর্ক, কিন্তু আটকায় না** — অগ্রিম বা একসাথে
  দুটি চালানের টাকা দেওয়া স্বাভাবিক। সত্য লিখতে বাধা দেওয়ার চেয়ে একবার
  জিজ্ঞেস করা ভালো।
- **`OVERDUE` সংরক্ষিত নয়, গণনাকৃত** — তারিখ ও বকেয়া থেকে। লিখে রাখলে
  তারিখ পেরোনোর পরেও পুরনো অবস্থা দেখাত যতক্ষণ না কেউ কিছু সম্পাদনা করে।
- **সেটিংসে সরাসরি লেটারহেডের নমুনা** — কোন লেখা কাগজে কোথায় যাবে তা
  অনুমান করতে হয় না।

**যা ইচ্ছাকৃতভাবে নেওয়া হয়নি:**

| বাদ | কেন |
| --- | --- |
| Recharts (roadmap-এ ছিল) | gzip-এও ~১০০ KB; route chunk budget ৮০ KB (§12)। মেট্রিক dashboard-এর মতোই সাধারণ `div` দিয়ে বার, আর প্রকৃত সংখ্যা পাশের টেবিলে — screen reader-এও কিছু হারায় না |
| PDF library | দাপ্তরিক PDF **backend** তৈরি করবে, যাতে আইনজীবীর ব্রাউজার, মক্কেলের মোবাইল ও ইমেইলের সংযুক্তি — সব কপি অক্ষরে অক্ষরে এক হয়। আপাতত ব্রাউজারের ছাপার নমুনা, আর সেটি পর্দায় স্পষ্ট করে বলা আছে |

## উত্তরাধিকার ক্যালকুলেটর

ফারায়েজ engine — [`packages/domain/src/inheritance/`](../packages/domain/src/inheritance/)।
সম্পূর্ণ platform-agnostic ও ভগ্নাংশভিত্তিক, তাই mobile app-এও একই কোড চলবে।
বিধির উৎস: `inheritance calculator Rules.docx` (৩১টি বিধি + আসাবার ৪ শ্রেণী + আউল/রদ)।

- হিসাব সম্পূর্ণ ব্রাউজারে — কোনো তথ্য সার্ভারে যায় না।
- প্রতিটি ফলাফল সারি বিধির নম্বরের সাথে যুক্ত; বিধি প্যানেলে সেগুলো চিহ্নিত হয়।
- সীমাবদ্ধতা ও অনুমান `calculate.ts`-এর শীর্ষ comment-এ লেখা আছে।

**Dependency rule:** `features/*` → `shared/*` → `packages/*`।
কোনো feature অন্য feature থেকে import করবে না — ESLint CI-তে এটি block করে।

## যেসব নিয়ম CI-তে enforce করা হয়

- **Typecheck** — strict + `noUncheckedIndexedAccess`
- **কোনো hardcoded user-facing string নয়** — সব `t()` দিয়ে (FE7)
- **`dangerouslySetInnerHTML` নিষিদ্ধ** (§15)
- **Feature/shared import boundary** (§4)
- **a11y** — `jsx-a11y` recommended
- **RBAC matrix test** — প্রতিটি role × capability cell
- **Bundle budget** — initial JS ≤ 180 KB gzip, route chunk ≤ 80 KB (§12)
- **axe (WCAG 2.1 AA)** — প্রধান ছয়টি পর্দা, `src/test/__tests__/a11y.test.tsx`
- **অনুপস্থিত i18n key = test ব্যর্থ** — `t()` কখনো raw key হিসেবে render হবে না

## কর্মক্ষমতা (Sprint 5)

Mock store-এ ৫০০টি মামলা রাখা আছে (৩টি হাতে লেখা + ৪৯৭টি bulk), যাতে
তালিকা আসল মাপে যাচাই করা যায়। Bulk মামলাগুলোর বকেয়া শূন্য — নাহলে
সেগুলো dashboard-এর টাকার হিসাবে যোগ হয়ে যেত।

| মাপ | ফল | লক্ষ্য (NFR N1) |
| --- | --- | --- |
| ৫০০ মামলার তালিকায় প্রথম ৫০ সারি (route transition → DOM commit) | ~৬৬ ms | < ৮০০ ms |
| "আরও দেখুন" → পরের ৫০ সারি | ~৬৬ ms | < ৮০০ ms |

মাপা হয়েছে dev server-এ, MSW mock latency সহ — আসল backend-এর network
সময় এতে ধরা নেই। Virtualization ইচ্ছাকৃতভাবে নেওয়া হয়নি: pagination
network payload-ও কমায়, যা 3G-তে বড় খরচ (`use-cases.ts`-এ যুক্তি লেখা)।

### 3G-তে dashboard — এখনো যাচাই বাকি

Sprint 5-এর demo শর্ত "3G throttle-এ dashboard < 1.2 s" **মাপা হয়নি** —
হাতের browser tooling-এ network throttle করা যায়নি। যা জানা আছে:

| | gzip | budget |
| --- | --- | --- |
| initial JS | 165.9 KB | 180 KB |
| worst route chunk | 12.1 KB | 80 KB |
| CSS | 7.3 KB | 40 KB |

initial payload ≈ ১৭৩ KB। Fast 3G-তে (~200 KB/s) সেটি ~০.৯ s — শর্তের
কাছাকাছি; **Slow 3G-তে (~50 KB/s) ~৩.৫ s — শর্ত ভাঙে**। initial JS
budget-এর **৮৯%** খরচ (১৬১.০ / ১৮০ KB)। Sprint 6-এর শেষে সেটি ৯৬%-এ
পৌঁছেছিল; নিচের lazy locale loading ১৪.৩ KB ফিরিয়ে এনেছে, আর Sprint 7
কোনো chart/PDF library যোগ না করায় বৃদ্ধি ৩.২ KB-তেই থেমেছে।

### Locale chunk

সব string একসাথে পাঠানো মানে লগইন পর্দায় খাজনার রসিদের লেখাও ডাউনলোড
হওয়া। তাই catalogue **core + ৯টি lazy chunk**-এ ভাগ
([`packages/i18n/src/`](../packages/i18n/src/)):

- **core** (static) — app shell, auth, theme, ত্রুটি, validation, আইনি
  বিজ্ঞপ্তি। এগুলো ছাড়া কোনো পর্দাই সম্পূর্ণ হয় না।
- **chunk** (lazy) — landing, dashboard, clients, cases, hearings,
  documents, properties, notifications, metrics। Route-এর component-এর
  সাথে **একই `Promise.all`-এ** আসে, তাই কাঁচা key (`documents.title`)
  কখনো এক frame-এর জন্যও দেখা যায় না।

i18next-এর namespace সুবিধা ইচ্ছাকৃতভাবে নেওয়া হয়নি — তাতে প্রতিটি call
site-কে `t('documents:title')` লিখতে হত। বদলে একটিই `translation`
namespace রেখে chunk গুলো deep-merge করা হয়, তাই `t('documents.title')`
অপরিবর্তিত।

**নতুন feature যোগ করলে:** chunk-টি `routes.tsx`-এ ঘোষণা করুন, আর একই কথা
[`i18n-chunks.test.ts`](src/test/__tests__/i18n-chunks.test.ts)-এর
`ALLOWED`-এ লিখুন। ভুলে গেলে সেই test-ই ব্যর্থ হবে — বাকি test গুলো
setup-এ পুরো catalogue বসিয়ে নেয় বলে তারা এটি ধরতে পারে না।
Lighthouse throttle দিয়ে আসল মাপ Sprint 8-এর budget enforce ধাপে নেওয়া
হবে; সংখ্যা না পাওয়া পর্যন্ত এই শর্ত পাস ধরা হচ্ছে না।

## যা এখনো বাকি (পরের sprint)

**কোনো feature বাকি নেই** — যা বাকি তা Sprint 8-এর hardening ও পুরনো ঋণ:
Storybook (S2 থেকে বকেয়া) · Sentry wiring · Playwright E2E · offline read
cache persist · রঙের বৈসাদৃশ্য হাতে যাচাই (jsdom-এ axe তা মাপতে পারে না)
· 3G throttle-এ dashboard-এর আসল মাপ · আপলোডের byte-progress (backend
multipart চালু হলে)

সবচেয়ে বড় বাকি কাজ frontend-এর বাইরে: **backend**। ৬৭টি endpoint আজও
MSW mock-এ চলে।

## পাঁচটি persona (Sprint 8)

একই app-এ **তিনটি আলাদা জগৎ**, `user_type` দিয়ে ভাগ করা:

| জগৎ | Route | কারা |
|---|---|---|
| চেম্বারের কর্মপরিসর | `/dashboard` … | `LAWYER`, `STAFF` (P2, P3, P4) |
| মক্কেলের portal | `/portal/*` | `CLIENT` (P1) |
| প্ল্যাটফর্ম console | `/admin/*` | `PLATFORM_ADMIN` (P5) |

তিনটি আলাদা app না বানিয়ে একটিতেই রাখা হয়েছে — domain, i18n, design token
ও API client সবই ভাগাভাগি হয়, আর মক্কেলের পর্দায় চেম্বারের নিয়ম ভাঙলে
সেটি একই test suite-এ ধরা পড়ে। ভাগটি `user_type`-এ, capability-তে নয়:
মক্কেল কোনো "কম অনুমতির আইনজীবী" নন, তিনি সম্পূর্ণ আলাদা দর্শক।

ভুল জগতে গেলে 403 নয়, নিজের হোমে redirect ([`home-path.ts`](src/shared/auth/home-path.ts)) —
ব্যবহারকারী নিষিদ্ধ কিছু করেননি, শুধু ভুল দরজায় গেছেন।

### মক্কেলের portal ও rule A4

Portal-এর প্রতিটি response তিনটি ছাঁকনি পেরোয়
([`fixtures/portal.ts`](src/test/fixtures/portal.ts)):

1. **মামলা** — শুধু এই মক্কেলের সাথে যুক্তগুলো
2. **টাইমলাইন ও নথি** — শুধু `client_visible`
3. **ফাইল** — স্ক্যান `CLEAN` না হলে কোনো URL নেই

`Portal*` type গুলো চেম্বারের type-এর `Partial` **নয়**, সম্পূর্ণ আলাদা আকার।
`Partial` হলে কোনো দিন একটি নতুন ঘর যোগ করলেই সেটি নীরবে মক্কেলের পর্দায়
চলে যেত; এখানে `internal_notes` বা প্রতিপক্ষের কৌশল ঢোকানোর জায়গাই নেই।

অন্যের মামলার id দিলে "অনুমতি নেই" নয়, **"পাওয়া যায়নি"** — মামলাটির
অস্তিত্বও ফাঁস হয় না।

### সাক্ষাতের সময় (P1 ↔ চেম্বার)

মক্কেল সময় **চান**, চেম্বার **দেয়** — দুটো আলাদা ধাপ
([`features/appointments`](src/features/appointments/))।

- `requested_*` ও `confirmed_*` আলাদা ঘরে থাকে, তাই চেম্বার অন্য সময়
  দিলেও মক্কেল কী চেয়েছিলেন তা হারায় না।
- চাওয়া সময়েই দিলে `CONFIRMED`; ভিন্ন সময় দিলে **`RESCHEDULED`**। এটি
  ইচ্ছাকৃত — শুধু সবুজ চিহ্ন দেখালে মক্কেল পুরনো সময়েই চেম্বারে হাজির হতেন।
- কারণ লেখা বাধ্যতামূলক, তাই চেম্বার প্রস্তুত হয়ে বসতে পারে।
- সহকারীও (P4) সময় দিতে পারেন — `appointment.manage` তাঁর matrix-এ আছে।

### Persona বদলে দেখা

Backend না থাকায় ভূমিকা বদলে যাচাই করার একমাত্র উপায় লগইনের নম্বর
([`shared/config/demo.ts`](src/shared/config/demo.ts)) — সবগুলোর পাসওয়ার্ড
`demo1234`, OTP `123456`:

| Persona | মোবাইল |
|---|---|
| আইনজীবী / চেম্বার প্রধান (P2, P3) | `01712345678` |
| অ্যাসোসিয়েট (scoped অনুমতি) | `01712345679` |
| চেম্বার সহকারী (P4) | `01712345680` |
| মক্কেল (P1) | `01711223344` |
| প্ল্যাটফর্ম পরিচালক (P5) | `01700000000` |

অন্য যেকোনো বৈধ নম্বরে আইনজীবীর পর্দাই আসে।
