# 03 — Data Model

CaseFlow BD · Annex to [`PROJECT_PLAN.md`](../PROJECT_PLAN.md) · v1.0 · 16 Aug 2026

> Phase marker: **M** = MVP · **2/3/4/5** = later phase. MVP-তে later-phase table তৈরি করা হবে না, কিন্তু FK-এর জায়গা রাখা হয়েছে যাতে migration সহজ হয়।

---

## 1. Conventions

| Rule | Detail |
|---|---|
| Primary key | `UUID` (v7 যেখানে সম্ভব) — enumeration attack ঠেকাতে ও tenant merge সহজ করতে |
| Tenant column | সব tenant-scoped table-এ `firm_id` **NOT NULL**, indexed, `PROTECT` on delete |
| Timestamps | `created_at`, `updated_at` (auto); actor: `created_by`, `updated_by` |
| Soft delete | `is_deleted`, `deleted_at`, `deleted_by` — legal data hard-delete হয় না retention window-এর আগে |
| Money | `DECIMAL(12,2)`, currency `BDT` fixed (MVP) |
| Enum | Django `TextChoices`, DB-তে `varchar` + check constraint (migration-friendly) |
| Bilingual | user-facing label-এ `name_bn` ও `name_en` জোড়া |
| JSONB | শুধু configurable/variable payload-এ (workflow definition, event payload, sync raw) |

---

## 2. Entity-Relationship Overview

```
                          ┌──────────────┐
                          │   LawFirm    │  (tenant root)
                          └──────┬───────┘
        ┌────────────────────────┼───────────────────────────┐
        │                        │                           │
 ┌──────▼──────┐        ┌────────▼────────┐        ┌─────────▼────────┐
 │ FirmMember  │        │   Subscription  │        │    AuditLog      │
 │  (User↔Firm)│        │   (P2)          │        │                  │
 └──────┬──────┘        └─────────────────┘        └──────────────────┘
        │
 ┌──────▼──────┐        ┌─────────────┐        ┌──────────────┐
 │    User     │◄───────┤ ClientLink  ├───────►│    Client    │
 │ +LawyerProf │        │ (case-level │        └──────┬───────┘
 │ +ClientProf │        │  access)    │               │
 └─────────────┘        └──────┬──────┘               │
                               │                      │
                        ┌──────▼──────────────────────▼──────┐
                        │              Case                   │
                        └──┬──────┬──────┬──────┬──────┬──────┘
                           │      │      │      │      │
        ┌──────────────────┘      │      │      │      └───────────────┐
        │            ┌────────────┘      │      └──────┐               │
 ┌──────▼──────┐ ┌───▼───────┐    ┌──────▼──────┐ ┌────▼──────┐ ┌──────▼──────┐
 │  CaseParty  │ │  Hearing  │    │  CaseEvent  │ │ Document  │ │FeeAgreement │
 └─────────────┘ └─────┬─────┘    │ (append-    │ └─────┬─────┘ └──────┬──────┘
                       │          │  only)      │       │              │
                 ┌─────▼─────┐    └─────────────┘ ┌─────▼──────┐ ┌─────▼─────┐
                 │CourtOrder │                    │DocumentVer │ │  Invoice  │
                 └───────────┘                    └────────────┘ └─────┬─────┘
                       │                                               │
                 ┌─────▼──────────────┐                          ┌─────▼─────┐
                 │ScheduledNotification│                         │  Payment  │
                 └─────┬──────────────┘                          └───────────┘
                       │
              ┌────────▼──────────┐      ┌───────────────────────────────┐
              │NotificationDispatch│     │  Case ◄──► CasePropertyLink   │
              └────────┬───────────┘     │              │                │
                       │                 │        ┌─────▼──────┐         │
              ┌────────▼────────┐        │        │  Property  │         │
              │ DeliveryAttempt │        │        └─────┬──────┘         │
              └─────────────────┘        │   ┌──────────┼──────────┐     │
                                         │ LandRecord Deed   Mutation    │
              ┌──────────┐  ┌──────────┐ │              TaxRecord        │
              │  Court   │  │CourtType │ └───────────────────────────────┘
              └──────────┘  └────┬─────┘
                                 │
                       ┌─────────▼──────────┐
                       │ WorkflowDefinition │
                       │   └ WorkflowStage  │
                       └────────────────────┘
```

