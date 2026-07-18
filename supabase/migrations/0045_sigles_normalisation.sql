-- 0045 : sigles uniformes pour toutes les matieres (sauf Anglais, non touche,
-- et Technologie qui garde son format "T1"). Numerotation par sort_order.
-- Idempotent : on retire un eventuel sigle existant puis on (re)pose le bon.

-- Mathematiques -> MAT N
update chapters set title = 'MAT ' || sort_order || ' · ' ||
  regexp_replace(title, '^[[:alpha:]]{1,6}[[:space:]]*[0-9]+[[:space:]]*·[[:space:]]*', '')
  where subject_key = 'mathematiques';

-- Physique -> PHY N
update chapters set title = 'PHY ' || sort_order || ' · ' ||
  regexp_replace(title, '^[[:alpha:]]{1,6}[[:space:]]*[0-9]+[[:space:]]*·[[:space:]]*', '')
  where subject_key = 'physique';

-- Chimie -> CHI N
update chapters set title = 'CHI ' || sort_order || ' · ' ||
  regexp_replace(title, '^[[:alpha:]]{1,6}[[:space:]]*[0-9]+[[:space:]]*·[[:space:]]*', '')
  where subject_key = 'chimie';

-- Sciences physiques (college) -> SP N
update chapters set title = 'SP ' || sort_order || ' · ' ||
  regexp_replace(title, '^[[:alpha:]]{1,6}[[:space:]]*[0-9]+[[:space:]]*·[[:space:]]*', '')
  where subject_key = 'spt';
