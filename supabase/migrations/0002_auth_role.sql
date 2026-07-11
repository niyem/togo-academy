-- 0002 : le trigger de creation de profil lit le role choisi a l'inscription.
-- Seuls 'student' et 'parent' sont acceptes depuis le client (jamais admin/
-- teacher, attribues par l'administrateur). On empeche aussi l'auto-escalade
-- de role via UPDATE.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, full_name, phone, role, class_slug)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.phone, new.raw_user_meta_data ->> 'phone'),
    case when requested in ('student', 'parent')
         then requested::user_role else 'student'::user_role end,
    new.raw_user_meta_data ->> 'class_slug'
  );
  return new;
end;
$$;

-- Un utilisateur ne peut pas changer son propre role.
create or replace function public.role_unchanged()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'role change not allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_role_guard on public.profiles;
create trigger profiles_role_guard
  before update on public.profiles
  for each row execute function public.role_unchanged();
