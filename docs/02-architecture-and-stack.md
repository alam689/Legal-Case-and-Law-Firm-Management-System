# 02 — Architecture & Technology Stack

CaseFlow BD · Annex to [`PROJECT_PLAN.md`](../PROJECT_PLAN.md) · v1.0 · 16 Aug 2026

---

## 1. Architecture Principles

| # | Principle |
|---|---|
| **AP1** | **Modular monolith, not microservices.** একটি Django project, কঠোরভাবে পৃথক app; service boundary কোডে প্রয়োগ করা হবে, network দিয়ে নয়। Scale সমস্যা হলে তখন extract করা হবে। |
| **AP2** | **Court integration is a plug-in, never a dependency.** Sync engine একটি optional adapter; সেটি না থাকলেও product সম্পূর্ণ কার্যকর। |
| **AP3** | **Write path is boring, read path is fast.** Legal data-তে correctness > cleverness। Denormalisation শুধু measured hot path-এ। |
| **AP4** | **Every mutation is an event.** Case-এর state event stream থেকে derived; timeline কোনো আলাদা feature নয়, এটাই source of truth-এর projection. |
| **AP5** | **Provider abstraction for everything vendor-bound.** SMS, storage, payment, push, LLM — সবই interface-এর পেছনে। বাংলাদেশে vendor পরিবর্তন স্বাভাবিক ঘটনা। |
| **AP6** | **Fail loud on isolation, fail soft on delivery.** Tenant leak = হার্ড error। Notification failure = retry + log, কখনো user flow ব্লক করবে না। |

---

## 2. System Context

```
   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
   │ Client       │   │ Lawyer Web   │   │ Lawyer Mobile│
   │ Mobile (RN)  │   │ (React/Vite) │   │ (RN, P2)     │
   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
          └──────────────────┼──────────────────┘
                             │ HTTPS · JWT · REST
                   ┌─────────▼──────────┐
                   │  Nginx  (TLS, rate │
                   │  limit, static)    │
                   └─────────┬──────────┘
                             │
        ┌────────────────────▼─────────────────────┐
        │        Django 5 + DRF  (gunicorn)        │
        │                                          │
        │  apps/                                   │
        │   accounts   tenancy   clients   cases   │
        │   hearings   documents properties        │
        │   billing    notifications  audit        │
        │   tasks(P2)  messaging(P2)  ai(P3)       │
        │   courtsync(P4)                          │
        └───┬──────────────┬─────────────┬─────────┘
            │              │             │
   ┌────────▼────┐  ┌──────▼──────┐  ┌───▼──────────────┐
   │ PostgreSQL  │  │ Redis       │  │ S3-compatible    │
   │ (+replica)  │  │ cache+broker│  │ object storage   │
   └─────────────┘  └──────┬──────┘  └──────────────────┘
                           │
             ┌─────────────▼──────────────┐
             │ Celery workers + Beat      │
             │  · reminder scheduler      │
             │  · notification dispatcher │
             │  · document post-process   │
             │  · report generation       │
             │  · court sync (P4)         │
             └─────────────┬──────────────┘
                           │
   ┌───────┬───────────────┼────────────┬──────────────┐
   ▼       ▼               ▼            ▼              ▼
 FCM    SMS GW        SMTP/Email   WhatsApp(P2)   Payment GW(P2)
                                                  bKash/Nagad/SSL
                           │
                           ▼ (P3)
                    LLM / OCR provider
                           │
                           ▼ (P4, authorization-gated)
                 Official Court System APIs  ← READ ONLY
```

---

## 3. Backend Module Design

