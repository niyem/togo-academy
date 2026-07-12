-- Certificats de cours (matiere x classe), emis en PDF telechargeable.
-- L'eligibilite (toutes les evaluations >= 70 % et tous les examens >= 80 %)
-- est verifiee COTE SERVEUR avant insertion via la cle service-role :
-- aucune policy INSERT, donc un eleve ne peut pas s'auto-emettre un
-- certificat via l'API REST avec son propre jeton.

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  -- Code public de verification, ex. TA-3F8A-9C21
  code text not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  class_slug text not null,
  subject_key text not null,
  student_name text not null,
  course_label text not null,
  issued_at timestamptz not null default now(),
  unique (user_id, class_slug, subject_key)
);

alter table public.certificates enable row level security;

-- Le titulaire voit ses propres certificats (tableau de bord, re-telechargement).
create policy "certificates owner select" on public.certificates
  for select to authenticated
  using (user_id = auth.uid());
