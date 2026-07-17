-- 0036 : les kits d'examen deviennent des options payantes a part.
--   - nouveaux tarifs annuels par examen (CEPD 8000, BEPC 10000,
--     Probatoire/BAC1 15000, BAC/BAC2 20000) ; TOEFL reste a 8000 ;
--   - l'abonnement annuel plateforme ne debloque plus automatiquement les
--     kits d'examen (niveau "certifications"). Il donne droit a UN kit a
--     moitie prix (remise appliquee cote application au moment du paiement).

-- Tarifs annuels par examen.
update plans set price_xof = 10000 where slug = 'bepc-annuel';
update plans set price_xof = 15000 where slug in ('probatoire-c-annuel', 'probatoire-d-annuel');
update plans set price_xof = 20000 where slug in ('bac-c-annuel', 'bac-d-annuel');
-- cepd-annuel et toefl-annuel restent a 8000 (inchanges).

-- Acces a une lecon : la portee "plateforme" couvre desormais toutes les
-- classes SAUF les kits d'examen (niveau "certifications"), qui restent des
-- options payantes debloquees uniquement par leur propre abonnement (portee
-- "class" avec class_slug = la classe du kit).
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
        (
          p.scope = 'platform'
          and not exists (
            select 1 from classes c
            where c.slug = p_class and c.level_slug = 'certifications'
          )
        )
        or (p.scope = 'class'   and s.class_slug = p_class)
        or (p.scope = 'subject' and s.class_slug = p_class
                                 and s.subject_key = p_subject)
      )
  );
$$;
