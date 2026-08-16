# 01 — Scope & Requirements

CaseFlow BD · Annex to [`PROJECT_PLAN.md`](../PROJECT_PLAN.md) · v1.0 · 16 Aug 2026

---

## 1. Personas

| # | Persona | Context | Primary need | Success looks like |
|---|---|---|---|---|
| P1 | **Client** (Khorshed) | ১–৩টি মামলা, non-technical, Bangla-first, mid-range Android | "আমার পরের তারিখ কবে? কী অবস্থা?" | Lawyer-কে ফোন না করেই উত্তর পাওয়া |
| P2 | **Solo Advocate** | 150–400 মামলা, paper diary, দিনে ৫–১০টি hearing | "আজ কোন কোন মামলা? কার টাকা বাকি?" | সকালে এক screen-এ পুরো দিন |
| P3 | **Chamber Head** | ৩–১৫ জন lawyer, staff আছে | "Firm-এর portfolio ও আয় কোথায়?" | Firm-level dashboard ও report |
| P4 | **Chamber Assistant** (Phase 2) | Date entry, document, client call | "দ্রুত date update করা" | Cause list দেখে bulk entry |
| P5 | **Platform Admin** | SaaS operator | Tenant, subscription, support | Firm onboarding + usage/SMS monitoring |

**Design priority:** P2 (Advocate) হলো প্রকৃত customer — সে না ব্যবহার করলে P1-এর কাছে কোনো data-ই পৌঁছাবে না। তাই UX investment-এর order: **P2 → P1 → P3 → P4**।

---

## 2. The Core Loop (MVP-এর হৃদয়)

MVP-এর সব feature এই একটি loop-কে ঘিরে। এটি কাজ না করলে বাকি সব অর্থহীন।

```
Lawyer আদালত থেকে ফিরে app খোলে
        │
        ▼
  আজকের hearing list (already loaded)
        │  [Case 251/2024]  ─── tap
        ▼
  ┌──────────────────────────────────┐
  │  Outcome: [Adjourned ▾]          │
  │  Next date: [25 Aug 2026 📅]     │
  │  Stage: [Evidence ▾]             │
  │  Note: ______________            │
  │  ☑ Notify client                 │
  │            [ Save ]              │
  └──────────────────────────────────┘
        │   ≤ 15 seconds, ≤ 3 taps
        ▼
  ═══ SYSTEM FANS OUT (atomic transaction + async dispatch) ═══
        │
        ├─► CaseEvent তৈরি (append-only)          → Timeline update
        ├─► Hearing record close + নতুন Hearing    → Calendar update
        ├─► Case.current_stage update              → Progress bar
        ├─► Reminder schedule (7 / 3 / 1 / 0 day)  → Celery Beat
        ├─► Client notification (Push → SMS f/b)   → Notification log
        ├─► Lawyer diary/dashboard count refresh
        ├─► Task auto-create (stage rule অনুযায়ী)  → e.g. "Prepare evidence"
        └─► AuditLog entry
```

**Acceptance test for MVP (একক সবচেয়ে গুরুত্বপূর্ণ test):**
> একজন lawyer একটি hearing outcome save করার ৬০ সেকেন্ডের মধ্যে client-এর ফোনে সঠিক Bangla push notification পৌঁছাবে, client app-এ নতুন তারিখ দেখাবে, এবং ৭ দিন আগের reminder scheduled থাকবে।

---

## 3. Functional Requirements

Legend — **M** = MVP (Phase 1), **2/3/4/5** = Phase number

### 3.1 Identity & Access

| ID | Requirement | Phase |
|---|---|---|
| F-AUTH-01 | Mobile OTP দিয়ে client registration ও login | M |
| F-AUTH-02 | Lawyer registration: name, mobile, email, Bar enrollment no., chamber, password + OTP | M |
| F-AUTH-03 | JWT access/refresh token, refresh rotation ও revocation | M |
| F-AUTH-04 | Lawyer verification status: `SELF_DECLARED` / `DOCS_SUBMITTED` / `OFFICIALLY_VERIFIED` — UI-তে সৎভাবে প্রদর্শিত | M |
| F-AUTH-05 | Password reset (OTP-based), session/device list, remote logout | M |
| F-AUTH-06 | MFA (TOTP/OTP) lawyer ও admin account-এর জন্য | 2 |
| F-AUTH-07 | Unknown-device login alert | 2 |
| F-AUTH-08 | NID/KYC verification — explicit consent, retention policy সহ | 2 |
| F-AUTH-09 | SSO (Google / enterprise) | 5 |