---

## 3. Tenancy & Identity

### `LawFirm` — tenant root · **M**
| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `name`, `name_bn` | varchar(200) | |
| `slug` | varchar(60) unique | |
| `firm_type` | enum | `SOLO` / `CHAMBER` / `FIRM` / `CORPORATE_LEGAL` |
| `address`, `district`, `phone`, `email` | | |
| `logo`, `letterhead_file` | file ref | Invoice PDF-এ |
| `default_language` | enum | `BN` / `EN` |
| `sms_quota_monthly`, `sms_used_current_period` | int | Cost control |
| `is_active`, `onboarded_at` | | |

### `User` · **M**
`AbstractBaseUser` — `mobile` (unique, login identifier), `email`, `full_name`, `full_name_bn`, `user_type` (`LAWYER`/`STAFF`/`CLIENT`/`PLATFORM_ADMIN`), `preferred_language`, `is_mobile_verified`, `is_active`, `last_seen_at`।

> **Note:** একজন মানুষ একই সাথে এক firm-এ lawyer ও অন্য মামলায় client হতে পারেন — তাই `user_type` primary role, এবং প্রকৃত access `FirmMember` + `ClientLink` থেকে derive হয়।

### `LawyerProfile` · **M**
`user` (1:1), `bar_enrollment_no`, `bar_council_year`, `enrollment_level` (`DISTRICT_COURT`/`HIGH_COURT`/`APPELLATE_DIVISION`), `specialisations` (array), `verification_status` (`SELF_DECLARED`/`DOCS_SUBMITTED`/`OFFICIALLY_VERIFIED`), `verification_docs`, `verified_at`, `verified_by`, `chamber_address`, `years_of_practice`, `photo`।

### `FirmMember` · **M** (role enum P2-তে সম্প্রসারিত)
`firm`, `user`, `role` (`FIRM_ADMIN`/`SENIOR_ADVOCATE`/`ASSOCIATE`/`JUNIOR`/`ASSISTANT`), `joined_at`, `is_active`, `seat_billable`. Unique `(firm, user)`।

### `Device` · **M**
`user`, `fcm_token` (unique), `platform`, `app_version`, `device_name`, `last_active_at`, `is_active` — push delivery ও unknown-device alert-এর ভিত্তি।

### `OtpRequest` · **M**
`mobile`, `purpose`, `code_hash`, `expires_at`, `attempts`, `consumed_at`, `ip` — rate limiting ও abuse detection।

### `Subscription` · **2**
`firm`, `plan`, `seats`, `status`, `current_period_start/end`, `sms_quota`, `storage_quota_gb`, `trial_ends_at`, `cancelled_at`।

---

## 4. Client & Access Linking

### `Client` · **M** *(tenant-scoped)*
`firm`, `full_name`, `full_name_bn`, `mobile`, `alt_mobile`, `email`, `address`, `district`, `nid_encrypted` (nullable, **MVP-তে ব্যবহার হবে না**), `photo`, `client_code` (firm-internal), `notes`, `is_active`।

> `Client` হলো firm-এর record। `User` হলো platform account। একজন client app ব্যবহার না করলেও তার `Client` record থাকবে — এই আলাদা রাখাটাই lawyer-কে day one থেকে সব মামলা entry করতে দেয়।

### `ClientLink` · **M**
`client`, `user` (nullable যতক্ষণ redeem না হয়), `invitation_code` (unique, short, expiring), `status` (`PENDING`/`ACTIVE`/`REVOKED`), `invited_at`, `redeemed_at`, `revoked_at`, `revoked_by`।

