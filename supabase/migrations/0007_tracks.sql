-- 0007 : filieres du systeme togolais apres le CEPD.
-- Enseignement general vs enseignement technique (CET au college,
-- lycees techniques). Les series (F1, G2, A4, D...) viendront comme
-- precision des classes quand les programmes seront fournis.

alter table classes add column if not exists track text not null
  default 'general' check (track in ('general', 'technique'));

-- College technique (CET, filiere CAP)
insert into classes (slug, name, level_slug, sort_order, track) values
  ('cet1', '1ère année CET', 'college', 11, 'technique'),
  ('cet2', '2ème année CET', 'college', 12, 'technique'),
  ('cet3', '3ème année CET', 'college', 13, 'technique')
on conflict (slug) do nothing;

-- Lycee technique (series precisees plus tard : F, G, E, Ti...)
insert into classes (slug, name, level_slug, sort_order, track) values
  ('seconde-technique', 'Seconde technique', 'lycee', 11, 'technique'),
  ('premiere-technique', 'Première technique', 'lycee', 12, 'technique'),
  ('terminale-technique', 'Terminale technique', 'lycee', 13, 'technique')
on conflict (slug) do nothing;