### 3.2 Tenancy & Firm

| ID | Requirement | Phase |
|---|---|---|
| F-TEN-01 | Solo lawyer registration করলে automatic single-member LawFirm তৈরি | M |
| F-TEN-02 | সব tenant-scoped query-তে firm isolation বাধ্যতামূলক (architectural rule A3) | M |
| F-TEN-03 | Firm profile: name, address, logo, letterhead, contact | M |
| F-TEN-04 | Firm-এ lawyer/staff invite (email/SMS invite link) | 2 |
| F-TEN-05 | Firm-level subscription ও seat management | 2 |

### 3.3 Client Management (Lawyer side)

| ID | Requirement | Phase |
|---|---|---|
| F-CLI-01 | Client create/edit: name, mobile, alt mobile, email, address, NID (optional, encrypted), photo | M |
| F-CLI-02 | Client list — search (name/mobile/case no.), filter (active/inactive) | M |
| F-CLI-03 | Client detail: সব case, outstanding fee, communication log | M |
| F-CLI-04 | **Case linking** — lawyer invitation code (`CASE-8F29K`) generate করবে; client app-এ code বা mobile OTP দিয়ে link হবে | M |
| F-CLI-05 | এক case-এ একাধিক client (co-plaintiff) | M |
| F-CLI-06 | Client-এর platform access revoke করার ক্ষমতা lawyer-এর থাকবে | M |
| F-CLI-07 | Client import — CSV/Excel bulk (onboarding migration-এর জন্য) | M |

### 3.4 Case Management

| ID | Requirement | Phase |
|---|---|---|
| F-CASE-01 | Case create: case no., year, type, court, district, filing date, nature, our-side (plaintiff/defendant), fee agreement | M |
| F-CASE-02 | Case parties: plaintiff(s), defendant(s), opposing counsel, our client(s) | M |
| F-CASE-03 | Case status: `ACTIVE` / `PENDING` / `HEARING` / `AWAITING_ORDER` / `URGENT` / `DISPOSED` / `APPEALED` / `CLOSED` | M |
| F-CASE-04 | Case stage — court-type অনুযায়ী **configurable workflow** (hardcoded নয়) | M |
| F-CASE-05 | Case list: search, filter (status, court, type, stage, lawyer, date range), sort, pagination | M |
| F-CASE-06 | Case detail — tabs: Overview / Timeline / Hearings / Documents / Property / Billing / Notes | M |
| F-CASE-07 | Case notes (internal, client-invisible) | M |
| F-CASE-08 | Case transfer/assign অন্য lawyer-কে (firm-এর ভেতরে) | 2 |
| F-CASE-09 | Linked/related case (appeal ← original, একই property-র একাধিক case) | 2 |
| F-CASE-10 | Case archive ও reopen | 2 |
| F-CASE-11 | Case referral অন্য firm-কে | 5 |

### 3.5 Hearing & Court Date — **সবচেয়ে গুরুত্বপূর্ণ module**

| ID | Requirement | Phase |
|---|---|---|
| F-HEAR-01 | Hearing record: date, time, court, bench/judge, purpose, stage | M |
| F-HEAR-02 | **Quick outcome entry** — outcome + next date + stage + note, ≤3 tap/≤15 sec | M |
| F-HEAR-03 | Outcome enum: `ADJOURNED` / `HEARD` / `PART_HEARD` / `ORDER_PASSED` / `NOT_REACHED` / `NO_SITTING` / `SETTLED` / `DISPOSED` | M |
| F-HEAR-04 | **Date provenance** — `source`: `LAWYER_ENTERED` / `CONFIRMED` / `OFFICIAL_SYNC` (rule A1) | M |
| F-HEAR-05 | Previous / current / next date সবসময় একসাথে দৃশ্যমান (client-এর মূল প্রশ্নের উত্তর) | M |
| F-HEAR-06 | `client_attendance_required` flag → client-কে আলাদা notification | M |
| F-HEAR-07 | `documents_required` note → client-কে reminder | M |
| F-HEAR-08 | Date change → automatic client notification (urgent template) | M |
| F-HEAR-09 | Hearing correction একটি নতুন CaseEvent তৈরি করবে, পুরনোটি মুছবে না (rule A2) | M |
| F-HEAR-10 | Bulk day entry — আজকের সব hearing এক screen-এ পরপর outcome entry | M |
| F-HEAR-11 | **Conflict detection** — একই সময়ে ভিন্ন court-এ hearing হলে alert | 2 |
| F-HEAR-12 | Cause-list import (CSV/PDF paste → parse → bulk create) | 3 |
| F-HEAR-13 | Court system থেকে automatic date sync | 4 |

