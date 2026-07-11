-- 0008 : modele d'evaluation type Coursera (spec Niyem 2026-07-11).
-- Hierarchie : chapitre -> sous-chapitre -> lecons.
-- 1) Quiz DANS la video : questions horodatees (at_time_sec) rattachees a
--    l'activite video ; la video se met en pause, feedback correct/faux,
--    "Reessayer" ou "Passer".
-- 2) Evaluation a la fin de chaque sous-chapitre.
-- 3) Examen final par chapitre (10 chapitres => 10 examens).

create table subchapters (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  title      text not null,
  chapter_id uuid not null references chapters (id) on delete cascade,
  sort_order int not null default 0
);

alter table lessons add column if not exists subchapter_id
  uuid references subchapters (id) on delete set null;

create type assessment_kind as enum ('evaluation', 'examen');

create table assessments (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  kind          assessment_kind not null,
  subchapter_id uuid references subchapters (id) on delete cascade,
  chapter_id    uuid references chapters (id) on delete cascade,
  pass_percent  int not null default 60,
  sort_order    int not null default 0,
  constraint assessment_parent check (
    (kind = 'evaluation' and subchapter_id is not null and chapter_id is null)
    or (kind = 'examen' and chapter_id is not null and subchapter_id is null)
  )
);

-- Une question appartient soit a une activite (quiz de lecon, ou question
-- horodatee d'une video), soit a une evaluation/examen.
alter table quiz_questions alter column activity_id drop not null;
alter table quiz_questions add column if not exists assessment_id
  uuid references assessments (id) on delete cascade;
alter table quiz_questions add column if not exists at_time_sec int;
alter table quiz_questions add constraint quiz_question_parent check (
  ((activity_id is not null)::int + (assessment_id is not null)::int) = 1
);

-- Tentatives : idem, activite OU evaluation/examen.
alter table quiz_attempts alter column activity_id drop not null;
alter table quiz_attempts add column if not exists assessment_id
  uuid references assessments (id) on delete cascade;
alter table quiz_attempts add constraint quiz_attempt_parent check (
  ((activity_id is not null)::int + (assessment_id is not null)::int) = 1
);

alter table subchapters enable row level security;
alter table assessments enable row level security;
create policy "public read subchapters" on subchapters for select using (true);
create policy "public read assessments" on assessments for select using (true);
create policy "staff write subchapters" on subchapters for all
  using (public.current_role() in ('teacher', 'admin'))
  with check (public.current_role() in ('teacher', 'admin'));
create policy "staff write assessments" on assessments for all
  using (public.current_role() in ('teacher', 'admin'))
  with check (public.current_role() in ('teacher', 'admin'));

create index on subchapters (chapter_id);
create index on assessments (subchapter_id);
create index on assessments (chapter_id);
create index on quiz_questions (assessment_id);