### `CaseClientRole` · **M**
`case`, `client`, `role` (`PLAINTIFF`/`DEFENDANT`/`PETITIONER`/`RESPONDENT`/`APPELLANT`/`THIRD_PARTY`), `is_primary`, `can_view` (bool) — এক case-এ একাধিক client, এবং প্রত্যেকের visibility আলাদা করা যায়।

---

## 5. Court & Workflow

### `CourtType` · **M**
`code`, `name`, `name_bn`, `hierarchy_level`, `jurisdiction_note`, `is_tribunal`।
Seed: `CIVIL_DISTRICT`, `LAND_SURVEY_TRIBUNAL`, `LAND_APPEAL_TRIBUNAL`, `JOINT_DISTRICT_JUDGE`, `ASSISTANT_JUDGE`, `SESSIONS`, `MAGISTRATE`, `HIGH_COURT_DIVISION`, `APPELLATE_DIVISION`, `ADMIN_TRIBUNAL`, `LABOUR_COURT`, `FAMILY_COURT`, `ARTHA_RIN_ADALAT`, `NARI_O_SHISHU`।

### `Court` · **M**
`court_type`, `name`, `name_bn`, `division`, `district`, `upazila`, `court_number`, `address`, `is_active`। *(Global reference data, tenant-scoped নয়।)*

### `Bench` · **M** — `court`, `name`, `judge_name`, `is_active`

### `CourtHoliday` · **2** — `date`, `title`, `applies_to` (court/national), `is_vacation`

### `WorkflowDefinition` · **M**
`court_type`, `firm` (nullable = platform default), `version`, `name`, `stages` (JSONB), `is_active`. Case তৈরির সময় version **pin** হয়।

**Default stage set — Civil Suit:**
`FILED → SUMMONS → APPEARANCE → WRITTEN_STATEMENT → ISSUE_FRAMING → PLAINTIFF_EVIDENCE → DEFENDANT_EVIDENCE → ARGUMENT → JUDGMENT → DECREE → EXECUTION / APPEAL → CLOSED`

**Default stage set — Land Survey Tribunal:**
`FILED → NOTICE → APPEARANCE → WRITTEN_STATEMENT → RECORD_EXAMINATION → LOCAL_INVESTIGATION → EVIDENCE → ARGUMENT → JUDGMENT → RECORD_CORRECTION_ORDER → APPEAL / CLOSED`

> ⚠️ এই দুটি taxonomy **advocate advisor দিয়ে M0-তে validate করাতেই হবে** (Open Question Q1/Q2)। ভুল taxonomy = অব্যবহারযোগ্য product।

---

## 6. Case Core

### `Case` · **M** *(tenant-scoped)*
| Field | Type | Notes |
|---|---|---|
| `firm` | FK | tenant |
| `case_number` | varchar(50) | যেমন `251` |
| `case_year` | int | `2024` |
| `display_number` | varchar(80) | derived, `251/2024`, indexed |
| `title` | varchar(300) | `রহিম বনাম করিম` |
| `court`, `bench` | FK | |
| `court_type` | FK | denormalised, filter-এর জন্য |
| `case_category` | enum | `CIVIL`/`LAND`/`CRIMINAL`/`FAMILY`/`WRIT`/`APPEAL`/`EXECUTION`/`ARBITRATION`/`OTHER` |
| `our_side` | enum | `PLAINTIFF`/`DEFENDANT`/... |
| `filing_date` | date | |
| `status` | enum | `ACTIVE`/`PENDING`/`AWAITING_ORDER`/`URGENT`/`DISPOSED`/`APPEALED`/`CLOSED` |
| `workflow_definition`, `workflow_version` | FK/int | pinned |
| `current_stage` | varchar | workflow-এর stage code |
| `stage_updated_at` | | |
| `assigned_lawyer` | FK FirmMember | |
| `next_hearing` | FK Hearing (null) | **denormalised hot field** — dashboard/list-এ N+1 এড়াতে |
| `last_hearing` | FK Hearing (null) | client-এর "আগের তারিখ কী ছিল?" — সরাসরি |
| `subject_matter`, `relief_sought`, `internal_notes` | text | `internal_notes` কখনো client-visible নয় |
| `parent_case` | FK self (null) | appeal ← original |
| `opened_at`, `closed_at`, `closure_reason` | | |
| `is_deleted` | | |