```
config/            settings (base/dev/staging/prod), urls, celery, asgi
core/              base models, tenant manager, mixins, permissions,
                   exceptions, pagination, provider registry
apps/
  accounts/        User, profiles, OTP, JWT, device, verification status
  tenancy/         LawFirm, membership, subscription, seat, isolation middleware
  clients/         Client, case-link invitation
  courts/          Court, CourtType, bench, district, holiday calendar
  cases/           Case, CaseParty, CaseEvent, workflow engine, stage config
  hearings/        Hearing, outcome, next-date logic, conflict detection
  documents/       Document, DocumentVersion, storage adapter, visibility
  properties/      Property, LandRecord, Deed, Mutation, TaxRecord, CasePropertyLink
  billing/         FeeAgreement, Invoice, InvoiceLine, Payment, Ledger
  notifications/   Template, Dispatch, DeliveryAttempt, channel providers,
                   scheduler, preference, quota
  audit/           AuditLog, signals, immutability guard
  tasks/     (P2)  Task, auto-generation rules
  messaging/ (P2)  Thread, Message
  ai/        (P3)  OCR, extraction, summary, semantic search, review gate
  courtsync/ (P4)  Adapters, reconciliation, change detection
```

**Dependency rule:** `apps.*` → `core` → Django। কোনো app অন্য app-এর model সরাসরি import করবে না যদি না তা ঘোষিত dependency হয়; cross-app communication signal বা service-function দিয়ে। এই নিয়ম import-linter দিয়ে CI-তে enforce করা হবে — এটাই ভবিষ্যতে service extraction সম্ভব রাখে।

---

## 4. Multi-Tenancy Implementation

**Model:** shared DB, shared schema, `firm` FK।

```python
# core/models.py
class TenantScopedQuerySet(models.QuerySet):
    def for_firm(self, firm_id):
        return self.filter(firm_id=firm_id)

class TenantScopedManager(models.Manager.from_queryset(TenantScopedQuerySet)):
    def get_queryset(self):
        firm_id = current_firm_id()          # contextvar, request middleware-এ set
        qs = super().get_queryset()
        if firm_id is None:
            if not unsafe_context_allowed(): # শুধু management command / celery-এ explicit opt-in
                raise TenantContextMissing()
            return qs
        return qs.filter(firm_id=firm_id)

class TenantScopedModel(models.Model):
    firm = models.ForeignKey("tenancy.LawFirm", on_delete=models.PROTECT, db_index=True)
    objects = TenantScopedManager()
    all_objects = models.Manager()           # শুধু admin/migration, explicit ব্যবহার
    class Meta:
        abstract = True
```

**Enforcement layers (defence in depth):**

1. **Middleware** — JWT থেকে `firm_id` resolve করে contextvar-এ set করে; client user-এর ক্ষেত্রে তার linked case-গুলোর firm scope।
2. **Default manager** — উপরের মতো, ভুলে filter না দিলে data ফাঁস নয়, exception।
3. **Postgres Row-Level Security** — Phase 2-এ `app.current_firm` session variable দিয়ে RLS policy — application bug-এর বিরুদ্ধে শেষ প্রতিরক্ষা।
4. **Automated test** — প্রতিটি tenant-scoped endpoint-এর জন্য generated test: Firm-A-এর token দিয়ে Firm-B-এর object id চাইলে **404** (403 নয় — existence leak এড়াতে)। এই test suite CI gate।

**Client user special case:** client কোনো firm-এর member নয়; তার access `CaseClientLink` দিয়ে case-level, এবং সে শুধু `client_visible=True` sub-resource দেখে। Client-এর জন্য আলাদা permission class ও serializer — lawyer serializer কখনো client-এর কাছে reuse হবে না (internal note leak ঠেকাতে)।

---

## 5. The Core Loop — Technical Design

`POST /api/v1/hearings/{id}/outcome/`