### 3.6 Case Timeline

| ID | Requirement | Phase |
|---|---|---|
| F-TL-01 | Append-only `CaseEvent` stream — filed, notice, appearance, WS, evidence, argument, hearing, order, adjournment, judgment, appeal, custom | M |
| F-TL-02 | প্রতিটি event: date, type, actor, description, linked document/order, client-visible flag | M |
| F-TL-03 | Client app-এ visual vertical timeline | M |
| F-TL-04 | Timeline filter (event type) ও export (PDF) | 2 |
| F-TL-05 | **AI timeline draft** — uploaded document থেকে event suggestion (lawyer approve করলে তবেই commit) | 3 |

### 3.7 Calendar & Diary

| ID | Requirement | Phase |
|---|---|---|
| F-CAL-01 | Month view — প্রতিদিন hearing count badge, heavy day highlighted | M |
| F-CAL-02 | Day view — time-ordered agenda: time, case, court, client, purpose | M |
| F-CAL-03 | Dashboard counters: Today / Tomorrow / This week / This month | M |
| F-CAL-04 | Client app-এ নিজের hearing calendar | M |
| F-CAL-05 | Court-wise ও lawyer-wise calendar filter | 2 |
| F-CAL-06 | Google Calendar / ICS export | 2 |
| F-CAL-07 | Court holiday ও vacation calendar (auto skip suggestion) | 2 |

### 3.8 Notification Engine

| ID | Requirement | Phase |
|---|---|---|
| F-NOT-01 | Channel: Push (FCM), SMS, Email — pluggable provider interface | M |
| F-NOT-02 | Reminder schedule: hearing-এর **7 / 3 / 1 দিন আগে ও hearing-day সকালে** | M |
| F-NOT-03 | Event notification: date changed (urgent), new document, order uploaded, invoice issued, payment received | M |
| F-NOT-04 | Bangla + English template, per-user language preference | M |
| F-NOT-05 | **Idempotency** — dedupe key; retry duplicate পাঠাবে না (rule A5) | M |
| F-NOT-06 | Delivery log ও status: queued / sent / delivered / failed / bounced | M |
| F-NOT-07 | **Push-first, SMS fallback** — push undelivered বা critical event হলেই SMS (cost control) | M |
| F-NOT-08 | Per-user notification preference (channel ও lead-time on/off) | M |
| F-NOT-09 | Quiet hours (রাত ১০টা–সকাল ৭টা, urgent ছাড়া) | M |
| F-NOT-10 | Lawyer-এর নিজস্ব reminder (নিজের agenda) | M |
| F-NOT-11 | WhatsApp Business API (official template, opt-in সহ) | 2 |
| F-NOT-12 | Smart reminder — "hearing ৫ দিন পরে কিন্তু required document upload হয়নি" | 3 |
| F-NOT-13 | Per-firm SMS quota, usage dashboard ও top-up | 2 |

### 3.9 Document Management

