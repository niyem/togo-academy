-- 0022 : tutorat en direct (tuteurs humains).
-- tutor_profiles : candidature + profil (matieres, classes, disponibilites).
--   status : pending -> approved / rejected (validation par l'admin).
--   Le role 'tutor' n'est accorde qu'a l'approbation (jamais en self-service).
-- tutor_sessions : demandes de seance eleve -> tuteur.

create table tutor_profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  full_name    text,
  phone        text,
  headline     text,               -- accroche courte
  bio          text,
  subject_keys text[] not null default '{}',   -- matieres enseignees
  class_slugs  text[] not null default '{}',   -- classes couvertes
  availability text,               -- disponibilites en texte libre
  rate_xof     int,                -- tarif indicatif par seance
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table tutor_profiles enable row level security;

-- Profils approuves visibles de tous (place de marche) ; le tuteur voit le
-- sien meme non approuve ; l'admin voit tout.
create policy "read approved tutor profiles" on tutor_profiles for select
  using (status = 'approved' or user_id = auth.uid() or public.is_admin());

-- Le tuteur cree et met a jour son propre profil ; l'admin tout.
create policy "tutor writes own profile" on tutor_profiles for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create table tutor_sessions (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references auth.users (id) on delete cascade,
  tutor_id      uuid not null references auth.users (id) on delete cascade,
  subject_key   text,
  class_slug    text,
  message       text,
  preferred_time text,
  status        text not null default 'requested'
                  check (status in ('requested', 'accepted', 'declined',
                                     'cancelled', 'completed')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index tutor_sessions_tutor on tutor_sessions (tutor_id, created_at desc);
create index tutor_sessions_student on tutor_sessions (student_id, created_at desc);

alter table tutor_sessions enable row level security;

-- Seuls les participants (et l'admin) voient une seance.
create policy "participants read session" on tutor_sessions for select
  using (student_id = auth.uid() or tutor_id = auth.uid() or public.is_admin());

-- L'eleve cree la demande (pour lui-meme).
create policy "student creates session" on tutor_sessions for insert
  with check (student_id = auth.uid());

-- Les deux participants peuvent faire evoluer le statut (accepter/refuser/annuler).
create policy "participants update session" on tutor_sessions for update
  using (student_id = auth.uid() or tutor_id = auth.uid() or public.is_admin())
  with check (student_id = auth.uid() or tutor_id = auth.uid() or public.is_admin());