```python
@transaction.atomic
def record_outcome(hearing, *, outcome, next_date, next_purpose,
                   stage, note, notify_client, actor):
    # 1. বর্তমান hearing বন্ধ — mutate নয়, তথ্য যোগ
    hearing.outcome = outcome
    hearing.outcome_recorded_at = timezone.now()
    hearing.outcome_recorded_by = actor
    hearing.status = Hearing.Status.COMPLETED
    hearing.save(update_fields=[...])

    # 2. append-only event (rule A2)
    event = CaseEvent.objects.create(
        case=hearing.case, event_type=EventType.HEARING_OUTCOME,
        event_date=hearing.date, actor=actor, description=note,
        payload={"outcome": outcome, "previous_date": str(hearing.date)},
    )

    # 3. পরবর্তী hearing — provenance সহ (rule A1)
    next_hearing = None
    if next_date:
        next_hearing = Hearing.objects.create(
            case=hearing.case, date=next_date, purpose=next_purpose,
            court=hearing.court, stage=stage,
            source=DateSource.LAWYER_ENTERED,
            created_by=actor, previous_hearing=hearing,
        )

    # 4. stage transition — workflow engine validate করবে
    if stage and stage != hearing.case.current_stage:
        WorkflowEngine.transition(hearing.case, to_stage=stage, actor=actor)
        # ↳ stage rule অনুযায়ী Task auto-create (P2)

    # 5. audit (rule A6)
    AuditLog.record(actor, "hearing.outcome", hearing, before=..., after=...)

    # 6. side-effect commit-এর পরে (rule A6/A5) — DB rollback হলে notification যাবে না
    if next_hearing:
        transaction.on_commit(lambda: schedule_hearing_reminders.delay(next_hearing.id))
        if notify_client:
            transaction.on_commit(lambda: notify_case_clients.delay(
                case_id=hearing.case_id, template="HEARING_NEXT_DATE",
                dedupe_key=f"hearing:{next_hearing.id}:next_date:v1",
            ))
    return next_hearing
```

**কেন `on_commit` অপরিহার্য:** transaction rollback হলেও Celery task চলে যেতে পারে → client ভুল তারিখের SMS পাবে। Legal product-এ এটি সবচেয়ে ব্যয়বহুল bug class।

---

## 6. Notification Engine

```
                   Trigger (signal / API / scheduler)
                              │
                    ┌─────────▼──────────┐
                    │ NotificationService │
                    │  · resolve audience │
                    │  · load template    │
                    │  · check preference │
                    │  · check quiet hours│
                    │  · dedupe by key ───┼──► already sent? → drop
                    └─────────┬──────────┘
                              │
                    NotificationDispatch (row, status=QUEUED)
                              │
                    ┌─────────▼──────────┐
                    │ ChannelRouter      │
                    │ push-first policy  │
                    └──┬────┬────┬───┬───┘
                       │    │    │   │
                     Push  SMS  Email WhatsApp(P2)
                       │    │    │   │
                   DeliveryAttempt (per channel, per retry)
                       │
                   webhook/receipt → status update
```

**Scheduling model:** cron-scan নয়, **materialised schedule**। Hearing তৈরি হলেই ৪টি `ScheduledNotification` row লেখা হয় (T-7, T-3, T-1, T-0 সকাল ৮টা)। Celery Beat প্রতি ১৫ মিনিটে due row নেয় (`SELECT ... FOR UPDATE SKIP LOCKED`)। Hearing date বদলালে পুরনো pending schedule `CANCELLED`, নতুন schedule তৈরি — এবং একটি urgent "date changed" dispatch।

**Dedupe key format:** `{entity}:{id}:{template}:{schedule_offset}:{version}`। Unique constraint DB-তে → retry, race, বা duplicate trigger কখনো দ্বিতীয়বার পাঠাবে না (rule A5)।

**Cost control (push-first):**

| Event | Push | SMS | Email |
|---|:--:|:--:|:--:|
| T-7 reminder | ✓ | – | ✓ (opt) |
| T-3 reminder | ✓ | push undelivered হলে | – |
| T-1 reminder | ✓ | ✓ | – |
| Hearing day | ✓ | ✓ | – |
| **Date changed** | ✓ | ✓ (সবসময়) | ✓ |
| Attendance required | ✓ | ✓ | – |
| New document/order | ✓ | – | – |
| Invoice/payment | ✓ | – | ✓ |

