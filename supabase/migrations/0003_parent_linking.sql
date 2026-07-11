-- 0003 : liaison parent-eleve par code court.
-- Chaque eleve a un code (ex. TG-4F7K2M) ; le parent le saisit pour relier
-- son compte. La fonction est SECURITY DEFINER : le parent n'a jamais besoin
-- de lire le profil de l'eleve.

alter table profiles add column if not exists link_code text unique;

create or replace function public.gen_link_code()
returns text language sql volatile as $$
  select 'TG-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
$$;

update profiles set link_code = public.gen_link_code()
  where role = 'student' and link_code is null;

-- Les nouveaux eleves recoivent un code a la creation.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested text := new.raw_user_meta_data ->> 'role';
  r user_role := case when requested in ('student','parent')
                      then requested::user_role else 'student'::user_role end;
begin
  insert into public.profiles (id, full_name, phone, role, class_slug, link_code)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.phone, new.raw_user_meta_data ->> 'phone'),
    r,
    new.raw_user_meta_data ->> 'class_slug',
    case when r = 'student' then public.gen_link_code() end
  );
  return new;
end;
$$;

-- Le parent (connecte) relie un eleve via son code.
create or replace function public.link_student_by_code(code text)
returns json language plpgsql security definer set search_path = public as $$
declare
  student profiles%rowtype;
begin
  if public.current_role() <> 'parent' then
    return json_build_object('ok', false, 'error', 'not_parent');
  end if;
  select * into student from profiles
    where link_code = upper(trim(code)) and role = 'student';
  if not found then
    return json_build_object('ok', false, 'error', 'code_invalide');
  end if;
  insert into parent_student_links (parent_id, student_id)
    values (auth.uid(), student.id)
    on conflict do nothing;
  return json_build_object('ok', true, 'student_name', student.full_name);
end;
$$;
