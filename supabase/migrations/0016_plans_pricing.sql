-- 0016: grille tarifaire complete (hebdomadaire / mensuel / trimestriel / annuel).
-- Prix valides par Niyem le 16 juillet 2026 : 1 000 / 3 000 / 7 500 / 25 000 FCFA.
-- Hebdo + mensuel = une classe; trimestriel + annuel = toute la plateforme.

alter type plan_cadence add value if not exists 'weekly';

update plans set name = 'Mensuel' where slug = 'mensuel-classe';

update plans set name = 'Annuel' where slug = 'annuel-plateforme';

insert into plans (slug, name, price_xof, cadence, scope)
values ('hebdo-classe', 'Hebdomadaire', 1000, 'weekly', 'class')
on conflict (slug) do update
  set name = excluded.name, price_xof = excluded.price_xof,
      cadence = excluded.cadence, scope = excluded.scope, is_active = true;

insert into plans (slug, name, price_xof, cadence, scope)
values ('trimestriel-plateforme', 'Trimestriel', 7500, 'termly', 'platform')
on conflict (slug) do update
  set name = excluded.name, price_xof = excluded.price_xof,
      cadence = excluded.cadence, scope = excluded.scope, is_active = true;
