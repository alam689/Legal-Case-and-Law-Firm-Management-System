# CaseFlow BD — Project Plan
#https://dhaka.judiciary.gov.bd/bn
**AI-Powered Legal Case & Law Firm Management Platform for Bangladesh**

| | |
|---|---|
| **Product name** | CaseFlow BD *(internal codename: DLCMS)* |
| **Document version** | 1.0 |
| **Date** | 16 August 2026 |
| **Status** | Draft for approval |
| **Owner** | Khorshed Alam (Product Owner / Founding Engineer) |

---

## 1. Executive Summary

বাংলাদেশে একজন client-কে নিজের মামলার তারিখ জানতে আইনজীবীকে ফোন করতে হয়, আর আইনজীবীকে শত শত মামলার তথ্য manual diary-তে maintain করতে হয়। CaseFlow BD এই দুই সমস্যাকে **একটি single data-entry loop** দিয়ে সমাধান করে:

> আইনজীবী hearing শেষে একবার next date + stage entry করবেন → system স্বয়ংক্রিয়ভাবে calendar, case timeline, client notification, reminder, task এবং diary update করবে।

**Positioning:** এটি Supreme Court MyCase / e-Causelist / Judiciary CMS-এর *প্রতিস্থাপন নয়*। এটি সরকারি court system এবং lawyer–client সম্পর্কের মাঝখানে একটি **private practice-management + communication layer**।

**Business model:** Multi-tenant SaaS। Law firm/chamber subscription pay করবে; client app সবসময় free (network effect ও adoption driver)।

**Primary market (order of attack):**
1. Individual advocate ও small chamber (1–5 lawyers) — District Court, Land Survey Tribunal
2. Medium law firm (6–25 lawyers)
3. Corporate legal department
4. Government-authorized integration (long-term)

---

## 2. Objectives & Success Criteria

### 2.1 Product Objectives

| # | Objective | Measurable target (12 months post-GA) |
|---|---|---|
| O1 | Client-এর "তারিখ কবে?" ফোন কল কমানো | Onboarded client-দের 70%+ নিজেই app থেকে date জানবে |
| O2 | Lawyer-এর manual diary প্রতিস্থাপন | Active lawyer-দের 60%+ সপ্তাহে ≥4 দিন app ব্যবহার করবে |
| O3 | Hearing date miss শূন্যে নামানো | Notification delivery success ≥ 97% |
| O4 | Chamber-এর outstanding fee visibility | Paying firm-দের 50%+ billing module ব্যবহার করবে |
| O5 | Revenue | 300 paying lawyer seat, MRR ≈ ৳2,40,000 |

### 2.2 Non-Goals (স্পষ্টভাবে scope-এর বাইরে)

- সরকারি court system-এর official data modify করা
- Legal advice প্রদান করা (platform কখনো advice দেবে না)
- Case outcome prediction বা জেতার সম্ভাবনা দেখানো
- E-filing করা (Phase 4-এ শুধু authorized হলে)
- Lawyer-এর professional credential সম্পর্কে platform-এর নিজস্ব claim করা

### 2.3 Definition of Success for MVP

MVP তখনই successful যখন **৩টি pilot chamber ৪ সপ্তাহ ধরে নিজেদের real মামলা system-এ চালাবে এবং paper diary বন্ধ করবে।** Feature count নয়, এই behavioural proof-ই gate।

---

## 3. Product Scope — Phased

সম্পূর্ণ feature breakdown → [`docs/01-scope-and-requirements.md`](docs/01-scope-and-requirements.md)

### Phase 1 — MVP: "The Core Loop" (16 weeks)

**একমাত্র লক্ষ্য: single-entry automation loop কাজ করা।**

