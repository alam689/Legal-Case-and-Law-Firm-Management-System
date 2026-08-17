# CaseFlow BD — Development Status

**কী তৈরি হয়েছে, কী বাকি — এক জায়গায়।**

| | |
|---|---|
| **Date** | 17 August 2026 |
| **Scope of this document** | Frontend (web) + shared packages |
| **Backend status** | শুরু হয়নি — শুধু design doc |
| **Mobile (RN) status** | শুরু হয়নি |
| **Related** | [`PROJECT_PLAN.md`](PROJECT_PLAN.md) · [`docs/04-delivery-roadmap.md`](docs/04-delivery-roadmap.md) · [`docs/05-frontend-plan.md`](docs/05-frontend-plan.md) · [`web/README.md`](web/README.md) |

---

## 1. এক নজরে

Frontend-এর Sprint ১–৫ সম্পন্ন। Lawyer web app চলে, লগইন থেকে শুরু করে
মামলা, মক্কেল, শুনানির ফলাফল, ডায়েরি, ক্যালেন্ডার, নোটিফিকেশন ও
মেট্রিক পর্যন্ত — সবই ব্যবহারযোগ্য।

তবে **দুটি কথা গোড়াতেই স্পষ্ট থাকা দরকার:**

1. **Backend নেই।** ৩২টি endpoint (১৯ GET · ১০ POST · ৩ PATCH) MSW mock-এ চলে, আর সেই mock-এর
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
| `/documents` · `/properties` · `/billing/invoices` · `/settings` | ⏳ "Coming soon" placeholder |

---

## 3. Quality gates

সবগুলো CI-তে enforce করা (`pnpm verify`)।

| গেট | অবস্থা |
|---|---|
| Test | ২৭৮ (web ১৬২ · domain ১১৩ · i18n ৩) — সব সবুজ |
| Typecheck | strict, সবুজ |
| Lint | feature/shared import boundary · `dangerouslySetInnerHTML` নিষিদ্ধ · hardcoded string নিষিদ্ধ |
| a11y | axe WCAG 2.1 AA, ৭টি পর্দা; জাল নিজে ইচ্ছাকৃত ত্রুটি ধরে |
| i18n | অনুপস্থিত key = test ব্যর্থ; bn/en parity type-এ বাঁধা |
| Bundle | initial JS **165.9 / 180 KB** gzip · route chunk 12.1 / 80 KB · CSS 7.3 / 40 KB |
| RBAC | প্রতিটি role × capability cell |

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

---

## 5. What is next

### Sprint 6 — Documents & Property (roadmap: ১–১২ ডিসেম্বর)

- Document upload — drag-drop, progress, retry, virus-scan pending state
- Category folder, version history
- `<ClientVisibilityToggle>` + confirm (A4: client-visible default বন্ধ)
- `<DocumentPreview>`
- Property CRUD + LandRecord / Deed / Mutation / Tax ফর্ম
- দাগ / খতিয়ান / মৌজা search, মামলা↔সম্পত্তি সংযোগ UI

> ⚠️ Roadmap §10-এ চিহ্নিত: Sprint 6-এ দুটি বড় module একসাথে — এটিই
> slip করার সবচেয়ে সম্ভাব্য জায়গা। Property-র advanced ফর্ম Sprint 7-এ
> সরানোর বিকল্প খোলা রাখা হয়েছে।

### Sprint 7 — Billing & Dashboard (roadmap: ১৫–২৬ ডিসেম্বর)

- Fee agreement · invoice তৈরি (line item, live total) + PDF preview
- Payment record + receipt · মামলার ledger
- আর্থিক dashboard (Recharts, lazy) · firm settings (logo, letterhead)

### Sprint 8 — Hardening (roadmap: ২৯ ডিসেম্বর–৯ জানুয়ারি)

**নতুন feature নয়।** Empty/error/loading sweep · native speaker-এর বাংলা
copy review · a11y round ২ (keyboard, contrast, focus, screen reader) ·
Lighthouse budget enforce · Playwright suite · onboarding tour ·
ToS/Privacy placement · Sentry release + source map · UAT fix

---

## 6. Not started

- **Backend** — সম্পূর্ণ। এটিই critical path।
- **Client mobile app (RN)** — roadmap অনুযায়ী Sprint 3 থেকে আলাদা track
- **AI feature** — [`PROJECT_PLAN`](PROJECT_PLAN.md)-এ আছে, frontend-এ কোনো কাজ হয়নি
- **Deployment / infra** — CI আছে, CD নেই

---

## 7. Risks

| # | ঝুঁকি | প্রভাব | কী করা যায় |
|---|---|---|---|
| R1 | **Contract drift** — সব কিছু হাতে লেখা `api-types` ও MSW-র উপর দাঁড়ানো; আসল API আলাদা হলে অনেক জায়গায় ভাঙবে | উচ্চ | Backend শুরু হলেই core loop-এর schema আগে freeze করা; OpenAPI থেকে type generate করা |
| R2 | **কিছুই commit করা হয়নি** — পাঁচ sprint-এর কাজ একটিমাত্র docs-only commit-এর উপরে, ১৭টি path uncommitted | উচ্চ | পর্যালোচনাযোগ্য commit-এ ভাগ করা (এখনই করা যায়) |
| R3 | **Bundle-এ জায়গা কম** — initial JS budget-এর ৯২% খরচ, অথচ Documents, Property ও Billing এখনো বাকি | মাঝারি | Sprint 6-এর আগে vendor chunk পর্যালোচনা; ভারী নির্ভরতা lazy করা |
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
