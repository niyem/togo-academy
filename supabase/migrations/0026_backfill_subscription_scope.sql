-- 0026 : retro-remplissage du perimetre des abonnements existants.
-- Avant 0025, les abonnements ne portaient pas de cible. Les abonnements
-- actifs a perimetre 'classe' ou 'matiere' sans class_slug ne debloqueraient
-- plus rien : on les rattache a la classe du profil de l'eleve.
-- Les abonnements 'platform' ignorent la cible (rien a faire).

update subscriptions s
set class_slug = p.class_slug
from profiles p
where s.user_id = p.id
  and s.class_slug is null
  and p.class_slug is not null
  and s.plan_slug in (select slug from plans where scope in ('class', 'subject'));