**Constraints & indexes:**
```
UNIQUE (firm, court, case_number, case_year)  WHERE is_deleted = false
INDEX  (firm, status)
INDEX  (firm, assigned_lawyer, status)
INDEX  (firm, current_stage)
INDEX  (firm, display_number)
GIN    (to_tsvector('simple', title || ' ' || display_number))
```

### `CaseParty` · **M**
`case`, `party_type` (`PLAINTIFF`/`DEFENDANT`/`OPPOSING_COUNSEL`/`WITNESS`/`OTHER`), `name`, `name_bn`, `address`, `mobile`, `advocate_name`, `is_our_client`, `serial_no`।

### `CaseEvent` — **append-only timeline (rule A2)** · **M**
| Field | Notes |
|---|---|
| `case`, `firm` | |
| `event_type` | `CASE_FILED`/`NOTICE_ISSUED`/`APPEARANCE`/`WS_FILED`/`EVIDENCE`/`HEARING_SCHEDULED`/`HEARING_OUTCOME`/`ORDER_PASSED`/`ADJOURNED`/`STAGE_CHANGED`/`DOCUMENT_ADDED`/`JUDGMENT`/`APPEAL_FILED`/`CASE_CLOSED`/`CORRECTION`/`CUSTOM` |
| `event_date` | প্রকৃত ঘটনার তারিখ (created_at নয়) |
| `title`, `description`, `description_bn` | |
| `actor` | FK User |
| `hearing`, `document`, `order` | nullable FK |
| `payload` | JSONB — type-specific data |
| `client_visible` | bool, default **True** timeline event-এর জন্য |
| `corrects_event` | FK self (null) — correction পুরনো event মুছবে না, reference করবে |
| `created_at` | immutable |

**Immutability:** DB trigger `UPDATE`/`DELETE` block করবে (`client_visible` toggle ছাড়া, যা আলাদা audited path)। Correction মানে নতুন row, `corrects_event` সহ। UI পুরনো event strikethrough দেখাবে — মুছবে না।

---

## 7. Hearing — সবচেয়ে গুরুত্বপূর্ণ table

### `Hearing` · **M**
| Field | Type | Notes |
|---|---|---|
| `case`, `firm` | FK | |
| `date` | date | indexed |
| `time` | time (null) | |
| `court`, `bench` | FK | case-এর সাথে ভিন্ন হতে পারে |
| `purpose` | varchar | `Evidence`, `Argument`, `Order` |
| `stage_at_hearing` | varchar | |
| **`source`** | enum | **`LAWYER_ENTERED` / `CONFIRMED` / `OFFICIAL_SYNC` / `CLIENT_REPORTED`** — rule A1 |
| `confirmed_by`, `confirmed_at` | | `CONFIRMED` হলে কে করল |
| `status` | enum | `SCHEDULED`/`COMPLETED`/`CANCELLED`/`SUPERSEDED` |
| `outcome` | enum (null) | `ADJOURNED`/`HEARD`/`PART_HEARD`/`ORDER_PASSED`/`NOT_REACHED`/`NO_SITTING`/`SETTLED`/`DISPOSED` |
| `outcome_note` | text | |
| `outcome_recorded_by`, `outcome_recorded_at` | | |
| `client_attendance_required` | bool | → আলাদা notification |
| `documents_required` | text | → client reminder |
| `attending_lawyer` | FK FirmMember | |
| `previous_hearing` | FK self (null) | chain — "আগের তারিখ" instantly |
| `next_hearing` | FK self (null) | |
| `superseded_by` | FK self (null) | date change হলে পুরনো row রয়ে যায় |
| `original_date` | date (null) | reschedule audit |