SMS "push undelivered হলে" নির্ধারিত হয় FCM delivery receipt + app last-seen থেকে, ৩০ মিনিটের grace window-এ।

**Template:** DB-stored, versioned, Bangla + English, variable placeholder সহ। প্রতিটি dispatch-এ rendered body snapshot সংরক্ষিত — "system কী পাঠিয়েছিল" পরে প্রমাণ করা যাবে।

---

## 7. Configurable Workflow Engine

Case stage hardcode করা যাবে না — Civil Suit, Land Survey Tribunal, Criminal, Writ, Appeal সবার ধাপ আলাদা।

```
CourtType ──1:N──► WorkflowDefinition (versioned)
                        └── WorkflowStage (order, name_bn, name_en, is_terminal)
                                └── StageTransition (from → to, allowed)
                                └── StageTaskRule (P2: stage-এ ঢুকলে যে task তৈরি হবে)
```

- Definition JSONB-তে সংরক্ষিত, firm নিজের custom definition তৈরি করতে পারবে (Phase 2)।
- Case তৈরির সময় active definition version **pin** হবে — পরে definition বদলালে চলমান মামলা ভাঙবে না।
- Transition validation soft: অননুমোদিত transition warning দেবে, block করবে না (আদালতে বাস্তবে ধাপ লাফ দেয়)।
- Progress % = `completed_stages / total_stages` — এটি **administrative progress**, কখনো outcome probability হিসেবে label করা হবে না।

---

## 8. Document Storage & Security

```
Upload → virus scan (ClamAV) → mime/size validate
       → server-side encrypt → S3 private bucket
       → DocumentVersion row (sha256, size, uploader, timestamp)
       → thumbnail/preview generate (async)
       → [P3] OCR + text index (async)

Download → permission check (role + client_visible + case link)
        → presigned URL, TTL 5 min, single-use nonce logged
        → AuditLog entry
```

- Bucket path: `firm/{firm_id}/case/{case_id}/doc/{doc_id}/v{n}/{filename}` — firm prefix দিয়ে ভবিষ্যতে per-firm bucket/key-এ migrate করা সহজ।
- কোনো document সরাসরি public URL পাবে না, কখনো নয়।
- Delete = soft delete + `deleted_by`/`deleted_at`; object retention window (৯০ দিন) পরে purge job।
- Client কখনো `client_visible=False` document-এর অস্তিত্বও জানবে না (list থেকেই বাদ)।

---

## 9. Security Architecture

| Layer | Control |
|---|---|
| Transport | TLS 1.2+, HSTS, certificate auto-renew |
| Auth | JWT (access 15 min, refresh 7 d, rotation + reuse detection); Argon2id password; OTP rate-limited (৫/ঘণ্টা/নম্বর) |
| Authorization | DRF permission class + object-level check + tenant manager; deny-by-default |
| Input | DRF serializer validation; file type/size whitelist; SSRF guard external fetch-এ |
| Data at rest | Postgres volume encryption; document SSE; NID/sensitive column app-level encrypted (Phase 2) |
| Secrets | Environment/secret manager; repo-তে কখনো নয়; ত্রৈমাসিক rotation |
| Rate limit | Per-IP + per-user; OTP, login, export endpoint-এ কঠোর |
| Audit | Immutable append-only; DB trigger UPDATE/DELETE ব্লক করবে |
| Admin access | Platform admin case content দেখতে পারবে না; break-glass = time-boxed, firm-notified, dual-approval, logged |
| Monitoring | Sentry; failed-login, cross-tenant-attempt, mass-export alert |
| Testing | CI-তে dependency scan, SAST, secret scan; Phase 1 শেষে external pentest |

---

## 10. Integration Strategy

