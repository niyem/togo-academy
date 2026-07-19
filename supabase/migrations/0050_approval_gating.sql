-- 0050 : onboarding par approbation.
-- Seuls les eleves ont un compte actif immediatement. Les concepteurs,
-- inspecteurs, tuteurs et parents recoivent un compte "en attente" tant que
-- l'administration n'a pas approuve. Apres approbation, ils recoivent un
-- e-mail avec un lien de connexion et se connectent avec leurs identifiants.

-- 1) Etat d'acces du compte : active (defaut) / pending / rejected.
alter table profiles add column if not exists access_state text not null default 'active';
alter table profiles drop constraint if exists profiles_access_state_check;
alter table profiles add constraint profiles_access_state_check
  check (access_state in ('active', 'pending', 'rejected'));

-- 2) A la creation d'un compte : un flag "pending" (dans les metadonnees)
--    marque le compte comme en attente ; il ne recoit pas de code de liaison.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested text := new.raw_user_meta_data ->> 'role';
  is_pending boolean := coalesce(new.raw_user_meta_data ->> 'pending', '') = 'yes';
  r user_role := case when requested in ('student','parent')
                      then requested::user_role else 'student'::user_role end;
begin
  insert into public.profiles (id, full_name, phone, role, class_slug, link_code, access_state)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.phone, new.raw_user_meta_data ->> 'phone'),
    r,
    new.raw_user_meta_data ->> 'class_slug',
    case when r = 'student' and not is_pending then public.gen_link_code() end,
    case when is_pending then 'pending' else 'active' end
  );
  return new;
end;
$$;

-- 3) Rattrapage : les candidats deja en attente (concepteur/inspecteur/tuteur)
--    qui sont encore de simples "eleves" passent en 'pending'.
update profiles p set access_state = 'pending'
  where p.role = 'student' and p.access_state = 'active'
    and exists (select 1 from collab_applications a
                where a.user_id = p.id and a.status = 'pending');

update profiles p set access_state = 'pending'
  where p.role = 'student' and p.access_state = 'active'
    and exists (select 1 from tutor_profiles t
                where t.user_id = p.id and t.status = 'pending');

-- 4) Demandes de compte parent : un parent demande un compte via l'identifiant
--    unique de son enfant (link_code). L'admin approuve ; jamais automatique.
create table if not exists parent_applications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  child_link_code text not null,
  child_student_id uuid references profiles(id),
  child_full_name text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table parent_applications enable row level security;

drop policy if exists parent_app_admin_all on parent_applications;
create policy parent_app_admin_all on parent_applications
  for all using (is_admin()) with check (is_admin());

drop policy if exists parent_app_owner_read on parent_applications;
create policy parent_app_owner_read on parent_applications
  for select using (auth.uid() = user_id);
