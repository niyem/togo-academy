-- Examens au format BAC (APC) :
-- 1. Types de questions au-dela du QCM : vrai/faux, texte a trous,
--    appariement, questions traditionnelles (reponse courte), situations
--    problemes (reponse redigee, corrigee par IA avec la grille officielle
--    Pertinence 1 / Correction 1,5 / Coherence 1 / Perfectionnement 0,5).
-- 2. Bareme par question (points) et regroupement par exercice (section).
-- 3. Detail des reponses et de la correction dans la tentative.
-- 4. Politique de repassage de l'examen : 4 tentatives incluses, 12 h entre
--    deux tentatives, au-dela un paiement rouvre 4 tentatives (grant admin).

alter table public.quiz_questions
  add column if not exists qtype text not null default 'qcm'
    check (qtype in ('qcm','vrai_faux','texte_trous','appariement',
                     'traditionnelle','situation_probleme')),
  add column if not exists payload jsonb,
  add column if not exists points numeric not null default 1,
  add column if not exists section text;

alter table public.quiz_attempts
  add column if not exists details jsonb;

create table if not exists public.exam_retake_grants (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  extra_attempts integer not null default 4,
  note text,
  created_at timestamptz not null default now()
);

alter table public.exam_retake_grants enable row level security;

create policy "student reads own grants" on public.exam_retake_grants
  for select using (auth.uid() = student_id);

create policy "admin manages grants" on public.exam_retake_grants
  for all using (public.is_admin()) with check (public.is_admin());
