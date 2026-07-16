-- 0031 : suppression du collège technique (CET), comme le lycée technique (0030).
-- Togo Academy ne propose plus l'enseignement technique. Aucun contenu rattaché.
-- Total classes : 21 -> 18 (24 au départ, moins les 6 classes techniques).

delete from classes where slug in ('cet1', 'cet2', 'cet3');
