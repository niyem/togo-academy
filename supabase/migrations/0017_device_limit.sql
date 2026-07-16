-- 0017: limite d'appareils simultanes par compte (anti-partage d'abonnement).
-- Chaque navigateur recoit un cookie ta_device (UUID). Quand un abonne ouvre
-- une lecon payante, l'appareil est enregistre ici; au-dela de la limite
-- d'appareils actifs dans la fenetre glissante, l'acces est refuse poliment.

create table account_devices (
  user_id    uuid not null references auth.users(id) on delete cascade,
  device_id  uuid not null,
  user_agent text,
  first_seen timestamptz not null default now(),
  last_seen  timestamptz not null default now(),
  primary key (user_id, device_id)
);

create index account_devices_active on account_devices (user_id, last_seen desc);

alter table account_devices enable row level security;

-- L'utilisateur peut voir ses propres appareils (transparence).
-- Toutes les ecritures passent par le service role (serveur uniquement).
create policy account_devices_select_own on account_devices
  for select using (auth.uid() = user_id);
