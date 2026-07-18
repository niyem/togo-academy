-- 0041 : le suivi de production et les soumissions portent sur le MODULE
-- (= chapitre : ex. "PHY 1 · Energie electrique..."), et non plus sur la lecon.
-- Un module contient plusieurs lecons/capacites ; on attribue et on tarife par
-- module. Les tables 0039/0040 etaient vides, on les recree proprement.
-- Les enums production_stage / production_mode (0039) sont reutilises.

drop table if exists content_submissions;
drop table if exists content_production;

-- Suivi editorial d'un module (chapitre)
create table content_production (
  chapter_id       uuid primary key references chapters (id) on delete cascade,
  stage            production_stage not null default 'a_produire',
  mode             production_mode  not null default 'adaptation',
  concepteur_id    uuid references profiles (id) on delete set null,
  inspector_name   text,
  cost_xof         int,               -- cout final retenu (sinon: prix du module)
  notes            text,
  at_brouillon     timestamptz,
  at_en_relecture  timestamptz,
  at_a_corriger    timestamptz,
  at_valide        timestamptz,
  at_en_production timestamptz,
  at_verification  timestamptz,
  at_en_ligne      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index content_production_stage_idx on content_production (stage);

alter table content_production enable row level security;
create policy "admin manages content_production" on content_production
  for all using (public.is_admin()) with check (public.is_admin());
-- Le concepteur attribue voit ses modules (lecture seule).
create policy "assigned concepteur reads production" on content_production
  for select using (concepteur_id = auth.uid());

-- Soumissions versionnees d'un module (fichiers)
create table content_submissions (
  id           uuid primary key default gen_random_uuid(),
  chapter_id   uuid not null references chapters (id) on delete cascade,
  version      int not null,
  submitted_by uuid references profiles (id) on delete set null,
  file_path    text not null,
  file_name    text,
  note         text,
  created_at   timestamptz not null default now()
);
create index content_submissions_chapter_idx on content_submissions (chapter_id, version);

alter table content_submissions enable row level security;
create policy "admin manages submissions" on content_submissions
  for all using (public.is_admin()) with check (public.is_admin());
create policy "assigned concepteur inserts submissions" on content_submissions
  for insert with check (
    submitted_by = auth.uid()
    and exists (
      select 1 from content_production cp
      where cp.chapter_id = content_submissions.chapter_id
        and cp.concepteur_id = auth.uid()
    )
  );
create policy "assigned concepteur reads submissions" on content_submissions
  for select using (
    exists (
      select 1 from content_production cp
      where cp.chapter_id = content_submissions.chapter_id
        and cp.concepteur_id = auth.uid()
    )
  );
