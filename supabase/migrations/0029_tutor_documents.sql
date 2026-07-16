-- 0029 : documents de candidature tuteur (CV + justificatif d'emploi).
-- Bucket prive 'tutor-docs' ; acces uniquement via la cle service (upload par
-- l'action de candidature, lecture par l'admin qui signe des URLs). Aucune
-- policy publique : la RLS bloque tout sauf le service role.

alter table tutor_profiles
  add column if not exists cv_path    text,
  add column if not exists proof_path text;

insert into storage.buckets (id, name, public, file_size_limit)
values ('tutor-docs', 'tutor-docs', false, 8388608)  -- 8 Mo max par fichier
on conflict (id) do nothing;