| ID | Requirement | Phase |
|---|---|---|
| F-DOC-01 | Case-wise folder: Plaint, WS, Land Documents, Khatian, Mutation, Deed, PoA, Court Order, Evidence, Other | M |
| F-DOC-02 | Upload PDF/JPG/PNG (max 25 MB), mobile camera scan | M |
| F-DOC-03 | **`client_visible` flag, default False** (rule A4) | M |
| F-DOC-04 | Private, encrypted storage; download শুধু short-lived presigned URL দিয়ে | M |
| F-DOC-05 | **Versioning** — নতুন upload নতুন version; কে/কখন record; পুরনো version retrievable | M |
| F-DOC-06 | Delete = soft delete + audit; hard delete শুধু firm admin, retention window-এর পরে | M |
| F-DOC-07 | Document preview (in-app PDF/image viewer) | M |
| F-DOC-08 | Order attach to hearing; client-এর জন্য release control lawyer-এর হাতে | M |
| F-DOC-09 | Full-text search (uploaded PDF text layer) | 3 |
| F-DOC-10 | OCR (Bangla + English) scanned document-এর জন্য | 3 |
| F-DOC-11 | Document comparison (version diff) | 3 |

### 3.10 Property / Land Module — **product differentiator**

| ID | Requirement | Phase |
|---|---|---|
| F-PROP-01 | Property entity: division, district, upazila, mouza, JL no., land classification, total land, ownership share | M |
| F-PROP-02 | Land record: khatian type (`CS`/`SA`/`RS`/`BS`/`City`/`Diara`), khatian no., dag no.(multiple), area | M |
| F-PROP-03 | Deed record: deed no., date, sub-registry office, deed type, parties | M |
| F-PROP-04 | Mutation record, land development tax record, mouza map upload | M |
| F-PROP-05 | **Case ↔ Property link** (many-to-many); একটি property-র সব মামলা একসাথে দেখা | M |
| F-PROP-06 | Client-এর "My Properties" vault — নিজের সব জমির document এক জায়গায় | M |
| F-PROP-07 | Dag/Khatian/Mouza দিয়ে search — structured, indexed | M |
| F-PROP-08 | Land Survey Tribunal-specific field: record correction type, disputed record reference | M |
| F-PROP-09 | Ownership chain visualisation (deed → mutation → khatian) | 3 |
| F-PROP-10 | Khatian PDF → AI field extraction (khatian no., dag, mouza, owner, area) | 3 |

### 3.11 Billing & Payment

| ID | Requirement | Phase |
|---|---|---|
| F-BIL-01 | Fee agreement per case: professional fee, court expense, documentation, misc | M |
| F-BIL-02 | Invoice generate (firm letterhead সহ PDF), invoice no. sequence | M |
| F-BIL-03 | Manual payment record (cash/bank/bKash reference), receipt | M |
| F-BIL-04 | Case ledger: charged / paid / due | M |
| F-BIL-05 | Client app-এ outstanding due ও invoice history | M |
| F-BIL-06 | Financial dashboard: today's collection, this month, outstanding, overdue | M |
| F-BIL-07 | Payment gateway — bKash, Nagad, SSLCommerz; webhook reconciliation; refund handling | 2 |
| F-BIL-08 | Recurring retainer billing + auto invoice + due reminder | 2 |
| F-BIL-09 | Expense tracking (court fee, stamp, travel) — client-এর কাছে reimbursable হিসাবে | 2 |
| F-BIL-10 | Firm-level financial report ও lawyer-wise revenue split | 2 |

> **নীতি:** Platform subscription fee এবং lawyer-এর professional fee কখনো একই ledger/invoice-এ মিশবে না।

### 3.12 Task & Staff (Phase 2)

| ID | Requirement | Phase |
|---|---|---|
| F-TSK-01 | Task: title, case link, assignee, due date, priority, status | 2 |
| F-TSK-02 | Stage-change হলে automatic task generation (workflow rule) | 2 |
| F-TSK-03 | Task reminder ও overdue escalation | 2 |
| F-STF-01 | Role: Firm Admin / Senior Advocate / Associate / Junior / Assistant | 2 |
| F-STF-02 | Role-based permission (§5-এর matrix অনুযায়ী) | 2 |
| F-STF-03 | Staff activity report | 2 |

### 3.13 Communication (Phase 2)

| ID | Requirement | Phase |
|---|---|---|
| F-MSG-01 | Case-scoped lawyer ↔ client message thread, case history-তে সংরক্ষিত | 2 |
| F-MSG-02 | Attachment support, read receipt | 2 |
| F-MSG-03 | Canned reply ("আপনার উপস্থিতি প্রয়োজন নেই") | 2 |
| F-MSG-04 | Communication log (call/meeting manual entry) | 2 |

