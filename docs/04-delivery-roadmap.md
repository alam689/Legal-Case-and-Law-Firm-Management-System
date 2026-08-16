# 04 — Delivery Roadmap

CaseFlow BD · Annex to [`PROJECT_PLAN.md`](../PROJECT_PLAN.md) · v1.0 · 16 Aug 2026

---

## 1. Phase 0 — Discovery & Setup (3 weeks · 1–19 Sep 2026)

| Week | Product / Business | Engineering |
|---|---|---|
| **W1** (1–5 Sep) | ১৫ জন advocate-এর interview schedule; advocate advisor নিয়োগ; **bKash/SSLCommerz merchant application জমা** (12–16 সপ্তাহ lead time) | Repo, GitHub Projects, CI skeleton; Django project + core app; Docker Compose; staging VPS provision |
| **W2** (8–12 Sep) | Interview চলবে (৮টি সম্পন্ন); pilot chamber shortlist; competitor teardown (MyCase, e-Causelist) | Auth + tenancy + User/LawFirm model; JWT; OTP flow; tenant isolation test harness |
| **W3** (15–19 Sep) | Interview সম্পন্ন; ৩টি pilot LOI; **workflow taxonomy advisor দিয়ে sign-off**; technology lawyer engage; UX wireframe (core loop) | Reference data seed (district, court, court type); base model + audit skeleton; ADR 0001–0004 |

