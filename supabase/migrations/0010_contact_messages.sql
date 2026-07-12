-- Messages du formulaire de contact public (/contact).
-- Tout visiteur (meme anonyme) peut ecrire ; seuls les admins lisent,
-- traitent et suppriment. Coherent avec le modele "verification manuelle"
-- des paiements (l'equipe traite depuis /admin).

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 200),
  phone text check (phone is null or char_length(phone) <= 40),
  topic text not null default 'question'
    check (topic in ('question', 'abonnement', 'tuteur', 'technique', 'partenariat', 'autre')),
  message text not null check (char_length(message) between 10 and 4000),
  -- Renseigne si l'expediteur etait connecte (facilite le suivi).
  user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'nouveau' check (status in ('nouveau', 'traite')),
  handled_at timestamptz
);

alter table public.contact_messages enable row level security;

create policy "contact insert public" on public.contact_messages
  for insert to anon, authenticated
  with check (true);

create policy "contact admin select" on public.contact_messages
  for select to authenticated
  using (public.is_admin());

create policy "contact admin update" on public.contact_messages
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
