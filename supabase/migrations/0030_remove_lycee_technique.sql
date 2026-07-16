-- 0030 : suppression du lycee technique (plus proposé par Togo Academy).
-- Aucun contenu ni inscription n'y est rattaché (verifie avant suppression).
-- Le college technique (CET) reste inchangé.

delete from classes
where slug in ('seconde-technique', 'premiere-technique', 'terminale-technique');