### 10.1 SMS
`SmsProvider` interface (`send(to, body, ref) -> ProviderMessageId`)। কমপক্ষে দুটি provider configured — primary fail হলে automatic failover। Bangla Unicode SMS = ৭০ character/segment, তাই template character-budget aware, এবং segment count আগেই estimate করে cost dashboard-এ দেখানো হবে।

### 10.2 Push
FCM; token per device; invalid token auto-prune; delivery receipt দিয়ে SMS fallback decision।

### 10.3 WhatsApp (Phase 2)
WhatsApp Business API — **শুধু pre-approved template message** এবং explicit opt-in সহ। Business messaging policy অনুসরণ বাধ্যতামূলক; unsolicited message পাঠানো হবে না।

### 10.4 Payment (Phase 2)
bKash / Nagad / SSLCommerz। নীতি:
- Payment intent server-side তৈরি, amount কখনো client থেকে আসবে না
- Webhook signature verify + idempotent processing
- Ledger posting শুধু confirmed webhook-এ, redirect-এ নয়
- প্রতিদিন reconciliation job — gateway settlement vs internal ledger
- **Platform subscription payment এবং lawyer fee payment সম্পূর্ণ আলাদা merchant flow ও ledger**

### 10.5 Court Data (Phase 4) — সবচেয়ে সংবেদনশীল

```
    Official Source (API / authorized feed)
                   │  READ ONLY
                   ▼
        CourtSyncAdapter (per source)
                   │
            RawSyncRecord (immutable)
                   │
          ChangeDetector — diff vs internal state
                   │
      ┌────────────┴────────────┐
      ▼                         ▼
 Auto-apply                 Reconciliation queue
 (source=OFFICIAL_SYNC,     (conflict: lawyer-entered ≠ official)
  no conflict)                     │
      │                            ▼
      └──────────────► Lawyer resolves → CaseEvent + notification
```

**অলঙ্ঘনীয় নিয়ম:**
1. Platform কখনো সরকারি system-এ **write** করবে না।
2. Ingestion শুধু সেই source থেকে যেখানে আইনগতভাবে ও technically অনুমোদিত — scraping-কে default হিসেবে ধরা হচ্ছে না; কর্তৃপক্ষের অনুমোদন ও ToS review আগে।
3. Conflict কখনো silently resolve হবে না — lawyer-ই সিদ্ধান্ত নেবেন কোনটি সঠিক।
4. `source` field ব্যবহারকারীর কাছে সবসময় দৃশ্যমান।

### 10.6 AI / LLM (Phase 3)
`LLMProvider` interface। নীতি:
- Client-identifying data prompt-এ পাঠানোর আগে redaction layer
- Provider-এর সাথে zero-retention/no-training চুক্তি বাধ্যতামূলক; না থাকলে self-hosted model
- প্রতিটি AI output-এ provenance record (model, version, prompt hash, cost, timestamp)
- Output সবসময় `DRAFT`; lawyer approve না করা পর্যন্ত client-visible নয় (rule A7)
- Firm-level opt-in — কোনো firm-এর data তাদের সম্মতি ছাড়া AI processing-এ যাবে না

---

## 11. API Surface (v1, MVP)

সব endpoint `/api/v1/` prefix; JWT bearer; JSON; cursor pagination; standardised error envelope।

