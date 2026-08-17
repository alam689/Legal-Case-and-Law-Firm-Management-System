# CaseFlow BD — Development Status

**কী তৈরি হয়েছে, কী বাকি — এক জায়গায়।**

| | |
|---|---|
| **Date** | 17 August 2026 |
| **Last sprint completed** | Sprint 8 — পাঁচটি persona (P1–P5) + সাক্ষাতের সময় |
| **Scope of this document** | Frontend (web) + shared packages |
| **Backend status** | শুরু হয়নি — শুধু design doc |
| **Mobile (RN) status** | শুরু হয়নি — মক্কেল আপাতত web portal ব্যবহার করেন (§2) |
| **Related** | [`PROJECT_PLAN.md`](PROJECT_PLAN.md) · [`docs/04-delivery-roadmap.md`](docs/04-delivery-roadmap.md) · [`docs/05-frontend-plan.md`](docs/05-frontend-plan.md) · [`web/README.md`](web/README.md) |

---

## 1. এক নজরে

Frontend-এর Sprint ১–৮ সম্পন্ন — **[`docs/01-scope`](docs/01-scope-and-requirements.md) §2-এর
পাঁচটি persona-রই নিজস্ব পর্দা আছে**।

আইনজীবীর (P2) কর্মপরিসর আগেই feature-সম্পূর্ণ ছিল; Sprint 8-এ যুক্ত হয়েছে
চেম্বার প্রধানের (P3) সদস্য ব্যবস্থাপনা ও কাজের ভাগ, সহকারীর (P4) নিজস্ব
পরিচয়ে প্রবেশ, মক্কেলের (P1) portal এবং প্ল্যাটফর্ম পরিচালকের (P5)
console। কোনো "Coming soon" placeholder আর অবশিষ্ট নেই।

তবে **দুটি কথা গোড়াতেই স্পষ্ট থাকা দরকার:**

1. **Backend নেই।** ৯০টি endpoint (৪৪ GET · ২৫ POST · ১৪ PATCH · ১ PUT · ৬ DELETE) MSW mock-এ চলে, আর সেই mock-এর
   contract হাতে লেখা [`packages/api-types`](packages/api-types) থেকে
   আসে। অর্থাৎ পুরো frontend আজ পর্যন্ত **একটিও আসল API response
   দেখেনি**। এটিই এই মুহূর্তের সবচেয়ে বড় ঝুঁকি (§7)।
2. **Roadmap-এর তারিখের আগে আছি।** [`04-roadmap`](docs/04-delivery-roadmap.md)
   অনুযায়ী Sprint 1 শুরু ২২ সেপ্টেম্বর ২০২৬; আজ ১৭ আগস্ট। Backend-এর
   অপেক্ষা না করে mock-এর উপর কাজ এগোনো গেছে বলেই এটি সম্ভব হয়েছে।

---

## 2. What is done

### Sprint 1 — Foundation

- pnpm workspace monorepo: `web/` + `packages/{domain,i18n,api-types}`
- Vite 5 · React 18 · TypeScript strict (`noUncheckedIndexedAccess`)
- Tailwind + CSS-variable design token, dark mode
- i18n bootstrap — বাংলা default, English toggle; bn/en key parity type-এ বাঁধা
- App shell (sidebar, topbar), auth flow (password + OTP, single-flight refresh)
- `<Can>` capability layer, API client, query key factory
- MSW + fixture, CI (lint, typecheck, test, build, bundle budget)

### Sprint 2 — Client & Case

- মক্কেল তালিকা / বিস্তারিত / তৈরি, CSV import UI, invitation code
- মামলা তালিকা (search, filter, pagination), বহু-ধাপের মামলা তৈরির ফর্ম (Zod)
- মামলার বিস্তারিত shell + Overview tab + StageStepper + Notes

### Sprint 3 — ★ Core loop (M1)

প্রকল্পের মূল প্রতিশ্রুতি: **একবার তারিখ লিখলে বাকি সব নিজে হবে।**

- `<QuickOutcomeForm>` + dialog, outcome mutation + invalidation map
- `<CaseTimeline>` + সংশোধন UI (append-only, মুছে ফেলা যায় না — A2)
- Hearings tab + provenance + supersede chain
- Entry-time instrumentation (PE8)

### Sprint 4 — Diary, Calendar, Notification

