-- 0051 : fusionne Physique + Chimie en une seule matiere « Sciences physiques »
-- (lycee), tout en conservant les sigles PHY et CHI dans le titre de chaque
-- chapitre (ex. « PHY 3 · … », « CHI 2 · … »). Le college garde sa matiere
-- distincte 'spt' (Sciences physiques - SPT). Idempotent.

-- 1) La matiere 'physique' devient « Sciences physiques ». On garde la cle
--    technique 'physique' pour ne casser aucune reference.
update subjects
  set name = 'Sciences physiques',
      icon = '⚗️',
      description = 'Physique et chimie au lycée.'
  where key = 'physique';

-- 2) Tous les chapitres de 'chimie' sont rattaches a 'physique'. Le titre
--    (donc le sigle PHY/CHI) est inchange. On decale le sort_order des
--    chapitres de chimie de +100 pour qu'ils s'affichent APRES la physique
--    dans chaque classe. Idempotent : apres coup plus aucun chapitre 'chimie'.
update chapters
  set subject_key = 'physique',
      sort_order = sort_order + 100
  where subject_key = 'chimie';

-- 3) Ce qui pointait sur 'chimie' (abonnements par matiere, matieres choisies
--    par les candidats tuteurs/concepteurs) pointe desormais sur 'physique'.
update plans set scope_ref = 'physique'
  where scope = 'subject' and scope_ref = 'chimie';

update tutor_profiles
  set subject_keys = (
    select coalesce(array_agg(distinct k), '{}')
    from unnest(array_replace(subject_keys, 'chimie', 'physique')) as k
  )
  where 'chimie' = any(subject_keys);

update collab_applications
  set subject_keys = (
    select coalesce(array_agg(distinct k), '{}')
    from unnest(array_replace(subject_keys, 'chimie', 'physique')) as k
  )
  where 'chimie' = any(subject_keys);

-- 4) Suppression de la matiere 'chimie' (plus aucun chapitre ne la reference,
--    donc le « on delete restrict » du FK est satisfait).
delete from subjects where key = 'chimie';
