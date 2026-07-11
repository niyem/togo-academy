# Architecture : Togo Academy

This document is the reference for the platform's architecture, data model,
sitemap and roadmap. It reflects the Phase 0 foundation in this repository.

## 1. Product principles

- **Comprehension + practice.** Every lesson pairs a short single-concept video
  with written explanation, worked examples, exercises and quizzes with
  immediate feedback.
- **Reach the underserved.** Where qualified STEM teachers are scarce, the
  platform delivers clear explanations to any student, anywhere.
- **Low-bandwidth first.** Server-rendered, lightweight pages; adaptive video;
  downloadable PDFs for offline revision.
- **French UI**, structured for additional languages later.

## 2. Technical architecture

```
Browser (mobile-first, FR)
   │  HTML/CSS, minimal JS
Next.js 16 App Router  ── Server Components render catalog & lessons
   │                     Server Actions handle auth, payments, AI calls
   ├── Supabase Postgres (RLS)   data + roles
   ├── Supabase Auth             email + phone OTP
   ├── Supabase Storage          gated PDFs (signed URLs)
   ├── Video provider            Bunny/Cloudflare adaptive HLS
   ├── Claude API + pgvector     grounded AI tutor (RAG)
   └── Payment aggregator        Flooz / TMoney (+ manual bank transfer)
Deployed on Vercel.
```

**Why relational (Postgres):** the content hierarchy and reporting are deeply
relational. **Why Supabase:** Auth + DB + Storage + RLS in one platform, matching
the team's existing expertise. **Why a seam layer** (`src/lib/content`): pages
depend on functions, not on the data source, so demo data swaps to SQL with no
page changes.

## 3. Data model

Hierarchy: `education_levels → classes → subjects → chapters → lessons →
activities`. Activities are typed (`video | lecture | exemple | exercice |
quiz`); quizzes own `quiz_questions → quiz_options`.

People: `profiles` (role: student/parent/teacher/admin) with
`parent_student_links` (many-to-many).

Commerce: `plans → subscriptions → payments → payment_events`.

Learning: `enrollments`, `lesson_progress`, `quiz_attempts → quiz_answers`.

AI: `ai_conversations → ai_messages`, `content_embeddings` (pgvector).

Full DDL with Row-Level Security: [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql).

### Access control (RLS summary)

| Data | Who can read | Who can write |
|---|---|---|
| Published content | Everyone | Teachers, admins |
| Draft content | Author + admin | Author (teacher), admin |
| Profile | Self, linked parent, admin | Self |
| Progress / quiz results | Student, linked parent, admin | Student |
| Subscriptions / payments | Owner, admin | Admin (bank-transfer verification) |
| AI conversations | Owner only | Owner |

## 4. Sitemap

```
PUBLIC   /  ·  /catalogue  ·  /classes/[classSlug]  ·  /lecon/[lessonSlug]
         /tarifs  ·  /a-propos  ·  /faq  ·  /contact  ·  /conditions  ·  /confidentialite
AUTH     /connexion  ·  /inscription (role: élève | parent)
STUDENT  /tableau-de-bord   (parent/teacher/admin dashboards: later phases)
```

### Core user flow

Visitor browses catalog → opens a **free** lesson (video + exercises + quiz) →
hits the paywall on a locked lesson → registers (student/parent) → subscribes
(bank transfer now; Flooz/TMoney later) → admin/webhook confirms → subscription
activates → full access → progress tracked → linked parent sees reports.

## 5. Roadmap

| Phase | Scope | Status |
|---|---|---|
| 0 | Foundation: design system, public pages, DB schema + RLS, auth scaffold, demo content | ✅ this repo |
| 1 | MVP: Supabase wired, real auth (phone OTP), real video, progress tracking, one plan + bank transfer | next |
| 2 | Commerce & parents: all plans, Flooz/TMoney aggregator, gated PDFs, parent linking + reports | |
| 3 | AI: RAG tutor grounded on lessons + navigation chatbot | |
| 4 | Authoring: teacher content dashboard + review/publish workflow | |
| 5 | Admin & analytics: admin dashboard, aggregate metrics, assessments | |
| 6 | Live tutoring marketplace: on-demand 1:1 sessions, auto-matching by level/subject, per-session payment, weekly Flooz payouts to admin-approved tutors | |

