-- 0039 : suivi editorial de la production de contenu (chaine enseignant ->
-- inspecteur -> ingenierie -> mise en ligne). Sert aussi d'outil de mesure du
-- temps par lecon pour le pilote. Une ligne par lecon suivie ; horodatage a
-- chaque changement d'etape. Acces reserve a l'administration (is_admin()).

create type production_stage as enum (
  'a_produire',      -- lecon assignee, pas encore de brouillon
  'brouillon',       -- brouillon remis par l'enseignant
  'en_relecture',    -- chez l'inspecteur pour recommandations
  'a_corriger',      -- renvoye a l'enseignant pour corrections
  'valide',          -- validation finale de l'inspecteur
  'en_production',   -- mise en video / format plateforme par l'ingenierie
  'verification',    -- verification finale enseignant + inspecteur
  'en_ligne'         -- publie et accessible aux eleves
);

create type production_mode as enum ('creation', 'adaptation');

create table content_production (
  lesson_id        uuid primary key references lessons (id) on delete cascade,
  stage            production_stage not null default 'a_produire',
  mode             production_mode  not null default 'creation',
  teacher_name     text,
  inspector_name   text,
  n_examples       int not null default 0,   -- exemples resolus
  n_exercises      int not null default 0,   -- exercices corriges
  n_figures        int not null default 0,   -- figures / schemas originaux
  n_quiz           int not null default 0,   -- questions de quiz
  cost_xof         int,                        -- cout final retenu (sinon suggestion barème)
  notes            text,
  -- horodatage d'entree dans chaque etape (a_produire = created_at)
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
