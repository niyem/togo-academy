-- 0040 : espace collaboratif de production de contenu (Phase 1).
-- Roles concepteur / inspecteur (accordes par l'admin apres candidature),
-- attribution d'une lecon a un concepteur, soumissions versionnees de fichiers,
-- et acceptation des conditions de cession de droits (mention de propriete).
--
-- NB : on n'utilise PAS les nouvelles valeurs d'enum dans ce meme fichier
-- (ALTER TYPE ADD VALUE ne peut pas etre utilise dans la meme transaction).
-- desired_role est un text + CHECK ; l'attribution du role se fait au runtime.

alter type user_role add value if not exists 'concepteur';
alter type user_role add value if not exists 'inspecteur';

-- Candidatures a l'espace de production
create table collab_applications (
  user_id       uuid primary key references profiles (id) on delete cascade,
  desired_role  text not null check (desired_role in ('concepteur', 'inspecteur')),
  full_name     text,
  phone         text,
  headline      text,
  message       text,
  subject_keys  text[] not null default '{}',
  class_slugs   text[] not null default '{}',
  cv_path       text,
  ip_accepted   boolean not null default false,
  ip_accepted_at timestamptz,
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table collab_applications enable row level security;
create policy "own collab application (rw)" on collab_applications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admin manages collab applications" on collab_applications
  for all using (public.is_admin()) with check (public.is_admin());

-- Un concepteur peut etre attribue a une lecon suivie
alter table content_production
  add column if not exists concepteur_id uuid references profiles (id) on delete set null;

-- Soumissions versionnees (fichiers) par le concepteur
create table content_submissions (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references lessons (id) on delete cascade,
  version     int not null,
  submitted_by uuid references profiles (id) on delete set null,
  file_path   text not null,          -- objet dans le bucket prive collab-docs
  file_name   text,
  note        text,
  created_at  timestamptz not null default now()
);
create index content_submissions_lesson_idx on content_submissions (lesson_id, version);

alter table content_submissions enable row level security;
-- L'admin gere tout
create policy "admin manages submissions" on content_submissions
  for all using (public.is_admin()) with check (public.is_admin());
-- Le concepteur attribue a la lecon peut deposer et voir ses soumissions
create policy "assigned concepteur inserts submissions" on content_submissions
  for insert with check (
    submitted_by = auth.uid()
    and exists (
      select 1 from content_production cp
      where cp.lesson_id = content_submissions.lesson_id
        and cp.concepteur_id = auth.uid()
    )
  );
create policy "assigned concepteur reads submissions" on content_submissions
  for select using (
    exists (
      select 1 from content_production cp
      where cp.lesson_id = content_submissions.lesson_id
        and cp.concepteur_id = auth.uid()
    )
  );

-- Bucket prive pour les documents de collaboration (cours, illustrations, ...)
insert into storage.buckets (id, name, public, file_size_limit)
values ('collab-docs', 'collab-docs', false, 26214400)  -- 25 Mo max par fichier
on conflict (id) do nothing;
