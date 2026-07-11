-- 0009 : seuils de validation (spec Niyem) : 70 % pour une evaluation,
-- 80 % pour un examen final. Non bloquant : l'eleve continue librement,
-- mais la validation est requise pour le certificat de chapitre.

update assessments set pass_percent = 70 where kind = 'evaluation';
update assessments set pass_percent = 80 where kind = 'examen';
alter table assessments alter column pass_percent set default 70;
