-- Quotas journaliers d'usage IA (tuteur et chatbot) : protege le credit API.
-- identity : "user:<uuid>" (connecte) ou "ip:<adresse>" (visiteur anonyme).
-- Aucune politique RLS publique : seul le service role (API server-side)
-- lit et ecrit ces compteurs.

create table if not exists public.ai_usage (
  identity text not null,
  day date not null,
  kind text not null check (kind in ('tuteur', 'chat')),
  count integer not null default 0,
  primary key (identity, day, kind)
);

alter table public.ai_usage enable row level security;

-- Incremente le compteur du jour et dit si l'appel est encore autorise.
-- Atomique (upsert) : pas de course entre deux requetes simultanees.
create or replace function public.consume_ai_quota(
  p_identity text,
  p_kind text,
  p_limit integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into ai_usage (identity, day, kind, count)
  values (p_identity, current_date, p_kind, 1)
  on conflict (identity, day, kind)
  do update set count = ai_usage.count + 1
  returning count into new_count;
  return new_count <= p_limit;
end;
$$;

revoke execute on function public.consume_ai_quota(text, text, integer)
  from public, anon, authenticated;
