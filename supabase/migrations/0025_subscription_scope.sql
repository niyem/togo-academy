-- 0025 : perimetre d'abonnement reellement applique.
-- Jusqu'ici tout abonnement actif debloquait toute la plateforme (le champ
-- plans.scope n'etait pas verifie). Desormais :
--   - platform (annuel)  -> toutes les classes ;
--   - class    (mensuel, trimestriel) -> une classe (toutes matieres) ;
--   - subject  (hebdo)   -> une matiere d'une classe.
-- L'abonnement porte donc une cible (class_slug, subject_key).

alter table subscriptions
  add column if not exists class_slug  text,
  add column if not exists subject_key text;

-- Nouvelle repartition des perimetres (voir seed.ts pour l'affichage FR).
update plans set scope = 'subject'  where slug = 'hebdo-classe';
update plans set scope = 'class'    where slug = 'mensuel-classe';
update plans set scope = 'class'    where slug = 'trimestriel-plateforme';
update plans set scope = 'platform' where slug = 'annuel-plateforme';

-- Acces a une lecon donnee (classe + matiere) selon les abonnements actifs.
-- platform couvre tout ; class couvre sa classe ; subject couvre sa (classe,matiere).
create or replace function public.has_lesson_access(
  uid uuid, p_class text, p_subject text
)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from subscriptions s
    join plans p on p.slug = s.plan_slug
    where s.user_id = uid
      and s.status = 'active'
      and (s.period_end is null or s.period_end >= current_date)
      and (
        p.scope = 'platform'
        or (p.scope = 'class'   and s.class_slug = p_class)
        or (p.scope = 'subject' and s.class_slug = p_class
                                 and s.subject_key = p_subject)
      )
  );
$$;
