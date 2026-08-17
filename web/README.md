# CaseFlow BD — Lawyer Web

React 18 + Vite + TypeScript. পূর্ণ পরিকল্পনা → [`docs/05-frontend-plan.md`](../docs/05-frontend-plan.md)

**Sprint 1 (Foundation), 2 (Client & Case), 3 (★ Core loop), 4 (Diary,
Calendar, Notifications) ও 5-এর frontend (metric dashboard, তালিকার
কর্মক্ষমতা, a11y audit) — সম্পন্ন।**
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
├── features/    marketing, auth, dashboard, clients, cases, hearings, inheritance
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
budget-এর ৯২% ইতিমধ্যে খরচ হয়ে গেছে, তাই এটি নজরে রাখার মতো ঝুঁকি।
Lighthouse throttle দিয়ে আসল মাপ Sprint 8-এর budget enforce ধাপে নেওয়া
হবে; সংখ্যা না পাওয়া পর্যন্ত এই শর্ত পাস ধরা হচ্ছে না।

## যা এখনো বাকি (পরের sprint)

Storybook (S2 থেকে বকেয়া) · Sentry wiring · Playwright E2E (S8) · offline read
cache persist · রঙের বৈসাদৃশ্য হাতে যাচাই (jsdom-এ axe তা মাপতে পারে না)
· 3G throttle-এ dashboard-এর আসল মাপ
