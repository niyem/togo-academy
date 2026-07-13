-- Restructuration selon le programme officiel (logique de Niyem) :
-- - chapitre = MODULE (PHY 1..4) sanctionne par un QUIZ de module (70 %),
--   format APC, rattache au chapitre ;
-- - EXAMEN FINAL au niveau du cours (classe + matiere), passe apres tous
--   les modules (80 %, politique 4 tentatives / 12 h / paiement) ;
-- - 2 examens finaux en Terminale A : physique et chimie -> 2 certificats.

alter table public.assessments
  add column if not exists class_slug text,
  add column if not exists subject_key text;

alter table public.assessments drop constraint if exists assessment_parent;
alter table public.assessments add constraint assessment_parent check (
  (kind = 'evaluation' and class_slug is null and subject_key is null and (
    (subchapter_id is not null and chapter_id is null) or
    (chapter_id is not null and subchapter_id is null)))
  or
  (kind = 'examen' and (
    (chapter_id is not null and subchapter_id is null and class_slug is null) or
    (chapter_id is null and subchapter_id is null
     and class_slug is not null and subject_key is not null)))
);
