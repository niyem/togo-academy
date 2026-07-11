-- Togo Academy — initial schema (Phase 0)
-- PostgreSQL / Supabase. Mirrors src/lib/content/types.ts.
-- Hierarchy: education_levels -> classes -> subjects -> chapters -> lessons -> activities
-- Row-Level Security is enabled on every user-data table; policies at the bottom.

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists vector;     -- pgvector for AI tutor RAG embeddings

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role as enum ('student', 'parent', 'teacher', 'admin');
create type content_status as enum ('draft', 'in_review', 'published');
create type activity_type as enum ('video', 'lecture', 'exemple', 'exercice', 'quiz');
create type plan_cadence as enum ('monthly', 'termly', 'annual');
create type plan_scope as enum ('platform', 'class', 'subject');
create type subscription_status as enum ('pending', 'active', 'expired', 'cancelled');
create type payment_method as enum ('flooz', 'tmoney', 'bank_transfer');
create type payment_status as enum ('pending', 'confirmed', 'failed', 'refunded');

-- ---------------------------------------------------------------------------
-- Identity & roles
-- ---------------------------------------------------------------------------
-- One row per auth user. Created by a trigger on auth.users (see bottom).
create table profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  role         user_role not null default 'student',
  full_name    text,
  phone        text,
  locale       text not null default 'fr',
  class_slug   text,                       -- convenience for students
  created_at   timestamptz not null default now()
);

-- Parent <-> student links (a parent may follow several children).
create table parent_student_links (
  parent_id   uuid not null references profiles (id) on delete cascade,
  student_id  uuid not null references profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (parent_id, student_id)
);

-- ---------------------------------------------------------------------------
-- Content hierarchy
-- ---------------------------------------------------------------------------
create table education_levels (
  slug        text primary key,            -- primaire | college | lycee
  name        text not null,
  description text,
  sort_order  int not null default 0
);

create table classes (
  slug        text primary key,            -- 3eme, terminale, ...
  name        text not null,
  level_slug  text not null references education_levels (slug) on delete restrict,
  sort_order  int not null default 0
);

create table subjects (
  key         text primary key,            -- mathematiques, physique, ...
  name        text not null,
  icon        text,
  description text
);

create table chapters (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  class_slug  text not null references classes (slug) on delete cascade,
  subject_key text not null references subjects (key) on delete restrict,
  sort_order  int not null default 0
);

create table lessons (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  summary         text,
  chapter_id      uuid not null references chapters (id) on delete cascade,
  sort_order      int not null default 0,
  is_free_preview boolean not null default false,
  status          content_status not null default 'draft',
  pdf_path        text,                     -- Supabase Storage object path
  author_id       uuid references profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table activities (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references lessons (id) on delete cascade,
  type        activity_type not null,
  title       text not null,
  sort_order  int not null default 0,
  body        text,                          -- markdown for lecture/exemple/exercice
  video_provider text,                       -- youtube | bunny | cloudflare
  video_ref   text,
  duration_sec int,
  hint        text,
  solution    text
);

-- Quiz questions belong to a quiz-type activity.
create table quiz_questions (
  id          uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities (id) on delete cascade,
  prompt      text not null,
  explanation text,
  sort_order  int not null default 0
);

create table quiz_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references quiz_questions (id) on delete cascade,
  label       text not null,
  is_correct  boolean not null default false,
  sort_order  int not null default 0
);

-- ---------------------------------------------------------------------------
-- Commerce
-- ---------------------------------------------------------------------------
create table plans (
  slug        text primary key,
  name        text not null,
  price_xof   int not null,                 -- CFA franc, integer (no cents)
  cadence     plan_cadence not null,
  scope       plan_scope not null,
  scope_ref   text,                          -- class_slug or subject_key when scoped
  is_active   boolean not null default true
);

create table subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles (id) on delete cascade,
  plan_slug    text not null references plans (slug) on delete restrict,
  status       subscription_status not null default 'pending',
  period_start date,
  period_end   date,
  created_at   timestamptz not null default now()
);

create table payments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles (id) on delete cascade,
  subscription_id uuid references subscriptions (id) on delete set null,
  method        payment_method not null,
  status        payment_status not null default 'pending',
  amount_xof    int not null,
  reference     text,                        -- provider txn id / bank reference
  receipt_url   text,
  verified_by   uuid references profiles (id) on delete set null, -- admin for bank transfers
  created_at    timestamptz not null default now()
);

