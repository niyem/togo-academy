-- 0033 : primaire gratuit + formule TOEFL (annuelle, bon marché).
-- Le primaire (contenus surtout sur YouTube) est entierement gratuit : ses
-- lecons sont marquees is_free_preview (acces sans abonnement).
update lessons set is_free_preview = true
where chapter_id in (
  select id from chapters
  where class_slug in ('cp1', 'cp2', 'ce1', 'ce2', 'cm1', 'cm2')
);

-- Formule dediee TOEFL : uniquement annuelle, prix bas, perimetre = classe
-- 'toefl'. Prix indicatif 5 000 FCFA/an (ajustable par Niyem).
insert into plans (slug, name, price_xof, cadence, scope)
values ('toefl-annuel', 'Préparation TOEFL', 5000, 'annual', 'class')
on conflict (slug) do update
  set name = excluded.name, price_xof = excluded.price_xof,
      cadence = excluded.cadence, scope = excluded.scope, is_active = true;
