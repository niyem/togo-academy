-- Recherche d'un utilisateur par email pour l'administration (les emails
-- vivent dans auth.users, non expose a PostgREST). Garde is_admin() integree.

create or replace function public.admin_user_id_by_email(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  return (
    select id from auth.users
    where lower(email) = lower(p_email)
    limit 1
  );
end;
$$;

revoke execute on function public.admin_user_id_by_email(text) from public, anon;
grant execute on function public.admin_user_id_by_email(text) to authenticated;