- কোর্ট ডায়েরি — keyboard-first bulk entry
- ক্যালেন্ডার (মাস + দিনের তালিকা), ড্যাশবোর্ড counter
- নোটিফিকেশন কেন্দ্র + delivery status, preference + quiet hours
- SMS quota/cost widget (বাংলা SMS = ৭০ অক্ষর/segment)

### Sprint 5 — Metric, performance, a11y

- মেট্রিক ড্যাশবোর্ড (`/metrics`) — PE1/PE8/O3 মানদণ্ড লেবেলসহ
- মামলার তালিকা ৫০০ মামলায় যাচাই — pagination, load-more
- axe (WCAG 2.1 AA) audit round ১ — ৭টি পর্দা
- `packages/domain` ও `packages/i18n` mobile-এর জন্য portable, regression guard সহ
- ড্যাশবোর্ডের alert এখন কাজের পর্দায় নিয়ে যায়

### Sprint 6 — Documents & Property

- **নথি** — drag-drop + native picker, একাধিক ফাইল একসাথে, প্রতিটির নিজস্ব
  অবস্থা ও **আলাদা retry** (একটি ব্যর্থ হলে পুরো ব্যাচ আবার পাঠাতে হয় না)
- **ভাইরাস স্ক্যান সৎভাবে দেখানো** — স্ক্যান শেষ না হওয়া পর্যন্ত ফাইল খোলা
  যায় না; তালিকা নিজে থেকেই আবার আনে (`PENDING` থাকলে ৩s polling)
- **শ্রেণির ফোল্ডার** + খোঁজা; **সংস্করণ ইতিহাস** (পুরনো সংস্করণ কখনো মুছে না)
- **`<ClientVisibilityToggle>`** — A4: default বন্ধ, খোলা ও বন্ধ **দুটোতেই**
  confirm, কোথাও optimistic নয়
- **`<DocumentPreview>`** — ছবি/PDF inline, বাকিগুলোতে সৎভাবে "ডাউনলোড করুন"
- **সম্পত্তি CRUD** + জরিপ রেকর্ড (CS/SA/RS/BS/সিটি জরিপ…), দলিল, নামজারি ও
  খাজনার ফর্ম
- **একটিই খোঁজার ঘর, তিন রকম চাবি** — দাগ / খতিয়ান / মৌজা (F-PROP-04)
- **মামলা↔সম্পত্তি সংযোগ**; মামলার পাতায় "নথি" ও "সম্পত্তি" tab সক্রিয়

### Sprint 7 — Billing & Settings

- **টাকার হিসাব পয়সায়, float-এ নয়** ([`money.ts`](packages/domain/src/money.ts)) —
  UI-র live total আর mock server **একই function** ব্যবহার করে, তাই টাইপ
  করতে করতে যা দেখা যায় আর সংরক্ষণের পরে যা থাকে, দুটো এক
- ফি-চুক্তি (নির্ধারিত / ধাপভিত্তিক / ঘণ্টাভিত্তিক / রিটেইনার)
- চালান তৈরি — সারি যোগ-বিয়োগ, ছাড়, **live total**; খসড়া → প্রদত্ত ধাপে
  confirm, আর প্রদত্ত চালান অপরিবর্তনীয় (server-ও ৪০৯ দেয়, শুধু UI নয়)
- পরিশোধ ও রসিদ — বকেয়ার চেয়ে বেশি অঙ্কে **সতর্ক, কিন্তু আটকায় না**
  (অগ্রিম দেওয়া স্বাভাবিক); সম্পূর্ণ পরিশোধে অবস্থা নিজেই বদলায়
- মামলার ledger — চার্জ, পরিশোধ ও চলতি ব্যালেন্স; মামলার "বিলিং" tab সক্রিয়
- আর্থিক চিত্র — বকেয়া, মেয়াদোত্তীর্ণ, মাসিক চার্জ বনাম আদায়, বড় দেনাদার
- চেম্বারের সেটিংস — লেটারহেড, লোগো, চালানের উপসর্গ ও শর্তাবলি, **সরাসরি নমুনা সহ**
- `OVERDUE` সংরক্ষিত অবস্থা নয় — তারিখ ও বকেয়া থেকে গণনা হয়, তাই সময়ের
  সাথে আপনাআপনি ঠিক থাকে