-- Raw provider callbacks for reconciliation (mobile-money webhooks, Phase 2).
create table payment_events (
  id          uuid primary key default gen_random_uuid(),
  payment_id  uuid references payments (id) on delete set null,
  provider    text,
  payload     jsonb not null,
  received_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Learning & progress
-- ---------------------------------------------------------------------------
create table enrollments (
  student_id  uuid not null references profiles (id) on delete cascade,
  class_slug  text not null references classes (slug) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (student_id, class_slug)
);

create table lesson_progress (
  student_id    uuid not null references profiles (id) on delete cascade,
  lesson_id     uuid not null references lessons (id) on delete cascade,
  state         text not null default 'in_progress', -- in_progress | completed
  percent       int not null default 0,
  last_position int,                         -- video seconds
  updated_at    timestamptz not null default now(),
  primary key (student_id, lesson_id)
);

create table quiz_attempts (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references profiles (id) on delete cascade,
  activity_id uuid not null references activities (id) on delete cascade,
  score       int not null default 0,
  total       int not null default 0,
  submitted_at timestamptz not null default now()
);

create table quiz_answers (
  attempt_id  uuid not null references quiz_attempts (id) on delete cascade,
  question_id uuid not null references quiz_questions (id) on delete cascade,
  option_id   uuid references quiz_options (id) on delete set null,
  is_correct  boolean not null default false,
  primary key (attempt_id, question_id)
);

-- ---------------------------------------------------------------------------
-- AI tutor
-- ---------------------------------------------------------------------------
create table ai_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles (id) on delete cascade,
  lesson_id   uuid references lessons (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table ai_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations (id) on delete cascade,
  role            text not null,             -- user | assistant
  content         text not null,
  created_at      timestamptz not null default now()
);

-- Chunked, embedded lesson content that grounds the tutor (RAG).
create table content_embeddings (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid references lessons (id) on delete cascade,
  chunk       text not null,
  embedding   vector(1536)
);

-- Helpful indexes
create index on chapters (class_slug, subject_key);
create index on lessons (chapter_id);
create index on activities (lesson_id);
create index on lesson_progress (student_id);
create index on subscriptions (user_id, status);
create index on payments (user_id, status);

-- ---------------------------------------------------------------------------
-- Auth helpers (SECURITY DEFINER to avoid RLS recursion on profiles)
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Create a profile row automatically for each new auth user.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.phone);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
-- Published content is world-readable; everything else is owner/role scoped.

-- Content tables: readable by anyone, writable by teachers/admins only.
alter table education_levels enable row level security;
alter table classes          enable row level security;
alter table subjects         enable row level security;
alter table chapters         enable row level security;
alter table lessons          enable row level security;
alter table activities       enable row level security;
alter table quiz_questions   enable row level security;
alter table quiz_options     enable row level security;
alter table plans            enable row level security;

create policy "public read levels"   on education_levels for select using (true);
create policy "public read classes"  on classes          for select using (true);
create policy "public read subjects" on subjects         for select using (true);
create policy "public read chapters" on chapters         for select using (true);
create policy "public read plans"    on plans            for select using (is_active);

-- Lessons: published are public; drafts visible to their author / staff.
create policy "read published lessons" on lessons for select
  using (status = 'published' or author_id = auth.uid() or public.is_admin());
create policy "staff write lessons" on lessons for all
  using (public.current_role() in ('teacher', 'admin'))
  with check (public.current_role() in ('teacher', 'admin'));

-- Activities / quiz follow their lesson's visibility for reads; staff write.
create policy "read activities" on activities for select using (true);
create policy "staff write activities" on activities for all
  using (public.current_role() in ('teacher', 'admin'))
  with check (public.current_role() in ('teacher', 'admin'));
create policy "read quiz questions" on quiz_questions for select using (true);
create policy "read quiz options"   on quiz_options   for select using (true);

-- Profiles: a user sees/edits their own; parents see linked students; admin sees all.
alter table profiles enable row level security;
create policy "read own or linked profile" on profiles for select
  using (
    id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from parent_student_links l
      where l.parent_id = auth.uid() and l.student_id = profiles.id
    )
  );
create policy "update own profile" on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- Parent/student links: the parent manages their own links.
alter table parent_student_links enable row level security;
create policy "parent manages links" on parent_student_links for all
  using (parent_id = auth.uid() or public.is_admin())
  with check (parent_id = auth.uid() or public.is_admin());

-- Progress & quiz results: student owns them; linked parent and admin can read.
alter table lesson_progress enable row level security;
alter table quiz_attempts   enable row level security;
alter table enrollments     enable row level security;

create policy "student writes own progress" on lesson_progress for all
  using (student_id = auth.uid())
  with check (student_id = auth.uid());
create policy "parent reads child progress" on lesson_progress for select
  using (
    student_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from parent_student_links l
      where l.parent_id = auth.uid() and l.student_id = lesson_progress.student_id
    )
  );

create policy "student writes own attempts" on quiz_attempts for all
  using (student_id = auth.uid())
  with check (student_id = auth.uid());
create policy "parent reads child attempts" on quiz_attempts for select
  using (
    student_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from parent_student_links l
      where l.parent_id = auth.uid() and l.student_id = quiz_attempts.student_id
    )
  );

create policy "student manages enrollment" on enrollments for all
  using (student_id = auth.uid() or public.is_admin())
  with check (student_id = auth.uid() or public.is_admin());

-- Subscriptions & payments: owner reads their own; admin manages all.
alter table subscriptions enable row level security;
alter table payments      enable row level security;

create policy "owner reads subscription" on subscriptions for select
  using (user_id = auth.uid() or public.is_admin());
create policy "admin writes subscription" on subscriptions for all
  using (public.is_admin()) with check (public.is_admin());

create policy "owner reads payment" on payments for select
  using (user_id = auth.uid() or public.is_admin());
create policy "admin writes payment" on payments for all
  using (public.is_admin()) with check (public.is_admin());

-- AI conversations: private to their owner.
alter table ai_conversations enable row level security;
alter table ai_messages      enable row level security;
create policy "own conversations" on ai_conversations for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own messages" on ai_messages for all
  using (exists (
    select 1 from ai_conversations c
    where c.id = ai_messages.conversation_id and c.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from ai_conversations c
    where c.id = ai_messages.conversation_id and c.user_id = auth.uid()
  ));