```
POST   /auth/otp/request                    POST  /auth/otp/verify
POST   /auth/login                          POST  /auth/refresh
POST   /auth/logout                         GET   /auth/me
GET    /auth/devices                        DELETE /auth/devices/{id}

GET    /firm                                PATCH /firm

GET    /clients                             POST  /clients
GET    /clients/{id}                        PATCH /clients/{id}
POST   /clients/{id}/invitation             POST  /clients/import
POST   /client-links/redeem                 (client app: code → case link)

GET    /courts                              GET   /court-types
GET    /workflows                           (stage definitions)

GET    /cases                               POST  /cases
GET    /cases/{id}                          PATCH /cases/{id}
GET    /cases/{id}/timeline                 POST  /cases/{id}/events
GET    /cases/{id}/hearings                 GET   /cases/{id}/documents
GET    /cases/{id}/ledger                   POST  /cases/{id}/properties

GET    /hearings?date=&range=               POST  /hearings
GET    /hearings/{id}                       PATCH /hearings/{id}
POST   /hearings/{id}/outcome               ★ the core loop
POST   /hearings/{id}/confirm               (provenance → CONFIRMED)
GET    /hearings/agenda?date=today          (day view / diary)
GET    /calendar?month=                     (counts per day)

POST   /documents                           GET   /documents/{id}
POST   /documents/{id}/versions             GET   /documents/{id}/download
PATCH  /documents/{id}/visibility           DELETE /documents/{id}

GET    /properties                          POST  /properties
GET    /properties/{id}                     PATCH /properties/{id}
POST   /properties/{id}/land-records        POST  /properties/{id}/deeds
GET    /properties/search?dag=&khatian=&mouza=

GET    /invoices                            POST  /invoices
GET    /invoices/{id}/pdf                   POST  /invoices/{id}/payments
GET    /payments                            GET   /reports/financial-summary

GET    /notifications                       POST  /notifications/{id}/read
GET    /notification-preferences            PATCH /notification-preferences
POST   /devices/register                    (FCM token)

GET    /dashboard/lawyer                    GET   /dashboard/client
GET    /audit-logs                          (firm admin only)
```

**Client app আলাদা namespace ব্যবহার করবে না** — একই endpoint, কিন্তু permission class ও serializer role অনুযায়ী ভিন্ন, এবং client-এর জন্য field-level whitelist।

---

## 12. Environments & Deployment

| Env | Purpose | Data |
|---|---|---|
| `local` | Docker Compose, seeded fixture | Synthetic |
| `staging` | Auto-deploy `develop` | Anonymised |
| `production` | Manual approve `main` | Live |

**Pipeline:** PR → lint (ruff) + type (mypy) + test + tenant-isolation suite + import-linter + security scan → merge `develop` → staging deploy + smoke → manual approve → `main` → blue/green production deploy → post-deploy health check → auto-rollback on failure.

**Production topology (MVP scale):** ২টি app VM (gunicorn, load-balanced) + ১টি Celery worker VM + managed Postgres (primary + replica + PITR) + managed Redis + object storage + Nginx/CDN। Phase 2-এ worker আলাদা queue-তে বিভক্ত (notification / documents / reports)।

**Backup:** Postgres daily full + continuous WAL (RPO ≤15 min); object storage versioning + cross-region copy; ত্রৈমাসিক restore drill — untested backup = no backup।

---

## 13. Key Technical Decisions (ADR seeds)

| ADR | Decision | Alternative rejected | কারণ |
|---|---|---|---|
| 0001 | Modular monolith | Microservices | Team size ও scale-এ premature |
| 0002 | Shared-schema multi-tenancy | `django-tenants` schema-per-tenant | Migration ও analytics overhead |
| 0003 | Append-only CaseEvent | Mutable case state | Legal record integrity (rule A2) |
| 0004 | Materialised notification schedule | Cron scan of hearings | Idempotency, cancel/reschedule সহজ, scale-safe |
| 0005 | REST + DRF | GraphQL | Team familiarity, caching, mobile simplicity |
| 0006 | Postgres FTS প্রথমে | Elasticsearch day one | Operational cost; Phase 3-এ migrate |
| 0007 | Expo React Native | Native / Flutter | একই team-এ দুটি app; skillset reuse |
| 0008 | JWT + refresh rotation | Session cookie | Mobile-first |
| 0009 | Push-first, SMS fallback | SMS-first | Unit economics (§8.3 of plan) |
| 0010 | Court sync = optional adapter | Core dependency | External approval risk (R2) |

প্রতিটি ADR `docs/adr/` -এ পূর্ণ context সহ লেখা হবে যখন সেটি প্রকৃতপক্ষে নেওয়া হবে।