> **দুটি ইচ্ছাকৃত বিচ্যুতি (roadmap থেকে):** Recharts নেওয়া হয়নি — gzip-এও
> ~১০০ KB, route chunk budget ৮০ KB; মেট্রিক dashboard-এর মতোই সাধারণ div
> দিয়ে বার আঁকা হয়েছে, আর প্রকৃত সংখ্যা পাশের টেবিলে পাঠযোগ্য। PDF
> library-ও নেওয়া হয়নি — দাপ্তরিক PDF backend থেকে আসবে যাতে সব কপি এক
> হয়; আপাতত ব্রাউজারের ছাপার নমুনা, আর সেটি ব্যবহারকারীকে স্পষ্ট বলা হয়।

### Sprint 8 — পাঁচটি persona (P1–P5)

আগের সাতটি sprint একটিমাত্র persona-কে সেবা দিয়েছে: আইনজীবী (P2)। কারণটি
ছিল সচেতন — তিনি ব্যবহার না করলে কোনো data-ই তৈরি হয় না, আর data ছাড়া
বাকি চারজনের পর্দা শূন্য। সেই শর্তটি পূরণ হওয়ার পরেই বাকিগুলো তোলা হয়েছে।

**P3 — চেম্বার প্রধান** ([`features/staff`](web/src/features/staff/))
- সদস্য যোগ, ভূমিকা পরিবর্তন, নিষ্ক্রিয় করা
- **কাজের ভাগ** — কার হাতে কত মামলা, আর কোনগুলো **কারও হাতেই নেই**
  (মামলা চুপচাপ হারিয়ে যাওয়ার প্রধান পথ)
- শেষ অ্যাডমিনকে নামানো যায় না — নাহলে চেম্বার প্রধান নিজের চেম্বার
  থেকে চিরতরে তালাবন্ধ হয়ে যেতেন, আর backend ছাড়া উদ্ধারের পথ নেই

**P4 — চেম্বার সহকারী**
- পাঁচটি `FirmRole`-ই সক্রিয় (আগে শুধু `FIRM_ADMIN` ছিল), তাই সহকারী
  নিজের পরিচয়ে ঢুকে ডায়েরিতে তারিখ লিখতে পারেন
- অনুমতির সীমা আগের মতোই capability matrix থেকে, `user_type` থেকে নয়

**P1 — মক্কেল** ([`features/portal`](web/src/features/portal/))
- আলাদা খোলস: পাঁচটি গন্তব্য, নিচে tab bar (এক হাতে, mid-range Android)
- হোমে সবচেয়ে বড় কার্ডে **পরবর্তী তারিখ** — এটির জন্যই তিনি অ্যাপ খোলেন
- মামলা, কাগজপত্র, বিল ও পাঠানো বার্তা; সবই **read-only**
- ⚠ **A4 তিন স্তরে** — শুধু নিজের মামলা, শুধু `client_visible` ঘটনা ও নথি,
  আর স্ক্যান শেষ না হলে ফাইল খোলা যায় না। অন্যের মামলার id দিলে
  "অনুমতি নেই" নয়, "পাওয়া যায়নি" — অস্তিত্বও ফাঁস হয় না
- পর্যায় কোড নয়, নাম (`PLAINTIFF_EVIDENCE` কখনো মক্কেলের চোখে পড়ে না)

**P5 — প্ল্যাটফর্ম পরিচালক** ([`features/admin`](web/src/features/admin/))
- Tenant তালিকা, onboarding, plan ও status পরিবর্তন
- SMS-কেন্দ্রিক ব্যবহার ও খরচ — কোটার শতাংশে সাজানো, কারণ প্রশ্নটি
  "কে বেশি পাঠাচ্ছে" নয়, "কে সীমা ছাড়াতে চলেছে"
- স্থগিত করার আগে পরিণতি স্পষ্ট — সেই চেম্বারের **মক্কেলরাও** তারিখ
  জানতে পারবেন না
- Operator চেম্বারের কোনো মামলা/মক্কেল/নথি দেখেন না — সীমানাটি API স্তরেই

**সাক্ষাতের সময় (P1 ↔ চেম্বার)** ([`features/appointments`](web/src/features/appointments/))
- মক্কেল দিন, সময়, মাধ্যম ও **কারণ** দিয়ে সময় চান; কারণ বাধ্যতামূলক, তাই
  চেম্বার প্রস্তুত হয়ে বসতে পারে