| Module | Lawyer Web | Client Mobile |
|---|---|---|
| Auth (OTP + password) | ✅ | ✅ |
| Client management | ✅ | — |
| Case CRUD (Civil / Land Tribunal / generic) | ✅ | View only |
| **Hearing entry + next date** | ✅ | View |
| **Case timeline (append-only events)** | ✅ | View |
| Calendar (month/day view) | ✅ | Hearing list |
| **Notification engine (Push + SMS)** | Trigger | Receive |
| Document upload/download + client visibility flag | ✅ | View allowed only |
| Case–Property link + Land fields (Khatian/Dag/Mouza) | ✅ | View |
| Invoice + payment record (manual entry) | ✅ | View + due |
| Dashboard (today/tomorrow/week counts) | ✅ | Next hearing card |
| Audit log | Background | — |
| Multi-tenant isolation | Background | — |

**MVP থেকে বাদ:** WhatsApp, payment gateway, AI, staff roles, court sync, in-app chat, conflict detection, recurring billing, marketplace।

### Phase 2 — Practice Operations (10 weeks)
Staff & role-based access, task management, WhatsApp Business API, payment gateway (bKash/Nagad/SSLCommerz), advanced reports, court-wise dashboard, configurable workflow engine, conflict detection, in-app lawyer↔client messaging, recurring retainer billing, Lawyer mobile app।

### Phase 3 — Legal Intelligence / AI (12 weeks)
Document OCR + field extraction (Khatian/Dag/Mouza), AI case summary, AI-generated timeline draft, semantic search over case corpus, smart reminders ("hearing 5 দিন পরে কিন্তু document upload হয়নি"), document comparison।

### Phase 4 — Court Data Integration (12 weeks, external-dependency gated)
Cause-list ingestion (যেখানে আইনগত ও technically permitted), case-status sync engine, order sync, official API integration, e-filing bridge — **শুধুমাত্র সংশ্লিষ্ট কর্তৃপক্ষের লিখিত অনুমোদন সাপেক্ষে।**

### Phase 5 — Legal Services Marketplace (16 weeks)
Lawyer discovery, appointment booking, online consultation, escrowed consultation payment, case referral, legal document templates, legal notice management।

---

## 4. Timeline

Kickoff **1 September 2026**।

```
2026                                    2027                                    2028
Sep   Oct   Nov   Dec | Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec | Jan   Feb
──────────────────────────────────────────────────────────────────────────────────────────────────────────
[P0]
 ███
    [Phase 1 — MVP Build ...................]
     ████████████████████████████████████
                                [Pilot]
                                 ████
                                      [GA]
                                       ▲
                                      [Phase 2 — Practice Ops ......]
                                       ████████████████████
                                                          [Phase 3 — AI Layer ........]
                                                           ████████████████████████
                                                                                  [Phase 4 — Court Integration]
                                                                                   ████████████████████████
                                                                                                     [Phase 5 — Marketplace]
                                                                                                      ██████████████
```

| Milestone | Date | Gate criteria |
|---|---|---|
| **M0 — Discovery complete** | 19 Sep 2026 | 5টি chamber interview, data model signed off, 3 pilot LOI |
| **M1 — Core loop demo** | 31 Oct 2026 | Hearing entry → client push notification end-to-end |
| **M2 — Feature complete (MVP)** | 26 Dec 2026 | সব Phase-1 module dev-complete, UAT শুরু |
| **M3 — Pilot live** | 12 Jan 2027 | 3 chamber, ≥150 real case, production infra |
| **M4 — General Availability** | 20 Feb 2027 | Pilot exit criteria পূরণ, billing চালু, support process ready |
| **M5 — Phase 2 complete** | 30 Apr 2027 | Payment gateway live, staff roles, WhatsApp |
| **M6 — AI layer live** | 31 Jul 2027 | OCR + summary, lawyer-review gate সহ |
| **M7 — Court sync (conditional)** | 31 Oct 2027 | Authorization প্রাপ্ত হলে |

> **Note:** Court vacation (ডিসেম্বর–জানুয়ারি) এবং Ramadan/Eid period-এ lawyer availability কম থাকে — pilot recruitment ও UAT scheduling-এ এটি ধরা হয়েছে।

