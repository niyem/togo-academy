-- 0049 : Phase 4 - suivi des paiements aux contributeurs.
-- Un paiement = (module, beneficiaire, role). Le montant du est calcule par le
-- bareme (ou le prix negocie) cote application ; cette table enregistre ce qui
-- a ete PAYE. L'admin gere ; chaque contributeur voit ses propres paiements.

create table collab_payments (
  chapter_id uuid not null references chapters (id) on delete cascade,
  payee_id   uuid not null references profiles (id) on delete cascade,
  role       text not null check (role in ('concepteur', 'inspecteur')),
  amount_xof int  not null,
  paid_at    timestamptz not null default now(),
  note       text,
  primary key (chapter_id, payee_id, role)
);

alter table collab_payments enable row level security;
create policy "admin manages payments" on collab_payments
  for all using (public.is_admin()) with check (public.is_admin());
create policy "payee reads own payments" on collab_payments
  for select using (payee_id = auth.uid());