- চেম্বার সময় দেয়, বদলায় বা কারণসহ জানিয়ে দেয় — সহকারীও (P4) পারেন
- `requested_*` ও `confirmed_*` আলাদা ঘরে, তাই "আমি তো সকাল চেয়েছিলাম"
  তর্কের প্রমাণ থেকে যায়
- ভিন্ন সময় দিলে অবস্থা `RESCHEDULED`, `CONFIRMED` নয় — নাহলে মক্কেল
  সবুজ চিহ্ন দেখে পুরনো সময়েই চেম্বারে হাজির হতেন
- অনুরোধ কখনো নিজে থেকে পাকা হয় না; মক্কেলকে স্পষ্ট বলা হয় যে চেম্বারের
  নিশ্চিতকরণের অপেক্ষা করতে হবে

**সবার জন্য** — লগইন পর্দায় পাঁচটি persona-র নম্বর; নম্বর বদলে ঢুকলেই
ভূমিকা বদলায়, তাই backend ছাড়াই "মক্কেল কী দেখেন" দেখানো যায়।

### Sprint 8-এর পরে ধরা পড়া দুটি বাগ

১. **লগইনের পরে পাতা মাঝখান থেকে শুরু হত।** `createBrowserRouter` নিজে
   scroll রিসেট করে না, আর browser-এর নিজস্ব restoration client-side
   navigation-এ চলে না — তাই আগের পাতার scroll রয়ে যেত এবং ড্যাশবোর্ডের
   উপরের কার্ড ও sidebar-এর শুরু দেখতে হাতে scroll করতে হত।
   সমাধান: [`ScrollToTopLayout`](web/src/app/providers/ScrollToTopLayout.tsx)।

২. **ড্যাশবোর্ডে কাঁচা key `hearing.entry.open`।** `DashboardRoute`
   `features/hearings`-এর বোতাম inject করে, অথচ route-টি শুধু `dashboard`
   chunk আনত। i18n জালটি file-ভিত্তিক ছিল বলে এটি ধরতে পারেনি — জালটি
   এখন **আসল import graph ধরে হাঁটে**, তাই route-এর গঠনও যাচাই হয়।

### Sprint 6-এর পরে — lazy locale loading (R3-এর ঋণ শোধ)

Sprint 6 শেষে initial JS budget-এর ৯৬% খরচ হয়ে গিয়েছিল, আর বৃদ্ধির প্রায়
পুরোটাই string catalogue — কারণ সব locale একসাথে initial bundle-এ যেত।
Billing-এর copy যোগ হলেই budget ভাঙত।

- Catalogue ২০টি namespace থেকে **core + ৯টি lazy chunk**-এ ভাগ
  ([`packages/i18n/src/`](packages/i18n/src/)); chunk route-এর সাথেই আসে,
  একই Suspense-এ — তাই কাঁচা key কখনো ঝলকায় না
- `t('documents.title')` অপরিবর্তিত — namespace prefix নয়, deep-merge
- **initial JS ১৭২.১ → ১৫৭.৮ KB** (৯৬% → ৮৮%)
- নতুন জাল: কোনো feature তার route-এর load-না-করা chunk ছুঁলে test ব্যর্থ
  ([`i18n-chunks.test.ts`](web/src/test/__tests__/i18n-chunks.test.ts)) —
  বাকি test গুলো পুরো catalogue বসিয়ে নেয় বলে তারা এটি ধরতে পারত না
- পথে ধরা পড়া দুটি বাগ: app shell সব পাতায় "ড্যাশবোর্ড" শিরোনাম দেখাত, আর
  i18next `addResourceBundle` exported constant-টিকে জায়গাতেই বদলে ফেলছিল

### Sprint 5-এর পরে যোগ হয়েছে

