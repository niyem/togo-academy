-- 0046 : suppression de la matiere "Informatique" (orpheline, 0 chapitre).
-- Le contenu informatique/Python vit sous "Technologie". Aucun chapitre ne
-- reference cette cle, la suppression est sans effet de bord.
delete from subjects where key = 'informatique';