Sprint-by-sprint backlog → [`docs/04-delivery-roadmap.md`](docs/04-delivery-roadmap.md)

---

## 5. Architecture Summary

সম্পূর্ণ বিবরণ → [`docs/02-architecture-and-stack.md`](docs/02-architecture-and-stack.md)

```
   Client Mobile (RN)      Lawyer Web (React)      Lawyer Mobile (RN, P2)
          │                       │                        │
          └───────────────────────┴────────────────────────┘
                                  │  HTTPS / JWT
                          ┌───────▼────────┐
                          │  Nginx + API   │
                          │  Gateway       │
                          └───────┬────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │   Django + DRF (monolith,  │
                    │   modular apps)            │
                    │  ┌──────────────────────┐  │
                    │  │ tenancy │ cases      │  │
                    │  │ hearings│ documents  │  │
                    │  │ billing │ properties │  │
                    │  │ notify  │ audit      │  │
                    │  └──────────────────────┘  │
                    └──┬──────────┬───────────┬──┘
                       │          │           │
              ┌────────▼───┐  ┌───▼────┐  ┌───▼──────────┐
              │ PostgreSQL │  │ Redis  │  │ S3-compatible│
              │            │  │ +Celery│  │ object store │
              └────────────┘  └───┬────┘  └──────────────┘
                                  │
                          ┌───────▼────────────────────────┐
                          │  Notification Dispatcher       │
                          │  FCM │ SMS │ Email │ WhatsApp* │
                          └────────────────────────────────┘
                                       * Phase 2
```

### 5.1 Non-negotiable Architectural Rules

এগুলো legal-domain requirement, optional design choice নয়:

| # | Rule | কারণ |
|---|---|---|
| **A1** | **Date provenance mandatory** — প্রতিটি hearing date-এ `source` field: `LAWYER_ENTERED` / `CONFIRMED` / `OFFICIAL_SYNC`। Client UI-তে unconfirmed date আলাদা badge পাবে। | ভুল তারিখের দায় platform-এর উপর আসা ঠেকাতে |
| **A2** | **Append-only case events** — hearing/order/stage কখনো silently overwrite হবে না; correction একটি নতুন event তৈরি করবে। | Legal record integrity |
| **A3** | **Tenant isolation at query layer** — সব tenant-scoped model default manager দিয়ে `firm_id` filter করবে; কোনো view manual filter-এর উপর নির্ভর করবে না। | Cross-firm data leak = business-ending |
| **A4** | **Document visibility explicit** — প্রতিটি document/order-এ `client_visible` flag, default **False**। | Lawyer-এর কৌশলগত document client-কে দেখানো যাবে না |
| **A5** | **Notification idempotency** — প্রতিটি dispatch-এর unique key + delivery log; retry কখনো duplicate পাঠাবে না। | "৩ বার SMS এলো" = trust loss + খরচ |
| **A6** | **Audit trail immutable** — সব sensitive mutation (date, document delete, fee, permission) append-only log-এ। | Advocate–client dispute-এ প্রমাণ |
| **A7** | **AI output = draft only** — কোনো AI output lawyer review ছাড়া client-কে দেখানো হবে না। | Legal liability |
| **A8** | **No official court data mutation** — platform কখনো সরকারি system-এ write করবে না। | Legal boundary |

### 5.2 Stack