**Indexes:**
```
INDEX (firm, date, status)                -- calendar / diary
INDEX (firm, attending_lawyer, date)      -- lawyer agenda
INDEX (case, date DESC)                   -- case history
PARTIAL INDEX (firm, date) WHERE status = 'SCHEDULED'  -- reminder scan
```

**Date-change নিয়ম:** পুরনো hearing row কখনো `date` field overwrite করে না। নতুন row তৈরি, পুরনোতে `status=SUPERSEDED` + `superseded_by`। এতে "তারিখ কতবার পিছিয়েছে" — যা client-এর কাছে অত্যন্ত মূল্যবান তথ্য — স্বয়ংক্রিয়ভাবে ধরা পড়ে।

### `CourtOrder` · **M**
`case`, `hearing` (null), `order_date`, `order_type` (`INTERIM`/`FINAL`/`DIRECTION`/`JUDGMENT`/`DECREE`), `summary`, `summary_bn`, `document` FK, `client_visible` (default **False**, rule A4), `released_to_client_at`, `released_by`।

---

## 8. Documents

### `Document` · **M**
`firm`, `case` (null — firm-level document হতে পারে), `client` (null), `property` (null), `category` (`PLAINT`/`WRITTEN_STATEMENT`/`KHATIAN`/`DEED`/`MUTATION`/`LAND_TAX`/`MAP`/`POWER_OF_ATTORNEY`/`COURT_ORDER`/`EVIDENCE`/`AFFIDAVIT`/`NOTICE`/`CORRESPONDENCE`/`OTHER`), `title`, `description`, `current_version`, `client_visible` (default **False**), `is_deleted`, `deleted_at/by`, `purge_after`।

### `DocumentVersion` · **M**
`document`, `version_no`, `storage_key`, `file_name`, `mime_type`, `size_bytes`, `sha256`, `uploaded_by`, `uploaded_at`, `virus_scan_status`, `page_count`, `ocr_status` (P3), `extracted_text` (P3), `extracted_fields` JSONB (P3)।

Unique `(document, version_no)`. পুরনো version কখনো মুছে না — শুধু `current_version` pointer সরে।

### `DocumentAccessLog` · **M**
`document_version`, `user`, `action` (`VIEW`/`DOWNLOAD`), `ip`, `at` — advocate–client dispute-এ "কে কখন দেখেছিল" প্রমাণ।

---

## 9. Property / Land — differentiator

### `Property` · **M** *(tenant-scoped)*
`firm`, `client` (null — client-এর নিজস্ব vault), `title`, `division`, `district`, `upazila`, `union_ward`, `mouza`, `jl_no`, `land_class` (`NAL`/`BHITI`/`POND`/`GARDEN`/`HOMESTEAD`/`COMMERCIAL`/`OTHER`), `total_area_decimal` DECIMAL(10,3), `ownership_share`, `possession_status`, `boundary_description`, `notes`。

### `LandRecord` · **M**
`property`, `record_type` (**`CS`/`SA`/`RS`/`BS`/`BRS`/`CITY_JARIP`/`DIARA`/`MAHANAGAR`**), `khatian_no`, `plot_dag_no`, `area_decimal`, `owner_name`, `share_fraction`, `record_year`, `is_disputed`, `dispute_note`, `document` FK.

**Indexes** — search-এর প্রকৃত pattern অনুযায়ী:
```
INDEX (firm, mouza, plot_dag_no)
INDEX (firm, record_type, khatian_no)
INDEX (property, record_type)
```