### 3.14 Reporting (Phase 2)

Case report (total/active/closed/pending), court-wise report, hearing report (today/week/month), financial report (collection/outstanding/expense), client report, lawyer productivity report। সব report PDF + Excel export।

### 3.15 AI Layer (Phase 3)

| ID | Requirement |
|---|---|
| F-AI-01 | Document OCR (Bangla + English) |
| F-AI-02 | Structured field extraction — khatian, dag, mouza, owner, area, deed no. |
| F-AI-03 | Case summary from uploaded documents (parties, dispute, property, key dates, prior orders) |
| F-AI-04 | Timeline draft generation |
| F-AI-05 | Natural-language search — "যেসব land case-এ written statement pending" |
| F-AI-06 | Smart workflow reminder |
| F-AI-07 | **Human-in-the-loop gate** — সব AI output `DRAFT` state-এ; lawyer approve না করলে client দেখবে না (rule A7) |
| F-AI-08 | AI provenance record — model, version, prompt hash, timestamp প্রতিটি output-এ |

### 3.16 Court Integration (Phase 4)

Sync engine (6-hourly), change detection, official-vs-entered date reconciliation UI, order sync, cause-list ingestion — **সবই authorization-gated**। Platform কখনো সরকারি system-এ write করবে না (rule A8)।

### 3.17 Marketplace (Phase 5)

Lawyer discovery (specialisation/location/experience), appointment booking, online consultation (video/audio), consultation payment, review system, legal document templates, legal notice dispatch & tracking।

---

## 4. Screen Inventory (MVP)

### Client Mobile App
```
Onboarding → OTP → Link case (code/OTP)
🏠 Dashboard        — next hearing card, case count, due amount, alerts
⚖️ My Cases         — list → Case Detail (Overview / Timeline / Documents / Property / Billing)
📅 Hearings         — upcoming ও past
📄 Documents        — client-visible only
💰 Payments         — invoice, due, receipt
🏠 My Properties    — land vault
👨‍⚖️ My Lawyer        — profile, contact
🔔 Notifications
⚙️ Settings         — language, notification preference, device
```

### Lawyer Web
```
Dashboard           — today's agenda, counters, financial snapshot, alerts
Cases               — list/filter → Case Detail (7 tabs)
  └ Quick Hearing Entry (modal — the core loop)
Clients             — list → detail
Calendar            — month / day
Court Diary         — today's bulk entry screen
Documents           — firm-wide library
Billing             — invoice, payments, ledger
Reports             — (P2)
Settings            — firm profile, workflow config, notification template, users
```

---

## 5. RBAC Matrix

`✓` allow · `○` own records only · `–` deny

| Capability | Client | Assistant¹ | Junior¹ | Associate¹ | Firm Admin | Platform Admin |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| নিজের case দেখা | ○ | – | – | – | – | – |
| Firm-এর case দেখা | – | ✓ | ○ | ✓ | ✓ | –² |
| Case create/edit | – | – | ○ | ✓ | ✓ | – |
| Hearing date entry | – | ✓ | ○ | ✓ | ✓ | – |
| Hearing date **confirm** | – | – | ○ | ✓ | ✓ | – |
| Document upload | – | ✓ | ○ | ✓ | ✓ | – |
| Document delete | – | – | – | ○ | ✓ | – |
| `client_visible` toggle | – | – | ○ | ✓ | ✓ | – |
| Internal note দেখা | – | – | ○ | ✓ | ✓ | – |
| Invoice create | – | – | – | ✓ | ✓ | – |
| Payment record | – | ✓ | – | ✓ | ✓ | – |
| Financial report | – | – | – | ○ | ✓ | – |
| Client message | ✓ | ✓ | ○ | ✓ | ✓ | – |
| Staff manage | – | – | – | – | ✓ | – |
| Firm settings | – | – | – | – | ✓ | – |
| Audit log দেখা | – | – | – | – | ✓ | ✓ |
| Tenant/subscription manage | – | – | – | – | – | ✓ |

