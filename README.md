# CaseFlow BD

**AI-Powered Legal Case & Law Firm Management Platform for Bangladesh**

> আইনজীবী hearing শেষে একবার next date entry করবেন → system নিজেই calendar, timeline, client notification, reminder, task ও diary update করবে। Client-কে আর ফোন করে জিজ্ঞাসা করতে হবে না — "আগের তারিখটা কত ছিল?"

**Status:** Frontend Sprint ১–৫ সম্পন্ন (mock API-র উপর) · Backend শুরু হয়নি
**Kickoff target:** 1 September 2026
**বিস্তারিত অবস্থা:** [STATUS.md](STATUS.md)

---

## Planning Documents

| Document | Content |
|---|---|
| **[STATUS.md](STATUS.md)** | **উন্নয়নের বর্তমান অবস্থা** — কী সম্পন্ন, কী বাকি, ঝুঁকি |
| **[PROJECT_PLAN.md](PROJECT_PLAN.md)** | মাস্টার প্ল্যান — vision, scope, timeline, team, budget, risk, compliance, GTM |
| [docs/01-scope-and-requirements.md](docs/01-scope-and-requirements.md) | Personas, core loop, ১৭০+ functional requirement, RBAC matrix, NFR, open questions |
| [docs/02-architecture-and-stack.md](docs/02-architecture-and-stack.md) | Architecture, multi-tenancy, notification engine, security, integration, API surface |
| [docs/03-data-model.md](docs/03-data-model.md) | সব entity, field, enum, index, seed data requirement |
| [docs/04-delivery-roadmap.md](docs/04-delivery-roadmap.md) | Sprint-by-sprint MVP backlog, pilot exit criteria, test strategy, critical path |
| [docs/05-frontend-plan.md](docs/05-frontend-plan.md) | Lawyer Web (React) — stack decision, folder structure, route map, core loop UI spec, sprint plan, FE test/perf/a11y strategy |

---

## Positioning

এটি Supreme Court MyCase / e-Causelist / Judiciary CMS-এর **প্রতিস্থাপন নয়**।
এটি সরকারি court system ও lawyer–client সম্পর্কের মাঝখানে একটি **private practice-management, communication ও notification layer**।

Platform কখনো সরকারি system-এ write করে না, legal advice দেয় না, এবং case outcome predict করে না।

---

## Phases

| Phase | Window | Focus |
|---|---|---|
| **0** | Sep 2026 | Discovery, advisor, pilot LOI, setup |
| **1 — MVP** | Sep 2026 – Jan 2027 | The core loop: case, hearing, timeline, notification, document, land, billing |
| **Pilot** | Jan 2027 | ৩ chamber, real মামলা |
| **2** | Feb – Apr 2027 | Staff/RBAC, payment gateway, tasks, WhatsApp, reports |
| **3** | May – Jul 2027 | OCR, extraction, AI summary, semantic search |
| **4** | Aug – Oct 2027 | Court data integration *(authorization-gated)* |
| **5** | Nov 2027 – Feb 2028 | Legal services marketplace |

---

## Stack

Django 5 + DRF · PostgreSQL 16 · Celery + Redis · React + Vite + TypeScript · React Native (Expo) · FCM · S3-compatible storage · Docker

---

## Architectural Rules (non-negotiable)

1. **Date provenance** — প্রতিটি তারিখে `LAWYER_ENTERED` / `CONFIRMED` / `OFFICIAL_SYNC` লেবেল
2. **Append-only events** — case record কখনো silently overwrite হয় না
3. **Tenant isolation at query layer** — manual filter-এর উপর নির্ভরতা নেই
4. **Document visibility explicit** — `client_visible` default **False**
5. **Notification idempotency** — duplicate কখনো নয়
6. **Immutable audit trail**
7. **AI output = draft** — lawyer review ছাড়া client দেখবে না
8. **No official court data mutation**

---

## Next Steps

[PROJECT_PLAN.md §13](PROJECT_PLAN.md#13-immediate-next-steps-week-1) দেখুন। সবচেয়ে জরুরি তিনটি:

1. ৩টি pilot chamber-এর LOI — build শুরুর precondition
2. Practising advocate advisor নিয়োগ — workflow taxonomy validate করার জন্য
3. bKash/SSLCommerz merchant application — ১২–১৬ সপ্তাহ lead time