| Layer | Choice | কারণ |
|---|---|---|
| Backend | Django 5 + DRF | আপনার existing skillset; admin, ORM, permission mature |
| DB | PostgreSQL 16 | JSONB (configurable workflow), FTS, partial index |
| Async | Celery + Redis (Beat for schedulers) | Notification, reminder, sync jobs |
| Lawyer Web | React 18 + Vite + TypeScript + TanStack Query + Tailwind/shadcn | Data-dense dashboard |
| Mobile | React Native (Expo) | একই codebase-এ Client + পরে Lawyer app |
| Push | Firebase Cloud Messaging | Free, reliable |
| SMS | Local aggregator (Robi/GP/Reve/Bulk gateway) — abstract behind `SmsProvider` interface | Vendor lock-in এড়াতে |
| Storage | S3-compatible (DO Spaces / Backblaze B2), SSE + private ACL + presigned URL | Cost + encryption |
| Search | PostgreSQL FTS (MVP) → OpenSearch (Phase 3) | Premature complexity এড়াতে |
| Deploy | Docker Compose → managed VPS (Phase 1), Kubernetes optional পরে | Cost-appropriate |
| Observability | Sentry + Prometheus/Grafana + structured logs | |
| CI/CD | GitHub Actions → staging auto, prod manual approve | |

### 5.3 Multi-Tenancy Decision

**Shared database, shared schema, `firm` FK + enforced-at-manager isolation।**

Schema-per-tenant (`django-tenants`) বাদ দেওয়া হয়েছে কারণ: migration overhead, cross-tenant analytics কঠিন, expected tenant count (hundreds–low thousands) shared-schema-এর জন্য উপযুক্ত। Isolation নিশ্চিত করা হবে base model + manager + middleware + **প্রতি PR-এ automated isolation test** দিয়ে।

---

## 6. Data Model Summary

সম্পূর্ণ schema → [`docs/03-data-model.md`](docs/03-data-model.md)

```
LawFirm (tenant)
 ├── User ──┬── LawyerProfile
 │          ├── StaffProfile        (P2)
 │          └── ClientProfile
 ├── Client
 ├── Court ── CourtType (Civil / Land Survey Tribunal / HC / Appellate ...)
 ├── Case ──┬── CaseParty (plaintiff/defendant/opposing counsel)
 │          ├── Hearing ──── Order
 │          ├── CaseEvent          (append-only timeline)
 │          ├── Document ── DocumentVersion
 │          ├── Task              (P2)
 │          ├── Invoice ── InvoiceLine ── Payment
 │          ├── Message           (P2)
 │          └── CasePropertyLink ── Property ── LandRecord (CS/SA/RS/BS khatian, dag, mouza)
 ├── NotificationTemplate ── NotificationDispatch ── DeliveryAttempt
 ├── Subscription ── SubscriptionInvoice
 └── AuditLog
```

**Land-domain first-class:** State Acquisition and Tenancy Act §145A-এর অধীনে Land Survey Tribunal-এর case survey record correction নিয়ে কাজ করে — তাই Khatian/Dag/Mouza/JL সাধারণ text field নয়, **structured, searchable entity**। এটি product-এর প্রধান differentiator: কোনো generic legal CRM এটা করে না।

---

## 7. Team & Resourcing

### Option A — Lean / Founder-led (recommended for MVP)

| Role | Allocation | Phase 1 |
|---|---|---|
| Founding Engineer (আপনি) — full-stack + product | 100% | 16 wks |
| Backend Engineer (Django/DRF) | 100% | 16 wks |
| React Native Engineer | 100% | Week 5–16 |
| UI/UX Designer | 40% | Week 1–10 |
| QA (manual + test automation) | 50% | Week 7–16 |
| Legal/domain advisor (practising advocate, retainer) | 10% | Full |

**Total ≈ 3.5 FTE**, ~56 person-weeks for MVP.

### Option B — Funded team
Backend ×3, Frontend ×2, Mobile ×2, QA ×1, DevOps ×0.5, PM ×1, Design ×1 → MVP ~10 weeks, কিন্তু coordination overhead ও burn অনেক বেশি। **Pilot validation-এর আগে recommend করছি না।**

### Advisory requirement (non-optional)
একজন practising advocate-কে paid domain advisor হিসেবে রাখতেই হবে। Case stage taxonomy, court hierarchy, tribunal-specific workflow — এগুলো ভুল হলে product অব্যবহারযোগ্য হবে, আর ভুলটা developer ধরতে পারবে না।