- **ছুটির দিন** — সাপ্তাহিক (শুক্র, শনি) ও স্থির জাতীয় দিবস চিহ্নিত;
  চান্দ্র ছুটি ইচ্ছাকৃতভাবে backend-এর হাতে ছাড়া ([`web/README`](web/README.md#ছুটির-দিন))
- **উত্তরাধিকার ক্যালকুলেটর** — Faraid engine (exact rational arithmetic,
  awl/radd/umariyyatain), নিয়ম ও ২৩টি FAQ, দুই ভাষায়; landing page-এ উন্মুক্ত

### চালু route

| Route | অবস্থা |
|---|---|
| `/`, `/login`, `/otp` | ✅ |
| `/dashboard` · `/cases` · `/cases/new` · `/cases/:id` | ✅ |
| `/clients` · `/clients/:id` | ✅ |
| `/diary` · `/calendar` | ✅ |
| `/notifications` · `/metrics` | ✅ |
| `/documents` · `/properties` · `/properties/:id` | ✅ |
| `/billing/invoices` · `/billing/invoices/new` · `/billing/invoices/:id` | ✅ |
| `/settings` · `/staff` · `/appointments` | ✅ |
| `/portal` · `/portal/cases` · `/portal/cases/:id` · `/portal/appointments` · `/portal/documents` · `/portal/invoices` · `/portal/notices` | ✅ মক্কেল (P1) |
| `/admin` · `/admin/firms` · `/admin/usage` | ✅ প্ল্যাটফর্ম (P5) |

### Persona coverage (docs/01-scope §2)

| Persona | পর্দা | অবস্থা |
|---|---|---|
| P1 মক্কেল | `/portal/*` | ✅ web portal — সাক্ষাতের সময়ও চাইতে পারেন (RN app এখনো নয়) |
| P2 আইনজীবী | `/dashboard` ও চেম্বারের সব পর্দা | ✅ |
| P3 চেম্বার প্রধান | `/staff` + আর্থিক চিত্র | ✅ |
| P4 সহকারী | ডায়েরি, নিজের পরিচয়ে | ✅ role সক্রিয় |
| P5 প্ল্যাটফর্ম পরিচালক | `/admin/*` | ✅ |

---

## 3. Quality gates

সবগুলো CI-তে enforce করা (`pnpm verify`)।

| গেট | অবস্থা |
|---|---|
| Test | ৪০৫ (web ২৭৩ · domain ১২৬ · i18n ৬) — সব সবুজ |
| Typecheck | strict, সবুজ |
| Lint | feature/shared import boundary · `dangerouslySetInnerHTML` নিষিদ্ধ · hardcoded string নিষিদ্ধ |
| a11y | axe WCAG 2.1 AA, ১৫টি পর্দা (মক্কেল ও admin সহ); জাল নিজে ইচ্ছাকৃত ত্রুটি ধরে |
| i18n | অনুপস্থিত key = test ব্যর্থ; bn/en parity type-এ বাঁধা |
| Bundle | initial JS **165.0 / 180 KB** gzip · route chunk 12.1 / 80 KB · CSS 7.8 / 40 KB |
| RBAC | প্রতিটি role × capability cell · persona-ভিত্তিক route সীমানা |

**মাপা কর্মক্ষমতা** — ৫০০ মামলার তালিকায় প্রথম ৫০ সারি ~৬৬ ms
(NFR N1 লক্ষ্য < ৮০০ ms)। dev server + MSW-তে মাপা, DOM commit পর্যন্ত।

---

## 4. Carried debt

আগের sprint থেকে ঝুলে থাকা, নতুন feature-এর আগে শোধ করা উচিত।

| কাজ | কবে থেকে বাকি | কেন গুরুত্বপূর্ণ |
|---|---|---|
| **Storybook** | Sprint 2 | designer ও pilot lawyer-কে দেখানোর সবচেয়ে সস্তা উপায় (§9) |
| **3G-তে dashboard-এর আসল মাপ** | Sprint 5 | demo শর্ত < ১.২ s; হিসাব বলছে Slow 3G-তে ভাঙবে (§7) |
| **রঙের বৈসাদৃশ্য যাচাই** | Sprint 5 | jsdom-এ axe মাপতে পারে না, হাতে করতে হবে |
| **Sentry wiring** | Sprint 1 | production-এ ত্রুটি দেখার উপায় নেই |
| **Playwright E2E** | Sprint 8-এর কাজ | core loop-এর end-to-end নিশ্চয়তা |
| **Offline read cache persist** | Sprint 5 | আদালতে নেটওয়ার্ক দুর্বল |
| **আপলোডের byte-progress** | Sprint 6 | এখন ধাপ দেখানো হয় (অপেক্ষমাণ → পাঠানো হচ্ছে → হয়েছে) ও ব্যাচে "কত-র মধ্যে কত"। শতাংশ নেই, কারণ mock ও `fetch` কোনোটিই বিশ্বাসযোগ্য byte-progress দেয় না — বানানো শতাংশ FE9-এর বিপরীত। Backend-এ multipart upload চালু হলে যোগ হবে |

---

## 5. What is next

### Sprint 9 — Hardening (roadmap-এর Sprint 8)

**নতুন feature নয়।** Empty/error/loading sweep · native speaker-এর বাংলা
copy review · a11y round ২ (keyboard, contrast, focus, screen reader) ·
Lighthouse budget enforce · Playwright suite · onboarding tour ·
ToS/Privacy placement · Sentry release + source map · UAT fix

> মক্কেলের portal (P1) নতুন বলে copy review-তে সেটিকেই সবচেয়ে বেশি
> মনোযোগ দেওয়া দরকার — এটিই একমাত্র পর্দা যা non-technical ব্যবহারকারী
> একা, সাহায্য ছাড়া পড়বেন।

---

## 6. Not started

- **Backend** — সম্পূর্ণ। **এটিই এখন একমাত্র critical path** — frontend-এর
  আর কোনো feature বাকি নেই, তাই পরবর্তী প্রকৃত অগ্রগতি backend থেকেই আসবে।
- **Client mobile app (RN)** — roadmap অনুযায়ী আলাদা track। মক্কেল আপাতত
  web portal (`/portal`) ব্যবহার করেন; `packages/domain` ও `packages/i18n`
  portable রাখা আছে বলে RN-এ একই যুক্তি ও লেখা পুনরায় ব্যবহার করা যাবে।
  Push notification RN ছাড়া সম্ভব নয় — portal-এ শুধু পাঠানো বার্তার তালিকা
- **AI feature** — [`PROJECT_PLAN`](PROJECT_PLAN.md)-এ আছে, frontend-এ কোনো কাজ হয়নি
- **Deployment / infra** — CI আছে, CD নেই

---

## 7. Risks

| # | ঝুঁকি | প্রভাব | কী করা যায় |
|---|---|---|---|
| R1 | **Contract drift** — সব কিছু হাতে লেখা `api-types` ও MSW-র উপর দাঁড়ানো; আসল API আলাদা হলে অনেক জায়গায় ভাঙবে | উচ্চ | Backend শুরু হলেই core loop-এর schema আগে freeze করা; OpenAPI থেকে type generate করা |
| R2 | **কিছুই commit করা হয়নি** — পাঁচ sprint-এর কাজ একটিমাত্র docs-only commit-এর উপরে, ১৭টি path uncommitted | উচ্চ | পর্যালোচনাযোগ্য commit-এ ভাগ করা (এখনই করা যায়) |
| R3 | **Bundle** — initial JS budget-এর **৮৯%** (১৬১.০ / ১৮০ KB)। Sprint 6-এর পরে ৯৬%-এ পৌঁছেছিল; lazy locale loading (§2) ১৪.৩ KB ফিরিয়ে এনেছে। এখন নতুন feature-এর string আর initial bundle বাড়ায় না, শুধু কোড বাড়ায় | মাঝারি | Sprint 7 কোনো chart/PDF library যোগ করেনি বলেই ৮৯%-এ থেমেছে; ভবিষ্যতে ভারী নির্ভরতা এলে সেটি route chunk-এ lazy রাখা। প্রতি PR-এ `pnpm size` ইতিমধ্যেই gate |
| R4 | **3G-তে মাপা হয়নি** — হিসাব বলছে Fast 3G-তে ~০.৯ s, Slow 3G-তে ~৩.৫ s | মাঝারি | Lighthouse throttle দিয়ে আসল মাপ; দরকারে initial payload কমানো |
| R5 | **একজনই full-stack** — roadmap §10-এ আলাদা FE engineer ধরা হয়নি | মাঝারি | Sprint 6–7-এ React engineer যোগ করা |

---

## 8. চালানো ও যাচাই

```bash
pnpm install && pnpm --filter @caseflow/web dev
```

```bash
pnpm verify
```

ডেমো লগইন, mock data ও architecture-এর নিয়ম → [`web/README.md`](web/README.md)।
Backend না থাকা পর্যন্ত সব তথ্য নমুনা, কিছুই সংরক্ষিত হয় না।