## 6. Open decisions (resolved for Phase 0)

- **Payments:** start with bank transfer + admin verification; mobile-money
  aggregator (CinetPay / PayGate / Semoa / PayDunya) added in Phase 2 once a
  merchant account exists.
- **Video:** provider-agnostic `VideoPlayer` now; real provider chosen in Phase 1.
- **Content:** seeded placeholder curriculum now; real content via the teacher
  dashboard (Phase 4).

## 7. Phase 1 entry points (where to plug in Supabase)

- `src/lib/content/index.ts` : replace seed reads with SQL queries.
- `src/lib/supabase/{server,client}.ts` : already scaffolded.
- `src/app/inscription`, `src/app/connexion` : wire forms to Server Actions +
  Supabase Auth.
- `src/app/lecon/[lessonSlug]/page.tsx` : replace the `hasAccess` placeholder
  with a real subscription check.
- `src/components/lesson/VideoPlayer.tsx` : branch on `videoProvider` for the
  real embed.

## 8. Phase 6: Live tutoring marketplace (planned design)

Human 1:1 tutoring alongside the AI tutor. AI is instant, cheap and always-on
for routine questions; when a student needs depth, it escalates to booking a
live human session. Not part of the MVP; documented here so the data model can
accommodate it without a later rewrite.

**Model:** on-demand **1:1 private** sessions (no group office hours, so a tutor
is only ever paid when matched to a paying student). Flow: student picks a
subject + level → **browses the tutors currently online** for that
subject/level (name, rating, sessions given) and decides whether to proceed →
pays → the matching engine assigns an **online, available, admin-approved**
tutor → live session (WebRTC) → earnings accrue to a ledger → **weekly batched
payout** to the tutor's Flooz wallet, minus platform commission.

**No-match safeguard (credit, not refund):** the tutor list is shown *before*
payment, so students rarely pay into an empty queue. If a student pays and no
tutor can be matched (everyone went offline or got taken), the amount is
converted into **platform credit** on the student's balance, spendable on a
later session (or other paid features). This avoids mobile-money refunds
entirely, which are slow and fee-heavy. Paying for a session first draws from
any existing credit, then charges the remainder via mobile money.

**Planned tables:**

| Table | Purpose |
|---|---|
| `tutor_profiles` | user_id → profiles, approval_status, subjects[], classes[], bio, session_rate_xof, payout_msisdn (Flooz), rating_avg, is_online |
| `tutor_verifications` | KYC / identity / credential docs, reviewed_by (admin) |
| `tutoring_sessions` | student_id, tutor_id (null until matched), subject_key, class_slug, status (requested/matched/active/completed/cancelled/refunded), price_xof, room_id, started_at, ended_at, recording_url |
| `match_requests` | queued student requests awaiting a match (subject, level, requested_at, status) : drives the matching engine |
| `session_payments` | links to `payments`; on no-match the amount is converted to student credit instead of refunded |
| `student_credits` | credit ledger per student: entries (+ from no-match conversions or top-ups, - when spent on a session), running balance derivable |
| `tutor_earnings` | ledger per session: gross_xof, commission_xof, net_xof, payout_week, payout_id |
| `payouts` | tutor_id, week, total_net_xof, method (flooz), status, provider_ref, initiated_by |
| `session_reviews` | student rates tutor after the session |

**New infra dependencies for this phase:** a WebRTC provider (LiveKit / Daily /
Jitsi) prioritizing audio + shared whiteboard with video optional and an
audio-only fallback for low bandwidth; and a mobile-money **disbursement** API
(payouts) from the same aggregator chosen for collections. Open sub-decisions to
settle when we reach the phase: session length/pricing unit, commission split,
whether credit is withdrawable or spend-only (recommend spend-only), and how
long a match attempt runs before converting to credit.