---

## 8. Budget Estimate (Indicative)

> সংখ্যাগুলো planning-level estimate, quotation নয়। Local rate ও vendor contract অনুযায়ী পরিবর্তিত হবে।

### 8.1 Phase 1 (MVP) One-time

| Item | Estimate (BDT) |
|---|---|
| Engineering (Option A, 56 person-weeks) | 22,00,000 – 30,00,000 |
| UI/UX design | 2,50,000 – 4,00,000 |
| Legal advisor retainer (4 months) | 1,20,000 |
| Legal review — ToS, privacy policy, data-processing agreement | 1,00,000 – 2,00,000 |
| Branding, domain, app store accounts | 60,000 |
| Contingency (15%) | ~4,50,000 |
| **Total** | **≈ 32,00,000 – 42,00,000** |

### 8.2 Recurring Monthly (at pilot / early GA scale)

| Item | Monthly (BDT) |
|---|---|
| App server + DB (managed VPS/Cloud) | 12,000 – 25,000 |
| Object storage + bandwidth | 3,000 – 8,000 |
| SMS (≈ ৳0.35–0.60/SMS; 20k SMS) | 7,000 – 12,000 |
| Push, email, monitoring, Sentry | 4,000 |
| Backups + DR storage | 3,000 |
| **Total** | **≈ 29,000 – 52,000** |

### 8.3 Unit Economics Warning

**SMS হলো একমাত্র variable cost যা margin খেয়ে ফেলতে পারে।** ৪-স্তরের reminder (7/3/1 দিন + hearing day) × ১টি মামলায় গড়ে ৮টি hearing/বছর × ২ পক্ষ = প্রতি case-এ ~64 SMS/বছর। তাই:

- Push notification **primary**; SMS শুধু fallback (push undelivered) এবং critical event (date changed, hearing tomorrow)
- Firm-এর plan-এ SMS quota bundle করা, quota শেষে top-up
- WhatsApp (Phase 2) দিয়ে SMS-এর একটি বড় অংশ replace করা

### 8.4 Pricing (Phase 2-এ চালু)

| Plan | Price | Limits |
|---|---|---|
| Client App | Free forever | নিজের মামলা |
| Solo Starter | ৳499/mo/lawyer | 50 active case, 200 SMS/mo, 5 GB |
| Professional | ৳999/mo/lawyer | Unlimited case, 600 SMS, 25 GB, billing module |
| Chamber | ৳3,500/mo (5 seat) + ৳600/extra seat | Staff roles, reports, 2000 SMS, 100 GB |
| Firm/Enterprise | Custom | SSO, API, dedicated support |

> Software subscription fee এবং আইনজীবীর professional fee সম্পূর্ণ আলাদা রাখা হবে — invoice, ledger, ও ToS-এ স্পষ্টভাবে পৃথক।

---

## 9. Risk Register