¹ Phase 2 roles — MVP-তে শুধু `Lawyer (= Firm Admin)` ও `Client`।
² Platform Admin **case content দেখতে পারবে না**। Support-এর জন্য "break-glass" access আলাদা, time-boxed, firm-কে notify করে, এবং audit-logged।

---

## 6. Non-Functional Requirements

| # | Category | Requirement |
|---|---|---|
| N1 | Performance | Case list p95 < 800 ms (৫০০ case সহ firm-এ); dashboard < 1.2 s; document upload 5 MB < 10 s (3G) |
| N2 | Mobile | Android 8+ / iOS 14+; APK < 40 MB; ৩G-তে ব্যবহারযোগ্য; core screen offline-cached (read-only) |
| N3 | Availability | 99.5% monthly (MVP), 99.9% (post Phase 2); planned maintenance রাত ১টা–৪টা |
| N4 | Scalability | 500 firm / 5,000 lawyer / 5 lakh case পর্যন্ত single Postgres + read replica-তে |
| N5 | Notification | Trigger থেকে push delivery < 60 s (p95); delivery success ≥ 97% |
| N6 | Security | TLS 1.2+; document AES-256 at rest; password Argon2; secret manager-এ; OWASP Top-10 pass; Phase 1 শেষে external pentest |
| N7 | Backup/DR | Daily full + PITR (WAL); RPO ≤ 15 min, RTO ≤ 4 h; ত্রৈমাসিক restore drill |
| N8 | Audit | সব sensitive mutation immutable log-এ; retention 7 বছর |
| N9 | Localisation | Bangla default, English toggle; Bangla numeral display option; Bengali date support |
| N10 | Accessibility | Font scaling; contrast ≥ 4.5:1; বয়স্ক ব্যবহারকারীর জন্য বড় tap target (≥48 dp) |
| N11 | Privacy | Data minimisation (MVP-তে NID নয়); explicit consent record; export ও delete request workflow |
| N12 | Maintainability | Core module test coverage ≥ 70%; API contract test; ADR documented |
| N13 | Compliance | ToS/Privacy/DPA legally reviewed; disclaimer সব entry point-এ |

---

## 7. Key Assumptions

| # | Assumption | ভুল হলে প্রভাব |
|---|---|---|
| AS1 | Lawyer বা তার assistant প্রতিদিন hearing outcome entry করবে | Product-এর মূল ভিত্তি ধসে পড়বে → R1 mitigation critical |
| AS2 | MVP-তে official court API পাওয়া যাবে না | কোনো প্রভাব নেই (deliberately assumed) |
| AS3 | Client-দের smartphone + data আছে | না থাকলে SMS-only fallback tier দরকার (cost ↑) |
| AS4 | SMS aggregator-এ Bangla Unicode reliable | না হলে English transliteration fallback |
| AS5 | bKash merchant approval 12–16 সপ্তাহে | দেরি হলে Phase 2 slip |
| AS6 | Pilot chamber ৩টি পাওয়া যাবে | না পেলে GA পিছিয়ে যাবে; discovery phase-এ ৫টি target করা হচ্ছে |

---

## 8. Open Questions (M0-এর মধ্যে resolve করতে হবে)

| # | Question | Owner | Impacts |
|---|---|---|---|
| Q1 | Case stage taxonomy — court type অনুযায়ী প্রকৃত ধাপগুলো কী? | Advocate advisor | Workflow engine, F-CASE-04 |
| Q2 | Land Survey Tribunal-এর record correction category ও required field? | Advocate + DLRS reference | F-PROP-08 |
| Q3 | Lawyer কি assistant-কে দিয়ে entry করাবে, নাকি নিজে করবে? | Discovery interview | UX priority, Phase 2 timing |
| Q4 | Client কি সত্যিই document দেখতে চায়, নাকি শুধু তারিখ? | Discovery interview | MVP scope trim করার সুযোগ |
| Q5 | Firm কি নিজের data অন্য firm-এর সাথে কখনো share করতে চাইবে (referral)? | Discovery | Tenancy model |
| Q6 | Bar Council-এর সাথে verification arrangement সম্ভব কি? | PO | F-AUTH-04 |
| Q7 | Data localisation — সরকারি কোনো binding requirement আছে কি? | Tech lawyer | Hosting vendor selection |
