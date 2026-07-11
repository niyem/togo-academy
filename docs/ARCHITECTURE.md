# Architecture — Togo Academy

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

## 6. Open decisions (resolved for Phase 0)

- **Payments:** start with bank transfer + admin verification; mobile-money
  aggregator (CinetPay / PayGate / Semoa / PayDunya) added in Phase 2 once a
  merchant account exists.
- **Video:** provider-agnostic `VideoPlayer` now; real provider chosen in Phase 1.
- **Content:** seeded placeholder curriculum now; real content via the teacher
  dashboard (Phase 4).

## 7. Phase 1 entry points (where to plug in Supabase)

- `src/lib/content/index.ts` — replace seed reads with SQL queries.
- `src/lib/supabase/{server,client}.ts` — already scaffolded.
- `src/app/inscription`, `src/app/connexion` — wire forms to Server Actions +
  Supabase Auth.
- `src/app/lecon/[lessonSlug]/page.tsx` — replace the `hasAccess` placeholder
  with a real subscription check.
- `src/components/lesson/VideoPlayer.tsx` — branch on `videoProvider` for the
  real embed.