### `Deed` · **M**
`property`, `deed_no`, `deed_date`, `deed_type` (`SALE`/`GIFT`/`HEBA`/`EXCHANGE`/`PARTITION`/`INHERITANCE`/`MORTGAGE`/`LEASE`), `sub_registry_office`, `seller_name`, `buyer_name`, `area_decimal`, `consideration_amount`, `document` FK, `previous_deed` FK self (ownership chain)。

### `MutationRecord` · **M**
`property`, `mutation_case_no`, `mutation_date`, `new_khatian_no`, `office`, `status` (`APPLIED`/`APPROVED`/`REJECTED`/`PENDING`), `document` FK。

### `LandTaxRecord` · **M**
`property`, `holding_no`, `fiscal_year`, `amount_paid`, `payment_date`, `receipt_no`, `document` FK。

### `CasePropertyLink` · **M**
`case`, `property`, `relation_type` (`SUBJECT_MATTER`/`RELATED`/`SECURITY`), `disputed_dag_nos` (array), `note`.
Unique `(case, property)`. একই property-র সব মামলা এক query-তে — এটাই land-practice lawyer-এর কাছে সবচেয়ে মূল্যবান view।

### `RecordCorrectionRequest` · **M** — Land Survey Tribunal–specific
`case`, `land_record`, `correction_type` (`OWNER_NAME`/`AREA`/`DAG_NO`/`KHATIAN_NO`/`CLASSIFICATION`/`SHARE`/`OTHER`), `current_value`, `claimed_value`, `ground`, `status`, `order` FK.

---

## 10. Billing

### `FeeAgreement` · **M**
`case`, `client`, `fee_type` (`FIXED`/`STAGE_WISE`/`HOURLY`/`RETAINER`), `professional_fee`, `court_expense_estimate`, `documentation_fee`, `misc_fee`, `total_agreed`, `agreement_date`, `notes`。

### `Invoice` · **M**
`firm`, `case`, `client`, `invoice_no` (firm-wise sequence, unique per firm), `issue_date`, `due_date`, `subtotal`, `discount`, `total`, `amount_paid`, `amount_due` (derived), `status` (`DRAFT`/`ISSUED`/`PARTIALLY_PAID`/`PAID`/`OVERDUE`/`CANCELLED`), `notes`, `pdf_key`。

### `InvoiceLine` · **M**
`invoice`, `description`, `category` (`PROFESSIONAL_FEE`/`COURT_EXPENSE`/`DOCUMENTATION`/`TRAVEL`/`MISC`), `quantity`, `unit_price`, `amount`。

### `Payment` · **M**
`firm`, `invoice` (null — advance হতে পারে), `case`, `client`, `amount`, `payment_date`, `method` (`CASH`/`BANK`/`BKASH`/`NAGAD`/`CHEQUE`/`GATEWAY`), `reference_no`, `received_by`, `receipt_no`, `gateway_txn_id` (P2), `gateway_status` (P2), `notes`。

### `GatewayTransaction` · **2**
`firm`, `payment` (null), `gateway`, `intent_id`, `amount`, `status`, `raw_request` JSONB, `raw_response` JSONB, `webhook_received_at`, `reconciled_at` — idempotency key unique।

> **Ledger নীতি:** Payment row-ই source of truth; `Case.amount_due` কখনো stored field নয়, সবসময় computed (বা materialised view, Phase 2)। অর্থের ক্ষেত্রে denormalisation drift = বিশ্বাস হারানো।

---

## 11. Notifications

### `NotificationTemplate` · **M**
`code` (unique, যেমন `HEARING_REMINDER_T7`), `channel_defaults` (array), `subject_bn/en`, `body_bn/en`, `variables` (JSONB), `priority` (`NORMAL`/`URGENT`), `version`, `is_active`。

### `ScheduledNotification` · **M** — materialised schedule
`firm`, `template`, `recipient_user`, `case`, `hearing`, `scheduled_for` (timestamptz), `offset_label` (`T-7`/`T-3`/`T-1`/`T-0`), `status` (`PENDING`/`DISPATCHED`/`CANCELLED`/`SKIPPED`), `dedupe_key` **unique**, `cancelled_reason`。
```
INDEX (status, scheduled_for) WHERE status = 'PENDING'   -- worker scan
```

