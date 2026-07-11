-- 0004 : souscription cote utilisateur + verification d'acces.
-- Un utilisateur peut creer sa demande d'abonnement (pending) et sa trace de
-- paiement (pending). Seul l'admin passe les statuts a active/confirmed.

-- L'utilisateur cree sa propre demande, toujours en 'pending'.
create policy "owner creates pending subscription" on subscriptions
  for insert with check (user_id = auth.uid() and status = 'pending');

create policy "owner creates pending payment" on payments
  for insert with check (user_id = auth.uid() and status = 'pending');

-- Acces abonne : une souscription active non expiree, pour soi.
create or replace function public.has_active_subscription(uid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from subscriptions
    where user_id = uid
      and status = 'active'
      and (period_end is null or period_end >= current_date)
  );
$$;