**M0 exit criteria:**
- [ ] ১৫টি advocate interview সম্পন্ন, synthesis document লেখা
- [ ] Open Question Q1–Q5 উত্তরিত ([`01-scope`](01-scope-and-requirements.md#8-open-questions-m0-এর-মধ্যে-resolve-করতে-হবে))
- [ ] ৩টি pilot chamber LOI স্বাক্ষরিত
- [ ] Case stage taxonomy (Civil + Land Tribunal) advisor-approved
- [ ] Core loop wireframe pilot lawyer দিয়ে validated
- [ ] CI green, staging deploy working, tenant isolation test failing-by-design (red) থেকে green

> **Gate:** LOI না পেলে build শুরু হবে না। Pilot commitment ছাড়া ১৬ সপ্তাহ build করা হলো R1 (adoption risk) দ্বিগুণ করা।

---

## 2. Phase 1 — MVP Build (16 weeks · 22 Sep 2026 – 9 Jan 2027)

৮টি sprint × ২ সপ্তাহ। প্রতিটি sprint-এর শেষে staging-এ demo-able increment।

### Sprint 1 · 22 Sep – 3 Oct — **Foundation**
| Deliverable |
|---|
| User, LawFirm, FirmMember, LawyerProfile model + admin |
| OTP request/verify, JWT auth, refresh rotation, device register |
| Tenant middleware + `TenantScopedManager` + **isolation test suite (CI gate)** |
| AuditLog + signal + DB immutability trigger |
| Court, CourtType, District/Upazila seed loaded |
| Lawyer web shell: routing, auth, layout, design tokens |
| **Demo:** lawyer register → login → empty dashboard |

### Sprint 2 · 6–17 Oct — **Client & Case**
| Deliverable |
|---|
| Client CRUD + list/search + CSV import |
| ClientLink invitation code generate/redeem |
| Case model + CRUD + CaseParty |
| WorkflowDefinition + stage engine (Civil + Land Tribunal seeded) |
| Case list: filter, search, pagination |
| Case detail: Overview tab |
| **Demo:** lawyer একটি client ও case তৈরি করে, stage set করে |

### Sprint 3 · 20–31 Oct — ★ **THE CORE LOOP** ★
| Deliverable |
|---|
| Hearing model + provenance (`source`) + supersede chain |
| `POST /hearings/{id}/outcome` — atomic transaction (§5 of [`02-architecture`](02-architecture-and-stack.md)) |
| CaseEvent append-only + timeline API |
| ScheduledNotification materialisation (T-7/3/1/0) |
| NotificationDispatch + DeliveryAttempt + FCM push provider |
| Bangla + English template (৬টি core) |
| Quick Hearing Entry UI (≤3 tap) |
| Client mobile app skeleton + push registration + notification receive |
| **Demo (M1 gate):** lawyer outcome save → ৬০ সেকেন্ডের মধ্যে client-এর ফোনে Bangla push |

> **M1 — 31 Oct 2026.** এটাই project-এর সবচেয়ে গুরুত্বপূর্ণ milestone। এখানে দেরি হলে পুরো timeline slip করবে; অন্য কোনো feature-এর জন্য এই sprint compromise করা হবে না।

### Sprint 4 · 3–14 Nov — **Notification hardening + Calendar**
| Deliverable |
|---|
| SMS provider adapter (২টি vendor + failover) + Bangla Unicode segment counting |
| Push-first / SMS-fallback decision engine + ৩০ মিনিট grace window |
| Dedupe key + idempotency + retry policy + delivery webhook |
| Quiet hours + notification preference |
| SMS cost dashboard (per firm, per period) |
| Date-change urgent notification path |
| Calendar month view + day agenda + dashboard counters |
| Court Diary screen (bulk day entry) |
| **Demo:** date পরিবর্তন করলে client urgent SMS + push পায়, duplicate যায় না |

### Sprint 5 · 17–28 Nov — **Client App core**
| Deliverable |
|---|
| Client app: onboarding, OTP, case link redeem |
| Dashboard (next hearing card, alerts) |
| My Cases list + case detail (Overview / Timeline / Hearings) |
| Timeline visual component |
| Notification centre + preference screen |
| Bangla-first UI, language toggle, বড় tap target, font scaling |
| Offline read cache (core screen) |
| **Demo:** client নিজের ফোনে নিজের মামলার তারিখ ও timeline দেখে |

### Sprint 6 · 1–12 Dec — **Documents & Property**
| Deliverable |
|---|
| Document upload (web + mobile camera), virus scan, versioning |
| Storage adapter, presigned download, access log |
| `client_visible` toggle + client-side filtered list |
| CourtOrder + hearing-এ attach + release-to-client control |
| Property, LandRecord, Deed, Mutation, TaxRecord CRUD |
| CasePropertyLink + property-wise case view |
| Dag/Khatian/Mouza search |
| Client "My Properties" vault |
| **Demo:** Land Survey Tribunal case-এ khatian upload, dag দিয়ে search, client vault-এ দেখা |

### Sprint 7 · 15–26 Dec — **Billing & Dashboard**
| Deliverable |
|---|
| FeeAgreement, Invoice + line item, invoice numbering |
| Invoice PDF (firm letterhead, Bangla) |
| Payment record (manual) + receipt + ledger |
| Case ledger view + client due view |
| Financial dashboard (today/month/outstanding/overdue) |
| Lawyer dashboard সম্পূর্ণ (agenda + counters + alerts) |
| Client billing screen |
| **Demo:** invoice issue → client app-এ due দেখা → payment record → receipt |

### Sprint 8 · 29 Dec – 9 Jan — **Hardening & Launch prep**
| Deliverable |
|---|
| Performance tuning (query audit, N+1 removal, index verify vs NFR N1) |
| Full tenant-isolation regression + permission matrix test |
| Error handling, empty state, loading state, Bangla copy review |
| Onboarding flow + sample data + in-app help |
| Data migration tooling (pilot chamber-এর existing register → CSV import) |
| ToS / Privacy Policy / disclaimer সব entry point-এ |
| Production infra: backup, PITR, monitoring, alerting, runbook |
| App store submission (Play Store + App Store review buffer ২ সপ্তাহ) |
| UAT with pilot chambers |
| **M2 — 26 Dec:** feature complete · **Sprint 8 = stabilise only, নতুন feature নয়** |

> **Sprint 8-এ scope creep = pilot delay।** কোনো নতুন feature request Phase 2 backlog-এ যাবে, ব্যতিক্রম শুধু Sev-1 defect।

---

## 3. Pilot (12 Jan – 13 Feb 2027)

| Week | Activity |
|---|---|
| Pilot W1 | ৩টি chamber onboarding — on-site, hands-on data migration (আমরাই তাদের register entry করে দেব), lawyer + assistant training |
| Pilot W2 | Daily usage monitoring; প্রতিদিন check-in call; Sev-1/2 hot-fix |
| Pilot W3 | Client-side onboarding (প্রতি chamber-এ ২০+ client); notification delivery audit |
| Pilot W4 | Exit interview; metric review; GA go/no-go decision |

### Pilot exit criteria (M4 gate)

| # | Criterion | Target |
|---|---|---|
| PE1 | Hearing outcome আদালতের দিনেই entry হয়েছে | ≥ 80% hearing |
| PE2 | Notification delivery success | ≥ 97% |
| PE3 | Client-এর "তারিখ কবে?" ফোন কমেছে (lawyer-এর self-report) | লক্ষণীয়ভাবে কমেছে, ৩/৩ chamber বলবে |
| PE4 | Sev-1 defect open | 0 |
| PE5 | Cross-tenant data leak | 0 (verified by test + log audit) |
| PE6 | Lawyer NPS | ≥ 30 |
| PE7 | ৩টির মধ্যে অন্তত ২টি chamber paid subscription-এ যেতে রাজি | ২/৩ |
| PE8 | Data entry সময় প্রতি hearing | ≤ 30 সেকেন্ড (measured) |

**PE7 বা PE8 ব্যর্থ হলে GA পিছিয়ে যাবে** এবং core loop UX পুনরায় design করা হবে। বাকি সব pass করলেও এই দুটি না হলে product commercially viable নয়।

---

## 4. Post-GA Phases

### Phase 2 — Practice Operations (Feb–Apr 2027, ৫ sprint)
| Sprint | Focus |
|---|---|
| P2-S1 | Staff roles + RBAC full matrix + firm member invite |
| P2-S2 | Payment gateway (bKash/Nagad/SSLCommerz) + webhook + reconciliation + subscription billing |
| P2-S3 | Task management + stage task rules + WhatsApp Business API |
| P2-S4 | Reports (case/court/hearing/financial/client) + export; conflict detection |
| P2-S5 | In-app messaging; Lawyer mobile app; recurring retainer; expense tracking |

### Phase 3 — AI Layer (May–Jul 2027, ৬ sprint)
OCR pipeline (Bangla+English) → structured extraction (khatian/dag/mouza) → case summary → timeline draft → semantic search → smart reminders। প্রতিটি feature-এর সাথে **review gate ও provenance record** একই sprint-এ, পরে নয়।

### Phase 4 — Court Integration (Aug–Oct 2027, conditional)
**Sprint 0 = legal/authorization work, engineering নয়।** অনুমোদন না পেলে phase পিছিয়ে যাবে এবং Phase 5 এগিয়ে আসবে — product-এর কোনো core feature এই phase-এর উপর নির্ভরশীল নয় (rule AP2)।

### Phase 5 — Marketplace (Nov 2027–Feb 2028)
Lawyer discovery → appointment → consultation → escrow payment → review। এই phase-এ regulatory review নতুন করে দরকার (lawyer advertising ও referral নিয়ে Bar Council-এর বিধি)।

---

## 5. Test Strategy

| Level | Coverage | Tooling |
|---|---|---|
| Unit | Core business logic ≥ 80%: outcome transaction, workflow transition, notification scheduling, ledger computation, permission resolution | pytest |
| **Tenant isolation** | প্রতিটি tenant-scoped endpoint — Firm-A token, Firm-B object → **404**। Generated, CI-blocking। | pytest parametrised |
| Permission | RBAC matrix-এর প্রতিটি cell একটি test | pytest |
| API contract | সব endpoint-এর request/response schema; mobile app breakage ঠেকাতে | schemathesis / OpenAPI |
| Integration | Outcome loop end-to-end: API → DB → Celery → mock provider → delivery log | pytest + celery eager |
| Notification | Idempotency (double trigger → ১টি send), rollback safety, quiet hours, fallback logic | dedicated suite |
| E2E | Core loop, client onboarding, document visibility — staging-এ | Playwright |
| Mobile | Core screen smoke, push receive, offline cache | Detox / manual matrix |
| Performance | NFR N1-এর against seeded 500-case firm | locust |
| Security | SAST, dependency scan, secret scan প্রতি PR; **external pentest Sprint 8-এ** | CI + vendor |
| UAT | Pilot lawyer-দের দিয়ে, real মামলা দিয়ে | Scripted scenario |

**Non-negotiable CI gates:** tenant isolation · permission matrix · notification idempotency · migration reversibility। এই ৪টির যেকোনো একটি fail = merge blocked।

---

## 6. Definition of Done

একটি story তখনই done যখন:

- [ ] Acceptance criteria পূরণ, PR-এ ১টি approval
- [ ] Unit + integration test লেখা ও pass
- [ ] Tenant isolation test (tenant-scoped হলে)
- [ ] Audit log entry (sensitive mutation হলে)
- [ ] Bangla ও English string reviewed (native speaker)
- [ ] Error ও empty state handled
- [ ] API doc (OpenAPI) updated
- [ ] Staging-এ verified
- [ ] ADR লেখা (architectural decision থাকলে)
- [ ] Mobile হলে: low-end Android + ৩G-তে যাচাই

---

## 7. Metrics — Day One থেকে Instrumented

| Category | Metric | কেন |
|---|---|---|
| **Core loop health** | Hearing outcome entered same-day % | Product-এর জীবনরেখা |
| | Median seconds per outcome entry | UX friction (PE8) |
| | Case-এ stale next_date (>hearing date, outcome nei) % | Data rot detection |
| **Notification** | Delivery success by channel | O3 |
| | Push→SMS fallback rate | Cost driver |
| | SMS segments per firm per month | Unit economics |
| **Adoption** | Lawyer DAU/WAU, sessions/week | O2 |
| | Client link redemption rate | O1 |
| | Client app open before hearing % | O1 |
| **Business** | Trial→paid conversion, MRR, churn, seats/firm | O5 |
| | Billing module usage | O4 |
| **Reliability** | p95 latency (case list, dashboard), error rate, uptime | N1/N3 |
| **Safety** | Cross-tenant attempt count, failed login, break-glass access | Security |

Dashboard Sprint 4-এর মধ্যে চালু — pilot-এর সময় metric না থাকলে PE1–PE8 যাচাই করা অসম্ভব।

---

## 8. Dependency & Critical Path

```
Advocate advisor নিয়োগ ──► workflow taxonomy sign-off ──► Sprint 2 (Case)
                                                              │
Pilot LOI ──────────────────────────────────────────────► Pilot (Jan)
                                                              ▲
SMS vendor contract + sender ID approval ──► Sprint 4 ────────┤
                                                              │
FCM setup ──► Sprint 3 ───────────────────────────────────────┤
                                                              │
App store account + review ──────► Sprint 8 ──────────────────┤
                                                              │
bKash merchant (12–16 wk, W1-এ শুরু) ──────────► Phase 2 S2   │
                                                              │
ToS/Privacy legal review ──────────► Sprint 8 ────────────────┘
```

**Critical path:** advisor → taxonomy → Sprint 2 → **Sprint 3 (core loop)** → Sprint 4 → pilot। Sprint 3-এর যেকোনো slip সরাসরি GA-তে slip করে।

**দীর্ঘতম lead time items — Week 1-এই শুরু করতে হবে:**
1. bKash/SSLCommerz merchant application (12–16 সপ্তাহ)
2. SMS sender ID (masking) approval (৪–৬ সপ্তাহ)
3. Apple Developer account + App Store review (৩–৬ সপ্তাহ)
4. Advocate advisor engagement

---

## 9. Backlog Parking Lot

MVP-তে ইচ্ছাকৃতভাবে বাদ, Phase 2+ এ বিবেচ্য — pilot feedback দিয়ে অগ্রাধিকার নির্ধারিত হবে:

Case health/progress bar · ICS/Google Calendar export · court holiday auto-skip · case archive/reopen · linked case graph · document folder custom · client document upload · lawyer-to-lawyer referral · multi-currency · Bengali numeral toggle · dark mode · case template (repeat case type) · voice note on hearing entry · offline write queue · client feedback/rating · bulk SMS campaign · letterhead editor · e-signature।