### `NotificationDispatch` · **M**
`firm`, `template`, `recipient_user`, `case`, `related_object` (generic), `priority`, `rendered_subject`, `rendered_body`, `language`, `dedupe_key` **unique**, `status`, `created_at` — rendered snapshot সংরক্ষিত (কী পাঠানো হয়েছিল তার প্রমাণ)।

### `DeliveryAttempt` · **M**
`dispatch`, `channel` (`PUSH`/`SMS`/`EMAIL`/`WHATSAPP`), `provider`, `provider_message_id`, `attempt_no`, `status` (`QUEUED`/`SENT`/`DELIVERED`/`FAILED`/`BOUNCED`/`REJECTED`), `error_code`, `error_message`, `cost_units` (SMS segment), `sent_at`, `delivered_at`。
```
INDEX (firm, channel, sent_at)   -- cost dashboard
```

### `NotificationPreference` · **M**
`user`, `channel`, `category`, `enabled`, `quiet_hours_start/end`, `lead_times` (array, যেমন `[7,3,1,0]`)。

---

## 12. Audit

### `AuditLog` · **M** — immutable
`firm` (null platform-level), `actor` (null system), `actor_type`, `action` (`case.create`, `hearing.outcome`, `document.delete`, `visibility.change`, `payment.record`, `permission.change`, `login.failed`, `export.data`, `breakglass.access`), `object_type`, `object_id`, `object_repr`, `before` JSONB, `after` JSONB, `ip`, `user_agent`, `request_id`, `created_at`。

**DB-level immutability:** `BEFORE UPDATE OR DELETE` trigger → `RAISE EXCEPTION`. Application user-এর `UPDATE`/`DELETE` grant থাকবে না। Retention ৭ বছর, তারপর cold archive।

**যেসব action অবশ্যই log হবে:** hearing date যেকোনো পরিবর্তন · document delete/visibility toggle · fee/payment · role/permission · client link/revoke · data export · failed login · break-glass access · AI output approval।

---

## 13. Later-Phase Tables (placeholder)

| Table | Phase | Purpose |
|---|---|---|
| `Task`, `StageTaskRule` | 2 | Task management ও auto-generation |
| `MessageThread`, `Message` | 2 | Case-scoped lawyer↔client chat |
| `Expense` | 2 | Court expense tracking |
| `ReportSnapshot` | 2 | Generated report cache |
| `AIJob`, `AIOutput` | 3 | OCR/summary job, provenance, review gate |
| `DocumentEmbedding` | 3 | Semantic search vector |
| `SyncSource`, `RawSyncRecord`, `SyncConflict` | 4 | Court integration |
| `LawyerListing`, `Appointment`, `Consultation`, `Review` | 5 | Marketplace |

---

## 14. Seed Data Requirements (M0/Sprint 1)

| Dataset | Volume | Source |
|---|---|---|
| Division / District / Upazila / Union | ~8 / 64 / 495 / 4500 | সরকারি administrative list |
| Court list (District Court, Tribunal) | ~1500 | [dhaka.judiciary.gov.bd](https://dhaka.judiciary.gov.bd/bn) সহ judiciary portal থেকে সংকলিত, advisor দিয়ে validated |
| CourtType | ~14 | §5 |
| WorkflowDefinition (Civil, Land Tribunal) | 2 | **Advocate advisor-validated** |
| NotificationTemplate (BN + EN) | ~18 | Product + advisor review |
| Document category | ~14 | §8 |
| Land record type | ~8 | §9 |

> Court ও administrative reference data সংগ্রহ ও যাচাই একটি **আলাদা Sprint-1 task** — এটি underestimate করলে development-এর মাঝপথে blocker হবে।
