# 05 — Frontend Development Plan (Lawyer Web · React)

CaseFlow BD · Annex to [`PROJECT_PLAN.md`](../PROJECT_PLAN.md) · v1.0 · 17 Aug 2026

> এই document শুধু **Lawyer Web (React + Vite + TypeScript)** নিয়ে। Client Mobile (React Native/Expo) আলাদা plan-এ যাবে, কিন্তু §16-এ দেখানো shared layer দুটি app-এ common থাকবে — সেটি day one থেকে ঠিক না করলে পরে duplication অনিবার্য।

---

## 1. Scope

| In scope (Phase 1)                                                                                        | Out of scope                                             |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Lawyer Web SPA — Dashboard, Cases, Clients, Calendar, Court Diary, Documents, Property, Billing, Settings | Client mobile app (RN) — আলাদা track, Sprint 3 থেকে শুরু |
| Quick Hearing Entry (the core loop) ও Court Diary bulk entry                                              | Lawyer mobile app (Phase 2)                              |
| Bangla-first i18n, RBAC-aware UI, design system                                                           | Reports UI (Phase 2), AI review UI (Phase 3)             |
| Contract-first API integration + mock layer                                                               | Platform admin console (Django admin দিয়ে MVP-তে চলবে)  |

**UX investment order** ([`01-scope §1`](01-scope-and-requirements.md#1-personas)): **P2 Advocate → P3 Chamber Head → P4 Assistant**। Web app-এর প্রাথমিক user হলো advocate নিজে ও তার assistant; client web পাবে না, client শুধু mobile।

---

## 2. Frontend Principles

| #        | Principle                                                                                                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FE1**  | **Core loop-এর জন্য সব কিছু bend করবে।** Quick Hearing Entry-এর ≤৩ tap / ≤১৫ সেকেন্ড budget অন্য কোনো feature-এর সুবিধার জন্য ভাঙা যাবে না (PE8 এখানেই measured)।                                                         |
| **FE2**  | **Server state ≠ client state.** সব server data TanStack Query-তে; Redux/Zustand-এ কখনো server entity copy রাখা হবে না। Global store শুধু session, language, layout-এর জন্য।                                              |
| **FE3**  | **UI কখনো security boundary নয়।** Permission-based hiding UX, enforcement নয় — server-ই authority। কিন্তু UI কখনো এমন action দেখাবে না যা server reject করবে (deny-by-default rendering)।                               |
| **FE4**  | **Provenance সবসময় দৃশ্যমান** (rule A1)। যেখানেই date, সেখানেই `source` badge — `LAWYER_ENTERED` / `CONFIRMED` / `OFFICIAL_SYNC`। কোনো screen-এ "নগ্ন" তারিখ থাকবে না।                                                   |
| **FE5**  | **Append-only UI** (rule A2)। Correction UI কখনো "edit/delete" ভাষা ব্যবহার করবে না — "সংশোধন যোগ করুন"। পুরনো event strikethrough হয়, list থেকে হারায় না।                                                              |
| **FE6**  | **`client_visible` explicit ও visually loud** (rule A4)। Toggle-এ confirmation, list-এ badge, bulk release-এ preview। ভুল করে client-কে internal document দেখানো এই product-এর সবচেয়ে ব্যয়বহুল UX bug।                  |
| **FE7**  | **Bangla first, English toggle.** কোনো hardcoded string নয় — ESLint rule দিয়ে enforce। Bangla-তে string দীর্ঘতর, layout সেটি ধরে design হবে।                                                                            |
| **FE8**  | **প্রতিটি screen-এর ৪টি state আছে:** loading (skeleton), empty (actionable), error (retry + support ref), success। PR review-তে চারটিই দেখতে চাওয়া হবে ([`04-roadmap §6`](04-delivery-roadmap.md#6-definition-of-done))। |
| **FE9**  | **Optimistic শুধু নিরাপদ জায়গায়।** Notification trigger করে এমন mutation (outcome save) কখনো optimistic নয় — server confirm না হওয়া পর্যন্ত "পাঠানো হয়েছে" দেখানো যাবে না।                                           |
| **FE10** | **3G ও ৫ বছরের পুরনো laptop হলো baseline।** Bundle budget ও route-level split non-negotiable (§12)।                                                                                                                       |

---

## 3. Stack Decisions (ADR seeds FE-0001 …)

| ADR     | Choice                                                                          | Rejected              | কারণ                                                                          |
| ------- | ------------------------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------- |
| FE-0001 | **React 18 + Vite 5 + TypeScript (strict)**                                     | Next.js               | Auth-gated SPA, SEO অপ্রয়োজনীয়; SSR infra ও cost বাঁচে                      |
| FE-0002 | **React Router v6 (data router)**                                               | TanStack Router       | Team familiarity; typed route helper নিজেরা wrap করে নেওয়া যাবে              |
| FE-0003 | **TanStack Query v5** — সব server state                                         | Redux Toolkit Query   | Cache invalidation ergonomics, offline cache persist plugin                   |
| FE-0004 | **Zustand** — শুধু session/UI state (< 5 store)                                 | Redux                 | Boilerplate অপ্রয়োজনীয়                                                      |
| FE-0005 | **Tailwind CSS + shadcn/ui (Radix)**                                            | MUI / Ant Design      | Radix a11y primitive + full token control; Bangla typography override সহজ     |
| FE-0006 | **React Hook Form + Zod**                                                       | Formik                | Performance (Quick Entry re-render budget), schema server enum থেকে generated |
| FE-0007 | **openapi-typescript + drf-spectacular** — API type generated, hand-written নয় | Manual types          | Contract drift = mobile/web breakage; CI-তে diff check                        |
| FE-0008 | **i18next + react-i18next**, `bn` default, ICU plural                           | react-intl            | Namespace splitting ও lazy load সহজ                                           |
| FE-0009 | **date-fns + date-fns-tz**, fixed `Asia/Dhaka`                                  | Day.js / Luxon        | Tree-shakeable; Bangla locale + numeral formatter নিজেদের wrapper-এ           |
| FE-0010 | **TanStack Table v8** (headless) + TanStack Virtual                             | AG Grid               | ৫০০+ row virtualization, license-free                                         |
| FE-0011 | **MSW** — dev + test-এ একই mock                                                 | Custom mock server    | Backend sprint-এর আগে FE কাজ করতে পারবে (§11)                                 |
| FE-0012 | **Vitest + Testing Library + Playwright**                                       | Jest + Cypress        | Vite pipeline reuse, দ্রুত                                                    |
| FE-0013 | **Access token in memory, refresh token in httpOnly cookie**                    | localStorage-এ token  | XSS-এ token চুরি ঠেকাতে (§6.1)                                                |
| FE-0014 | **Recharts** (Billing dashboard-এ ২–৩টি chart মাত্র)                            | Chart.js / D3         | React-native API, bundle ছোট, lazy-loaded route-এ                             |
| FE-0015 | **pdf.js (`react-pdf`), lazy chunk**                                            | iframe/browser viewer | Presigned URL + sandbox control, page count, Bangla font render               |
| FE-0016 | **pnpm workspace monorepo** (`web/`, `mobile/`, `packages/*`)                   | আলাদা repo            | Shared types/i18n/enums একই commit-এ ঠিক থাকে (§16)                           |

**Node 20 LTS · pnpm 9 · TypeScript strict + `noUncheckedIndexedAccess`।**

---

## 4. Repository & Folder Structure

Repo বর্তমানে docs-only। Sprint 1-এ এই layout তৈরি হবে:

```
caseflow-bd/
├── backend/                 # Django (docs 02 §3 অনুযায়ী)
├── web/                     # ← এই document
├── mobile/                  # Expo (Sprint 3 থেকে)
├── packages/
│   ├── api-types/           # OpenAPI → generated TS types (build artefact, committed)
│   ├── domain/              # enum, label map (bn/en), provenance/status helper
│   └── i18n/                # shared bn/en string catalogue
└── docs/
```

`web/src` — **feature-sliced**, technical-layer-sliced নয়:

```
src/
├── app/                     # bootstrap: providers, router, error boundary, sentry
│   ├── routes.tsx           # route tree + lazy imports + role guard
│   └── providers/           # Query, Auth, I18n, Theme, Toast
├── shared/
│   ├── api/                 # http client, error envelope, pagination, query-key factory
│   ├── auth/                # session, token refresh, <Can>, usePermission
│   ├── ui/                  # shadcn primitives + project components (§9)
│   ├── i18n/                # init, formatters (date, money, Bangla numeral)
│   ├── hooks/  lib/  config/
├── features/
│   ├── auth/                # login, otp, device list
│   ├── dashboard/
│   ├── cases/               # list, detail tabs, create/edit
│   ├── hearings/            # ★ quick-entry, diary, calendar
│   ├── clients/
│   ├── documents/
│   ├── properties/
│   ├── billing/
│   ├── notifications/
│   └── settings/
└── test/                    # msw handlers, fixtures, render helpers
```

প্রতিটি feature folder-এ: `api/` (query+mutation hooks), `components/`, `pages/`, `model/` (zod schema, types), `__tests__/`।

**Dependency rule (backend-এর mirror):** `features/*` → `shared/*` → `packages/*`। কোনো feature অন্য feature থেকে import করবে না; দরকার হলে সেই অংশ `shared/`-এ উঠবে। ESLint `import/no-restricted-paths` দিয়ে CI-তে enforce।

---

## 5. Route Map & Screen Inventory

| Route                                    | Screen                                                              | Primary API                    | Role gate    | Sprint |
| ---------------------------------------- | ------------------------------------------------------------------- | ------------------------------ | ------------ | ------ |
| `/login`, `/otp`, `/register`            | Auth                                                                | `/auth/*`                      | public       | 1      |
| `/`                                      | Lawyer Dashboard — আজকের agenda, counter, financial snapshot, alert | `/dashboard/lawyer`            | any member   | 1 → 7  |
| `/cases`                                 | Case list — search, filter, sort, virtualized                       | `/cases`                       | member       | 2      |
| `/cases/new`, `/cases/:id/edit`          | Case form (multi-step)                                              | `/cases`                       | create perm  | 2      |
| `/cases/:id`                             | Case detail shell + ৭ tab                                           | `/cases/{id}`                  | member       | 2 → 7  |
| `/cases/:id/timeline`                    | Timeline (append-only, correction UI)                               | `/cases/{id}/timeline`         | member       | 3      |
| `/cases/:id/hearings`                    | Hearing history + provenance chain                                  | `/cases/{id}/hearings`         | member       | 3      |
| `/cases/:id/documents`                   | Document list, upload, visibility                                   | `/cases/{id}/documents`        | member       | 6      |
| `/cases/:id/property`                    | Linked property + dag/khatian                                       | `/cases/{id}/properties`       | member       | 6      |
| `/cases/:id/billing`                     | Fee agreement, invoice, ledger                                      | `/cases/{id}/ledger`           | billing perm | 7      |
| `/cases/:id/notes`                       | Internal notes — **client-invisible, banner সহ**                    | `/cases/{id}`                  | member       | 2      |
| `/diary`                                 | **Court Diary — আজকের bulk outcome entry** ★                        | `/hearings/agenda`             | entry perm   | 4      |
| `/calendar`                              | Month view (count badge) + day agenda                               | `/calendar`, `/hearings`       | member       | 4      |
| `/clients` , `/clients/:id`              | Client list/detail, invitation code, CSV import                     | `/clients`                     | member       | 2      |
| `/documents`                             | Firm-wide library, filter by category/case                          | `/documents`                   | member       | 6      |
| `/properties` , `/properties/:id`        | Property list + dag/khatian/mouza search                            | `/properties/search`           | member       | 6      |
| `/billing/invoices`, `/billing/payments` | Invoice list, create, PDF, payment record                           | `/invoices`, `/payments`       | billing perm | 7      |
| `/notifications`                         | Notification centre + delivery status                               | `/notifications`               | member       | 4      |
| `/settings/firm`                         | Firm profile, logo, letterhead                                      | `/firm`                        | firm admin   | 7      |
| `/settings/notifications`                | Preference, quiet hours, SMS quota/cost                             | `/notification-preferences`    | firm admin   | 4      |
| `/settings/workflow`                     | Stage definition viewer (edit = P2)                                 | `/workflows`                   | firm admin   | 2      |
| `/settings/security`                     | Device list, remote logout, audit log                               | `/auth/devices`, `/audit-logs` | firm admin   | 8      |

**Modal, page নয়:** Quick Hearing Entry · Client invitation code · Document upload · Payment record · Visibility change confirm। এগুলো context হারালে core loop ভাঙে।

---

## 6. Cross-Cutting Infrastructure (Sprint 1-এ তৈরি, পরে শুধু ব্যবহার)

### 6.1 Auth & token lifecycle

```
login/otp  ──► access token (15 min)  → memory (Zustand, persist নয়)
           └─► refresh token (7 d)    → httpOnly + Secure + SameSite=Lax cookie
                                         (backend same-site domain; নাহলে fallback:
                                          refresh token memory + silent re-login)

401 ──► single-flight refresh queue ──► retry original request
     └─ refresh fail / reuse detected ──► hard logout + toast + redirect(from=path)
```

- **Single-flight:** একসাথে ৫টি request 401 পেলে **একটি** refresh call, বাকিরা promise-এ queue। এটি না করলে refresh rotation-এর reuse-detection নিজেই user-কে logout করে দেবে।
- Tab-sync: `BroadcastChannel('auth')` — এক tab-এ logout হলে সব tab logout।
- Idle timeout ৩০ মিনিটে re-auth prompt (আইনি data, shared chamber PC)।
- `GET /auth/me` response-এ `firm`, `role`, `capabilities[]`, `verification_status` — এটাই UI permission-এর একমাত্র উৎস (hardcoded role check নয়)।

### 6.2 Permission layer

```tsx
<Can do="hearing.confirm" fallback={<LockedHint />}>
  <ConfirmDateButton />
</Can>
```

- `capabilities[]` server থেকে; `usePermission()` hook; route guard `requireCapability`।
- RBAC matrix ([`01-scope §5`](01-scope-and-requirements.md#5-rbac-matrix)) প্রতিটি cell-এর জন্য একটি component test — Phase 2-এ role বাড়লে matrix test-ই regression net।
- **MVP-তে role দুটি** (`FIRM_ADMIN` = lawyer, client web পায় না), কিন্তু capability abstraction day one-এ — Phase 2-তে ৫ role যোগ হলে UI rewrite হবে না।

### 6.3 API client & query keys

- `http()` wrapper: base URL, auth header, `X-Request-Id` (Sentry correlation), timeout, standardised error envelope → `ApiError { code, message, fieldErrors, requestId }`।
- Cursor pagination helper `useInfiniteList()`; list screen সব infinite scroll নয় — Case list-এ "load more" button (accidental fetch ঠেকাতে, data cost)।
- **Query key factory** (typed, centralised):
  ```ts
  qk.cases.list(filters) | qk.cases.detail(id) | qk.cases.timeline(id);
  qk.hearings.agenda(date) | qk.hearings.calendar(month) | qk.dashboard.lawyer();
  ```
- **Invalidation map — outcome mutation-এর পরে যা যা invalidate হবে** (এটি ভুল হলে lawyer পুরনো তারিখ দেখবে, যা এই product-এ অগ্রহণযোগ্য):
  `hearings.agenda(today)` · `hearings.calendar(both months)` · `cases.detail(caseId)` · `cases.timeline(caseId)` · `cases.list(*)` · `dashboard.lawyer()` · `notifications.list()`।
- Retry: GET ২ বার (exponential), mutation **কখনো auto-retry নয়** (double-dispatch ঝুঁকি; server idempotent হলেও UI-তে নয়)।
- `staleTime`: reference data (court, workflow, district) ২৪ ঘণ্টা + localStorage persist; case/hearing data ৩০ সেকেন্ড; dashboard ৬০ সেকেন্ড + window focus refetch।

### 6.4 Design tokens & typography

| Token            | Decision                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Font             | **Noto Sans Bengali** (Bangla) + Inter (Latin/numeral) — self-hosted subset, `font-display: swap` |
| Base size        | 16px, user font-scaling ১০০–২০০% পর্যন্ত layout ভাঙবে না (NFR N10)                                |
| Tap/click target | ≥ 44px web, ≥ 48px touch-mode                                                                     |
| Contrast         | সব text ≥ 4.5:1 — CI-তে token contrast test                                                       |
| Colour semantics | `status.*` (case status ৭টি), `provenance.*` (৩টি), `urgency.*` — কখনো raw hex, সবসময় token      |
| Density          | Compact table mode (advocate ৫০০ case দেখেন) + comfortable toggle                                 |
| Dark mode        | **MVP-তে নয়** (parking lot) — কিন্তু token layer CSS variable-এ, পরে যোগ করা triv০               |

### 6.5 i18n

- `bn` default, `en` toggle; user preference `/auth/me` থেকে, localStorage-এ mirror।
- Namespace per feature, lazy-loaded; `common`, `errors`, `enums` eager।
- **Enum label একটিই উৎস:** `packages/domain` — case status, outcome, stage, document category সব জায়গায় একই bn/en label। Backend template ও FE label divergence = support nightmare।
- Formatter wrapper (কখনো সরাসরি `toLocaleString` নয়): `formatDate` (৩ variant: full/short/relative), `formatMoney` (৳ ১২,৫০০.০০), `formatNumber` (Bangla numeral toggle — parking lot হলেও formatter API day one-এ)।
- `eslint-plugin-i18next/no-literal-string` — hardcoded string CI fail।
- Bangla string English-এর চেয়ে ~২০–৪০% চওড়া — button ও table header design-এ pseudo-locale test।

### 6.6 State/UX system

- Route-level `<ErrorBoundary>` + Sentry, error card-এ `requestId` copy button (support triage)।
- Skeleton per screen (spinner নয় — perceived latency)।
- Empty state সবসময় actionable ("কোনো মামলা নেই" → "প্রথম মামলা যোগ করুন")।
- Offline banner (`navigator.onLine` + failed-fetch heuristic); read cache TanStack persist থেকে দেখানো হবে "সর্বশেষ sync: ১০ মিনিট আগে" stamp সহ। **Offline write MVP-তে নয়** — blocked mutation-এ স্পষ্ট বার্তা, কারণ ভুল সময়ে queued notification পাঠানো data rot-এর চেয়েও খারাপ।
- Toast + optimistic rollback pattern একটিই `useMutationWithToast()` wrapper-এ।

---

## 7. ★ The Core Loop — Frontend Spec

এটি frontend-এর একমাত্র feature যার নিজস্ব performance budget ও metric আছে।

### 7.1 Quick Hearing Entry (modal)

```
Trigger: Dashboard agenda row · Diary row · Case detail button · কীবোর্ড "O"
┌───────────────────────────────────────────────┐
│ ২৫১/২০২৪ — রহিম বনাম করিম        [Esc]        │
│ আজ ১৭ আগস্ট · যুগ্ম জেলা জজ ২য় আদালত, ঢাকা      │
│───────────────────────────────────────────────│
│ Outcome   [ Adjourned ▾ ]   ← autofocus       │
│ Next date [ ২৫ আগ ২০২৬  📅]  ← smart default  │
│ Stage     [ Evidence ▾ ]     ← workflow-এর next│
│ Note      [__________________]                │
│ ☑ Client-কে জানান     ☐ উপস্থিতি প্রয়োজন        │
│                        [ Ctrl+↵ সংরক্ষণ ]      │
└───────────────────────────────────────────────┘
```

**≤৩ tap / ≤১৫ সেকেন্ড কীভাবে অর্জিত হবে:**

1. **Outcome autofocus + type-ahead** — `a` চাপলেই Adjourned। সবচেয়ে ঘন ঘন ব্যবহৃত outcome আগে (firm-এর নিজের usage history থেকে ordered, localStorage)।
2. **Next date smart default** — outcome `ADJOURNED` হলে সাধারণ adjournment gap (firm-এর median, seed ২১ দিন) pre-filled; date picker-এ "+৭ / +১৪ / +২১ / +৩০ দিন" quick chip; court holiday warning (P2)।
3. **Stage pre-selected** — workflow definition-এর পরবর্তী stage, কিন্তু jump allowed (soft validation, warning only — [`02-arch §7`](02-architecture-and-stack.md#7-configurable-workflow-engine))।
4. **Note optional**, keyboard `Ctrl+Enter` = save। Mouse ছোঁয়া ছাড়াই সম্পূর্ণ flow সম্ভব।
5. **`notify_client` default checked**, কিন্তু client link না থাকলে disabled + hint ("client এখনো app-এ যুক্ত হননি — SMS যাবে")।

**Save behaviour (FE9):**

- Optimistic নয়। Button → spinner → success। Server response থেকেই নতুন hearing id/তারিখ।
- Success card: "পরবর্তী তারিখ ২৫ আগস্ট · client-কে notification পাঠানো হচ্ছে" + **"পরের মামলা →"** (diary mode-এ পরের row-তে auto-advance, modal বন্ধ না করে)।
- Failure: field error inline map, network error → retry button, modal-এর form state কখনো হারাবে না (draft localStorage-এ hearing id key দিয়ে, success-এ clear)।
- Double-submit guard: button disable + client-generated `idempotency_key` header।

**Instrumentation (PE8-এর জন্য অপরিহার্য):** modal open → save success পর্যন্ত সময়, tap count, field correction count → analytics event `hearing_outcome_entry`। Sprint 4-এর metric dashboard-এ এই median দেখা যাবে। **এই measurement ছাড়া pilot exit criteria যাচাই করা অসম্ভব** ([`04-roadmap §7`](04-delivery-roadmap.md#7-metrics--day-one-থেকে-instrumented))।

### 7.2 Court Diary (bulk day entry) — Sprint 4

আজকের সব hearing এক screen-এ; প্রতিটি row-তে inline outcome + next date, Tab দিয়ে row-to-row, `Ctrl+Enter` save-and-next। ৮টি hearing-এর দিনে lawyer একবারও mouse ধরবেন না — এটাই assistant-user (P4) এবং busy advocate-এর জন্য প্রকৃত workflow।

- Row status: pending / saving / saved (✓) / failed (retry chip)।
- Partial failure রয়ে যাবে — একটি row fail হলে বাকিগুলো saved থাকবে, উপরে "৭টির মধ্যে ৬টি সংরক্ষিত" summary।
- Print/PDF view (আদালতে নেওয়ার জন্য কাগজের diary) — advocate-দের কাছে এটি adoption bridge।

### 7.3 Provenance ও correction UI

- `<ProvenanceBadge source>` — LAWYER_ENTERED (নিরপেক্ষ ধূসর) / CONFIRMED (নীল ✓) / OFFICIAL_SYNC (সবুজ 🏛, P4)। Tooltip-এ কে, কখন।
- Date change → পুরনো hearing row `SUPERSEDED`, UI-তে strikethrough + "৩ বার পিছিয়েছে" counter (client-এর কাছে অত্যন্ত মূল্যবান তথ্য, [`03-data-model §7`](03-data-model.md#7-hearing--সবচেয়ে-গুরুত্বপূর্ণ-table))।
- Timeline-এ correction event পুরনোটির নিচে nested, `corrects_event` link সহ। **কোনো delete button নেই, কোথাও নেই।**

---

## 8. Case Detail — ৭ tab

Shell একবার load হবে (`GET /cases/{id}`), tab lazy chunk:

| Tab       | Content                                                                                       | নজর দেওয়ার বিষয়                                                                                 |
| --------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Overview  | Header (number, title, court, status, stage stepper), party, next/last hearing, quick actions | Stage stepper = administrative progress, **কখনো "জেতার সম্ভাবনা" নয়** — label ও tooltip-এ স্পষ্ট |
| Timeline  | Append-only vertical stream, filter, correction                                               | Virtualized (৫ বছরের মামলায় ২০০+ event)                                                          |
| Hearings  | Table + provenance + supersede chain + outcome entry                                          | Previous / current / next একসাথে (F-HEAR-05)                                                      |
| Documents | Category folder, version, `client_visible` toggle, preview                                    | Visibility toggle-এ confirm dialog + audit hint                                                   |
| Property  | Linked property, dag/khatian, "এই property-র অন্য মামলা"                                      | Land practice-এর differentiator view                                                              |
| Billing   | Fee agreement, invoice, payment, ledger                                                       | Amount সবসময় server-computed; FE কখনো due হিসাব করবে না                                          |
| Notes     | Internal notes                                                                                | Persistent red banner: "client কখনো দেখবে না"                                                     |

---

## 9. Shared Component Inventory (Sprint 1–3-এ তৈরি)

**Primitives (shadcn base):** Button, Input, Select, Combobox, DatePicker (Bangla), Dialog, Sheet, Tabs, Table, Toast, Tooltip, Badge, Skeleton, Pagination, FileDrop, ConfirmDialog।

**Domain components — এগুলোই আসল leverage:**

| Component                                                 | দায়িত্ব                                        |
| --------------------------------------------------------- | ----------------------------------------------- |
| `<ProvenanceBadge>`                                       | Date source (FE4)                               |
| `<CaseStatusChip>` / `<StageStepper>`                     | Status ৭টি enum + workflow stage, tooltip সহ    |
| `<HearingCard>` / `<AgendaRow>`                           | Dashboard, diary, calendar — একই component      |
| `<QuickOutcomeForm>`                                      | Modal ও diary row দুটোতেই reuse (§7)            |
| `<CaseTimeline>` / `<TimelineEvent>`                      | Append-only, correction nesting, virtualization |
| `<ClientVisibilityToggle>`                                | Confirm + audit copy + badge (FE6)              |
| `<DateText>` / `<Money>`                      | Formatter-বদ্ধ, raw render কোথাও নয় (bn ও en দুটোই — তাই নাম `BanglaDate` নয়)            |
| `<CourtCombobox>` / `<ClientCombobox>` / `<CaseCombobox>` | Async search + recent + keyboard                |
| `<DagKhatianSearch>`                                      | Structured land search (F-PROP-07)              |
| `<DocumentPreview>`                                       | pdf.js lazy chunk, presigned URL, download log  |
| `<Can>` / `<EmptyState>` / `<ErrorState>` / `<DataTable>` | Cross-cutting                                   |

Storybook Sprint 2 থেকে — designer ও pilot lawyer-কে দেখানোর সবচেয়ে সস্তা উপায়।

---

## 10. Sprint Plan (Backend roadmap-এর সাথে সারিবদ্ধ)

| Sprint               | Backend deliverable        | **Frontend deliverable**                                                                                                                                                                                                                                                                                                        | FE demo                                                |
| -------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **1** · 22 Sep–3 Oct | Auth, tenancy, audit, seed | Repo + Vite + TS + Tailwind/shadcn setup · design token · i18n bootstrap (bn/en) · app shell (sidebar, topbar, firm switcher) · auth flow (login, OTP, refresh single-flight) · `<Can>` + capability layer · API client + query key factory · MSW + fixture · CI (lint, typecheck, test, build, bundle budget)                  | Login → খালি dashboard, bn/en toggle                   |
| **2** · 6–17 Oct     | Client, Case, Workflow     | Client list/detail/create + CSV import UI + invitation code modal · Case list (filter, search, virtualized table, saved filter) · Case create form (multi-step + Zod) · Case detail shell + Overview tab + StageStepper · Notes tab                                                                                             | Client ও case তৈরি, filter করা                         |
| **3** · 20–31 Oct ★  | **Core loop API**          | **`<QuickOutcomeForm>` + modal · outcome mutation + invalidation map · `<CaseTimeline>` + correction UI · Hearings tab + provenance + supersede chain · entry-time instrumentation**                                                                                                                                            | **M1: outcome save → timeline, calendar, client push** |
| **4** · 3–14 Nov     | Notification hardening     | **Court Diary bulk entry (keyboard-first) · Calendar month + day agenda · Dashboard counter · Notification centre + delivery status · notification preference + quiet hours · SMS quota/cost widget**                                                                                                                           | Diary-তে ৮টি hearing ৩ মিনিটে entry                    |
| **5** · 17–28 Nov    | Client app core (RN)       | Web: Dashboard v2 (alert, stale-date warning, agenda) · Case list performance pass (৫০০ case, p95 < 800 ms) · Storybook + a11y audit round ১ · shared `packages/domain` + `packages/i18n` mobile-এর সাথে align                                                                                                                  | 3G throttle-এ dashboard < 1.2 s                        |
| **6** · 1–12 Dec     | Documents & Property       | Document upload (drag-drop, progress, retry, virus-scan pending state) · category folder · version history · `<ClientVisibilityToggle>` + confirm · `<DocumentPreview>` · Property CRUD + LandRecord/Deed/Mutation/Tax form · Dag/Khatian/Mouza search · case↔property link UI                                                  | Khatian upload → dag search → visibility release       |
| **7** · 15–26 Dec    | Billing & Dashboard        | Fee agreement · Invoice create (line item, live total) + PDF preview/download · Payment record modal + receipt · Case ledger · Financial dashboard (Recharts, lazy) · Firm settings (logo, letterhead)                                                                                                                          | Invoice → payment → ledger                             |
| **8** · 29 Dec–9 Jan | Hardening                  | **নতুন feature নয়।** Empty/error/loading sweep · Bangla copy review (native speaker) · a11y round ২ (keyboard, contrast, focus, screen reader) · bundle ও Lighthouse budget enforce · Playwright E2E suite সম্পূর্ণ · onboarding tour + sample data · ToS/Privacy/disclaimer placement · Sentry release + source map · UAT fix | Pilot-ready build                                      |

**Resourcing note:** [`PROJECT_PLAN §7`](../PROJECT_PLAN.md#7-team--resourcing)-এ আলাদা web frontend engineer নেই — founding engineer full-stack হিসেবে web ধরবেন, RN engineer Week 5 থেকে mobile-এ। এটি Sprint 4 ও 6-এ সবচেয়ে বেশি চাপ তৈরি করবে (দুটোই ভারী FE sprint)। **সুপারিশ:** Sprint 3–7-এর জন্য ৫০–১০০% একজন React engineer যোগ করা, নাহলে Sprint 6 (Documents+Property, দুটি বড় module একই sprint-এ) slip করবে এবং সেটি সরাসরি Sprint 8-এর stabilisation window খেয়ে ফেলবে। বিকল্প: Property module-এর advanced form Sprint 7-এ সরানো এবং Sprint 6-এ শুধু read + basic CRUD।

---

## 11. Contract-First Workflow (FE backend-এর জন্য অপেক্ষা করবে না)

```
DRF serializer  ──drf-spectacular──►  openapi.yaml  (repo-তে committed)
                                          │
        ┌─────────────────────────────────┼──────────────────────────┐
        ▼                                 ▼                          ▼
openapi-typescript                  MSW handler                 Schemathesis
→ packages/api-types                (fixture থেকে)              (backend contract test)
        │                                 │
        └────────► web/ + mobile/ ◄───────┘
```

1. Endpoint-এর schema **implementation-এর আগে** merge হবে (contract PR), FE সাথে সাথে MSW mock দিয়ে screen বানাবে।
2. CI-তে `openapi.yaml` regenerate করে diff — schema বদলালে types regenerate না হলে build fail।
3. MSW handler dev, test, Storybook — তিন জায়গায় একই। Fixture-এ **Bangla নাম ও দীর্ঘ string** থাকবে, `Test User` নয় — layout bug আগে ধরা পড়বে।
4. Sprint 3-এর core loop endpoint-এর contract **Sprint 2-এ** finalize করতে হবে, নাহলে M1 ঝুঁকিতে।

---

## 12. Performance Budget (NFR N1 mirror)

| Metric                               | Budget                | Enforcement                                     |
| ------------------------------------ | --------------------- | ----------------------------------------------- |
| Initial JS (gzip)                    | ≤ 180 KB              | `rollup-plugin-visualizer` + CI size-limit gate |
| Route chunk                          | ≤ 80 KB               | Lazy route, vendor split                        |
| Case list p95 (৫০০ case)             | < 800 ms              | Playwright + seeded staging                     |
| Dashboard TTI (3G Fast, mid laptop)  | < 1.2 s               | Lighthouse CI                                   |
| Quick Entry modal open → interactive | < 200 ms              | Preload on agenda hover                         |
| Outcome save → UI updated            | < 1.5 s               | Instrumented                                    |
| Long list                            | Virtualized > 100 row | Code review checklist                           |

Lazy: pdf.js, Recharts, date picker locale, CSV parser, Property module। Font subset (Bangla + Latin + numeral), preload only regular+semibold।

---

## 13. Accessibility & Localisation Checklist

- Keyboard: সব flow mouse ছাড়া সম্পূর্ণ; focus trap modal-এ; visible focus ring; skip-to-content।
- Screen reader: Radix primitive-এর semantics নষ্ট না করা; table caption; live region (save status, toast)।
- Contrast ≥ 4.5:1, font scaling ২০০% পর্যন্ত, tap target ≥ ৪৪/৪৮px (N10 — বয়স্ক advocate প্রকৃত user)।
- Bangla: numeral toggle-ready formatter, Bengali date, দীর্ঘ string layout, `lang` attribute per element (screen reader pronunciation)।
- Motion-reduce respect; কোনো critical তথ্য শুধু রঙে নয় (status chip-এ icon + text)।
- CI: `eslint-plugin-jsx-a11y` + `axe` Playwright-এ প্রতিটি major route-এ।

---

## 14. Frontend Test Strategy

| Level                 | Coverage                                                                                                                                                                                                                                 | Tool                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Unit                  | formatter (date/money/Bangla numeral), permission resolver, query key factory, zod schema                                                                                                                                                | Vitest                          |
| Component             | প্রতিটি domain component-এর ৪ state; `<QuickOutcomeForm>` সম্পূর্ণ interaction                                                                                                                                                           | RTL + user-event                |
| **Permission matrix** | RBAC matrix-এর প্রতিটি cell — render/না-render                                                                                                                                                                                           | Vitest parametrised             |
| **Visibility safety** | Client-invisible data (internal note, `client_visible=false` doc) কোনো client-facing view-এ render হয় না                                                                                                                                | dedicated suite                 |
| Integration           | MSW দিয়ে full screen flow: case create, outcome save + invalidation, document upload                                                                                                                                                    | RTL + MSW                       |
| E2E (staging)         | ① lawyer login → case তৈরি → outcome → timeline update ② diary bulk entry ৫ row ③ document upload → visibility release ④ invoice → payment ⑤ token expiry → refresh → continue ⑥ tenant isolation smoke (Firm-B id → 404 page, leak নয়) | Playwright                      |
| Visual                | Storybook snapshot, bn ও en দুটোতেই                                                                                                                                                                                                      | Chromatic/Playwright screenshot |
| Perf                  | Lighthouse CI + bundle budget                                                                                                                                                                                                            | CI gate                         |

**CI blocking:** typecheck · lint (i18n literal, import boundary, a11y) · unit+component · permission matrix · bundle budget। E2E staging-এ nightly + release-এর আগে।

---

## 15. Frontend Security Notes

- Token: §6.1 (localStorage-এ কখনো নয়)। Logout-এ query cache **সম্পূর্ণ clear** — shared chamber PC-তে পরের user আগের firm-এর data দেখবে না।
- `dangerouslySetInnerHTML` নিষিদ্ধ (ESLint error)। Server-এর কোনো text HTML হিসেবে render হবে না।
- Presigned URL: memory-তে, log-এ নয়, URL bar-এ নয়; ৫ মিনিট TTL UI-তে respected (expiry-তে re-request)।
- PDF viewer sandboxed iframe/worker; external resource load বন্ধ।
- CSP: `default-src 'self'`, `connect-src` API+Sentry, `frame-ancestors 'none'`; inline script নয়।
- Analytics/Sentry-তে **কোনো PII নয়** — case title, client নাম, mobile কখনো event payload বা breadcrumb-এ নয়; শুধু id ও enum। Sentry `beforeSend` scrubber + test।
- URL query-তে sensitive filter (client mobile no.) নয়।
- Dependency: Dependabot + `pnpm audit` CI; lockfile committed।

---

## 16. Shared Layer with Mobile (RN)

| Shared                                                                                       | Not shared                                              |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `packages/api-types` — generated OpenAPI types                                               | Component (web = Tailwind/Radix, mobile = RN primitive) |
| `packages/domain` — enum, label bn/en, provenance/status/stage helper, validation zod schema | Navigation, styling                                     |
| `packages/i18n` — string catalogue (common, enums, errors)                                   | Screen layout                                           |
| Query key convention ও API client interface (adapter আলাদা)                                  | Storage/token adapter                                   |

**নিয়ম:** কোনো React DOM বা RN-specific import `packages/*`-এ যাবে না — CI-তে import boundary check। এই তিনটি package ছাড়া web ও mobile-এ enum label divergence অনিবার্য, এবং সেটি notification template-এর সাথেও মিলবে না।

---

## 17. Frontend Risks

| #   | Risk                                             | Impact                             | Mitigation                                                                                                                     |
| --- | ------------------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| FR1 | Core loop ১৫ সেকেন্ডের বেশি লাগে → PE8 fail      | GA delay                           | Sprint 3 থেকে instrumented; pilot lawyer দিয়ে Sprint 3 ও 4-এ ২ বার timed usability test                                       |
| FR2 | আলাদা web FE engineer নেই; Sprint 4 ও 6 ভারী     | Sprint 8 stabilisation খেয়ে ফেলবে | §10-এর resourcing সুপারিশ, নাহলে Property advanced form Sprint 7-এ সরানো                                                       |
| FR3 | Backend contract দেরিতে → FE blocked             | M1 ঝুঁকি                           | Contract-first + MSW (§11); core loop schema Sprint 2-এ freeze                                                                 |
| FR4 | Bangla layout/font issue দেরিতে ধরা পড়া         | Sprint 8-এ ব্যাপক rework           | Fixture-এ Bangla day one; pseudo-locale test; native speaker copy review প্রতি sprint-এ, শেষে নয়                              |
| FR5 | `client_visible` UI ভুল → internal document leak | বিশ্বাস ধ্বংস, আইনি দায়           | Dedicated visibility test suite (§14); confirm dialog; badge; client-facing view-এ server-side filtered endpoint-ই একমাত্র উৎস |
| FR6 | Token refresh race → random logout               | Adoption ক্ষতি                     | Single-flight refresh + tab sync + E2E test (§14-এর ⑤)                                                                         |
| FR7 | Bundle বেড়ে 3G-তে অব্যবহার্য                    | জেলা শহরে drop-off                 | CI bundle budget gate day one থেকে (পরে যোগ করলে কেউ মানে না)                                                                  |
| FR8 | Design system ছাড়া ad-hoc UI                    | Sprint 6–7-এ inconsistency         | Token + Storybook Sprint 1–2-এ, feature-এর আগে                                                                                 |

---

## 18. Frontend Definition of Done

Backend DoD ([`04-roadmap §6`](04-delivery-roadmap.md#6-definition-of-done))-এর অতিরিক্ত:

- [ ] চারটি state (loading/empty/error/success) implemented ও screenshot-এ দেখানো
- [ ] bn ও en দুটোতেই layout ঠিক; কোনো hardcoded string নেই
- [ ] Keyboard-only দিয়ে সম্পূর্ণ flow সম্ভব; axe violation শূন্য
- [ ] Permission-gated হলে `<Can>` + matrix test
- [ ] Server data দেখালে query key + invalidation পরিকল্পিত ও tested
- [ ] Component test + (screen হলে) MSW integration test
- [ ] Bundle budget-এর মধ্যে; নতুন heavy dependency হলে lazy
- [ ] 3G throttle + ২০০% font scale-এ manual check
- [ ] Storybook story (shared component হলে)

---

## 19. Week-1 Frontend Setup Checklist (Sprint 1-এর প্রথম ৩ দিন)

1. `pnpm` workspace monorepo + `web/` Vite React TS scaffold, strict tsconfig
2. Tailwind + shadcn init, design token file, Noto Sans Bengali subset self-host
3. i18next bootstrap, `bn`/`en` namespace, ESLint no-literal-string
4. `shared/api` http client + error envelope + query key factory + TanStack Query provider
5. MSW + fixture (Bangla data) + Storybook
6. GitHub Actions: typecheck, lint, test, build, bundle-size, Lighthouse (PR preview)
7. Sentry (source map, PII scrubber), env config (`.env.example`, কোনো secret repo-তে নয়)
8. App shell + routing + auth guard skeleton — Sprint 1-এর বাকি কাজ এর উপর বসবে

---

## 20. Open Questions (FE)

| #   | Question                                                                                           | Owner               | Impacts                                                   |
| --- | -------------------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------- |
| FQ1 | Refresh token httpOnly cookie সম্ভব কি (API ও web একই parent domain-এ থাকবে?)                      | Backend + infra     | §6.1 fallback design                                      |
| FQ2 | Assistant (P4) কি MVP-তেই web ব্যবহার করবে, নাকি শুধু lawyer? (Open Question Q3-এর সাথে যুক্ত)     | Discovery interview | Diary UX priority, Sprint 4 scope                         |
| FQ3 | Chamber-এ কী device? (shared desktop / laptop / tablet) — responsive breakpoint ও density decision | Discovery interview | Design system                                             |
| FQ4 | Bangla numeral (১২৩) default হবে, নাকি Latin? বয়স্ক advocate-দের preference                       | Advisor + interview | Formatter default, parking lot থেকে MVP-তে আনা লাগতে পারে |
| FQ5 | Case list-এ default filter কী হওয়া উচিত — "আমার active মামলা" নাকি "আজকের"?                       | Pilot lawyer        | Dashboard vs list-এর ভূমিকা                               |
| FQ6 | Print/PDF diary কি MVP-তে দরকার (কাগজ থেকে transition bridge)?                                     | Pilot lawyer        | Sprint 4 scope                                            |

FQ2–FQ6 **M0-এর ১৫টি interview-এর মধ্যেই** উত্তর পাওয়া উচিত — এগুলো Sprint 2-এর design work শুরুর আগে দরকার।

---

_Prepared 17 August 2026. Frontend estimates assume the resourcing in [`PROJECT_PLAN §7`](../PROJECT_PLAN.md#7-team--resourcing) Option A; §10-এর resourcing সুপারিশ না মানলে Sprint 6–8-এর timeline পুনর্মূল্যায়ন করতে হবে।_
