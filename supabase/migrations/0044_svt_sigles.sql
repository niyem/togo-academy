-- 0044 : ajoute les sigles "SVT N ·" aux modules de SVT (comme PHY/CHI/MAT/T).
-- Numerotation par sort_order, par classe. Idempotent (ne re-prefixe pas).
update chapters
  set title = 'SVT ' || sort_order || ' · ' || title
  where subject_key = 'svt'
    and title !~ '^SVT[[:space:]]*[0-9]';