| # | Risk | P | I | Mitigation |
|---|---|---|---|---|
| **R1** | **Lawyer adoption ব্যর্থ** — data entry বাড়তি কাজ মনে হবে | High | Critical | Hearing entry ≤3 tap/≤15 sec হতে হবে; bulk cause-list day entry; chamber assistant দিয়ে entry; onboarding-এ বিনামূল্যে data migration সেবা |
| **R2** | **Official court API পাওয়া যাবে না** | High | High | Product-এর core value কখনো court sync-এর উপর নির্ভরশীল করা হবে না। Phase 4 সম্পূর্ণ optional layer হিসেবে architected |
| **R3** | **Confidentiality breach / cross-tenant leak** | Low | Critical | A3 isolation rule + প্রতি PR-এ automated isolation test + Phase 1 শেষে external pentest + encryption at rest |
| **R4** | **Client ভুল তারিখ পেয়ে মামলা miss করল** | Medium | Critical | A1 date provenance + প্রতিটি client screen-এ disclaimer + unconfirmed date-এ visual warning + ToS-এ liability limitation |
| **R5** | **SMS cost margin খেয়ে ফেলল** | Medium | High | §8.3-এর push-first strategy; per-firm quota; cost dashboard day one থেকে |
| **R6** | **Payment gateway merchant approval দেরি** | Medium | Medium | Week 1-এ bKash/SSLCommerz merchant application শুরু (12–16 সপ্তাহ লাগে); MVP-তে manual payment record — gateway blocker নয় |
| **R7** | **NID/KYC data handling নিয়ে regulatory সমস্যা** | Medium | High | MVP-তে NID **সংগ্রহই করা হবে না** — শুধু mobile OTP। KYC Phase 2-তে explicit consent, retention policy ও legal review-এর পরে |
| **R8** | **সরকারি free tool (MyCase) feature বাড়িয়ে দিল** | Medium | Medium | আমাদের moat = practice management + billing + client communication + land vault, শুধু "case data দেখানো" নয় |
| **R9** | **Domain modelling ভুল** (case stage, tribunal workflow) | Medium | High | Practising advocate advisor + configurable workflow engine (hardcoded stage নয়) |
| **R10** | **Key-person dependency (solo founder)** | High | High | Day one থেকে documentation, ADR, test coverage ≥70% core module-এ; Sprint 4-এর মধ্যে ২য় backend engineer |
| **R11** | **Court vacation-এ pilot momentum হারানো** | High | Low | Pilot window ডিসেম্বর vacation এড়িয়ে জানুয়ারি-মাঝামাঝি নির্ধারিত |

---

## 10. Legal, Compliance & Ethics

এটি একটি **regulated-adjacent** product। এই কাজগুলো Phase 1-এর deliverable, পরে করার বিষয় নয়:

1. **Platform disclaimer** — অ্যাপের প্রথম screen ও ToS-এ:
   > এই platform administrative case management service প্রদান করে। এটি legal advice প্রদান করে না এবং কোনো আদালত বা judicial authority-র official system-এর বিকল্প নয়। তারিখ ও তথ্যের চূড়ান্ত নির্ভরযোগ্য উৎস সংশ্লিষ্ট আদালত।

2. **AI disclaimer** (Phase 3 থেকে, কিন্তু policy এখনই লিখতে হবে):
   > AI-generated information must be reviewed by a qualified lawyer before being relied upon for legal action.

3. **Advocate–client privilege** — সব case document encrypted at rest; platform staff-এর production data access break-glass audit-logged process ছাড়া নিষিদ্ধ।

4. **Data retention & deletion policy** — firm subscription শেষ হলে data export window (90 দিন) তারপর deletion; কিন্তু **audit log আলাদা retention-এ**।

5. **Lawyer verification honesty** — Bar Council enrollment number সংগ্রহ করা হবে, কিন্তু platform কখনো "verified lawyer" claim করবে না যতক্ষণ না Bar Council-এর সাথে official verification arrangement হয়। UI-তে status: `Self-declared` / `Document submitted` / `Officially verified`।

6. **Consent architecture** — client-এর data lawyer-এর সাথে share হচ্ছে, lawyer-এর data client-এর সাথে — উভয় দিকে explicit consent record।

7. **Data localisation** — সরকারি guidance ও client sensitivity বিবেচনায় primary data store Bangladesh বা nearest region-এ; vendor selection-এ এটি criterion।

**Action:** একজন technology-lawyer দিয়ে ToS, Privacy Policy, DPA এবং Lawyer Agreement draft করানো — Sprint 3-এর মধ্যে শুরু, M3-এর আগে সম্পন্ন।

---

## 11. Go-to-Market (MVP → GA)

| Stage | Activity |
|---|---|
| **Pre-build (Sep)** | ১৫ জন advocate-এর সাথে discovery interview; ৩টি pilot chamber-এর LOI; আপনার নিজের ২টি মামলা (Land Survey Tribunal 251/2024, Civil Suit 138/2023) internal reference case হিসেবে |
| **Build (Oct–Dec)** | Pilot chamber-দের সাথে biweekly demo; feedback → backlog |
| **Pilot (Jan)** | 3 chamber, free, hands-on data migration সহ; সাপ্তাহিক on-site visit |
| **GA (Feb)** | District Bar Association-এ demo session; referral incentive (১ জন lawyer আনলে ২ মাস free); Land Survey Tribunal-কেন্দ্রিক advocate-দের targeted outreach |
| **Growth (Mar+)** | Client app-এর free tier দিয়ে bottom-up pull — client নিজের lawyer-কে platform-এ আসতে বলবে |

**Wedge strategy:** সব ধরনের মামলা একসাথে ধরার চেষ্টা না করে **Land Survey Tribunal + land-related civil case** দিয়ে শুরু — কারণ ওখানে document ও record-এর জটিলতা সবচেয়ে বেশি, তাই আমাদের Land Vault-এর value সবচেয়ে স্পষ্ট, আর competition সবচেয়ে কম।

---

## 12. Governance & Ways of Working

| Item | Decision |
|---|---|
| Methodology | Scrum, 2-week sprint |
| Ceremonies | Sprint planning (Mon), daily standup 15 min, demo + retro (alt Friday) |
| Definition of Done | Code merged + unit test + API contract test + tenant-isolation test + Bangla/English string reviewed + staging-এ verified + doc updated |
| Branching | `main` (prod) ← `develop` ← `feature/*`; PR-এ ১টি approval বাধ্যতামূলক |
| Architecture decisions | ADR file `docs/adr/NNNN-title.md` |
| Release cadence | Staging প্রতি merge-এ; production প্রতি sprint শেষে |
| Backlog | GitHub Projects |
| Bug SLA | Sev-1 (data loss/leak/wrong date shown) 4 ঘণ্টা, Sev-2 2 দিন, Sev-3 next sprint |

---

## 13. Immediate Next Steps (Week 1)

| # | Action | Owner | Due |
|---|---|---|---|
| 1 | এই plan approve করা / scope adjust করা | Product Owner | 22 Aug 2026 |
| 2 | Product নাম চূড়ান্ত + domain, trademark search | PO | 24 Aug |
| 3 | ৩টি pilot chamber identify ও LOI | PO | 5 Sep |
| 4 | Practising advocate advisor নিয়োগ | PO | 5 Sep |
| 5 | bKash / SSLCommerz merchant application শুরু (long lead time) | PO | 1 Sep |
| 6 | Repo, CI, staging infra, Django skeleton | Founding Eng | 5 Sep |
| 7 | Discovery interview ১৫ জন advocate | PO + Design | 19 Sep |
| 8 | Data model + workflow taxonomy advisor দিয়ে validate | Tech Lead | 19 Sep |
| 9 | Technology lawyer engage (ToS/Privacy/DPA) | PO | 19 Sep |

---

## 14. Document Index

| Document | Content |
|---|---|
| [`docs/01-scope-and-requirements.md`](docs/01-scope-and-requirements.md) | Personas, user stories, সম্পূর্ণ feature list, RBAC matrix, NFR |
| [`docs/02-architecture-and-stack.md`](docs/02-architecture-and-stack.md) | System architecture, notification engine, security, integration strategy, API surface |
| [`docs/03-data-model.md`](docs/03-data-model.md) | Entity definitions, fields, relations, enums, indexing |
| [`docs/04-delivery-roadmap.md`](docs/04-delivery-roadmap.md) | Sprint-by-sprint MVP backlog, exit criteria, test strategy |

---

*Prepared 16 August 2026. All cost and effort figures are planning estimates and must be re-validated against actual vendor quotations and team rates before commitment.*
