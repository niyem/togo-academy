-- 0037 : kits d'examen serie A (Probatoire A + Baccalaureat A).
-- Series litteraires (A) demandees avec le meme jeu de matieres que les kits
-- scientifiques : Maths, Physique, Chimie, SVT, Anglais (toutes existantes).
-- Meme structure que 0035 (methodo / annales / epreuves blanches). Idempotent.
-- Tarifs : Probatoire A (BAC1) 15000, Baccalaureat A (BAC2) 20000.

-- Reordonner le niveau certifications pour grouper A/C/D par examen :
-- CEPD, BEPC, Probatoire A/C/D, BAC A/C/D, TOEFL.
update classes set sort_order = 9 where slug = 'toefl';
update classes set sort_order = 8 where slug = 'bac-d';
update classes set sort_order = 7 where slug = 'bac-c';
update classes set sort_order = 5 where slug = 'probatoire-d';
update classes set sort_order = 4 where slug = 'probatoire-c';

insert into classes (slug, name, level_slug, sort_order, track) values
('probatoire-a', 'Probatoire A', 'certifications', 3, 'general'),
('bac-a', 'Baccalauréat A', 'certifications', 6, 'general')
on conflict (slug) do update set sort_order = excluded.sort_order;

insert into plans (slug, name, price_xof, cadence, scope) values
('probatoire-a-annuel', 'Préparation Probatoire A', 15000, 'annual', 'class'),
('bac-a-annuel', 'Préparation Baccalauréat A', 20000, 'annual', 'class')
on conflict (slug) do update set name=excluded.name, price_xof=excluded.price_xof, cadence=excluded.cadence, scope=excluded.scope, is_active=true;

insert into chapters (slug, title, class_slug, subject_key, sort_order) values
('probatoire-a-mathematiques-1', 'Méthodologie de l''épreuve', 'probatoire-a', 'mathematiques', 1),
('probatoire-a-mathematiques-2', 'Annales corrigées', 'probatoire-a', 'mathematiques', 2),
('probatoire-a-mathematiques-3', 'Épreuves blanches', 'probatoire-a', 'mathematiques', 3),
('probatoire-a-physique-1', 'Méthodologie de l''épreuve', 'probatoire-a', 'physique', 1),
('probatoire-a-physique-2', 'Annales corrigées', 'probatoire-a', 'physique', 2),
('probatoire-a-physique-3', 'Épreuves blanches', 'probatoire-a', 'physique', 3),
('probatoire-a-chimie-1', 'Méthodologie de l''épreuve', 'probatoire-a', 'chimie', 1),
('probatoire-a-chimie-2', 'Annales corrigées', 'probatoire-a', 'chimie', 2),
('probatoire-a-chimie-3', 'Épreuves blanches', 'probatoire-a', 'chimie', 3),
('probatoire-a-svt-1', 'Méthodologie de l''épreuve', 'probatoire-a', 'svt', 1),
('probatoire-a-svt-2', 'Annales corrigées', 'probatoire-a', 'svt', 2),
('probatoire-a-svt-3', 'Épreuves blanches', 'probatoire-a', 'svt', 3),
('probatoire-a-anglais-1', 'Méthodologie de l''épreuve', 'probatoire-a', 'anglais', 1),
('probatoire-a-anglais-2', 'Annales corrigées', 'probatoire-a', 'anglais', 2),
('probatoire-a-anglais-3', 'Épreuves blanches', 'probatoire-a', 'anglais', 3),
('bac-a-mathematiques-1', 'Méthodologie de l''épreuve', 'bac-a', 'mathematiques', 1),
('bac-a-mathematiques-2', 'Annales corrigées', 'bac-a', 'mathematiques', 2),
('bac-a-mathematiques-3', 'Épreuves blanches', 'bac-a', 'mathematiques', 3),
('bac-a-physique-1', 'Méthodologie de l''épreuve', 'bac-a', 'physique', 1),
('bac-a-physique-2', 'Annales corrigées', 'bac-a', 'physique', 2),
('bac-a-physique-3', 'Épreuves blanches', 'bac-a', 'physique', 3),
('bac-a-chimie-1', 'Méthodologie de l''épreuve', 'bac-a', 'chimie', 1),
('bac-a-chimie-2', 'Annales corrigées', 'bac-a', 'chimie', 2),
('bac-a-chimie-3', 'Épreuves blanches', 'bac-a', 'chimie', 3),
('bac-a-svt-1', 'Méthodologie de l''épreuve', 'bac-a', 'svt', 1),
('bac-a-svt-2', 'Annales corrigées', 'bac-a', 'svt', 2),
('bac-a-svt-3', 'Épreuves blanches', 'bac-a', 'svt', 3),
('bac-a-anglais-1', 'Méthodologie de l''épreuve', 'bac-a', 'anglais', 1),
('bac-a-anglais-2', 'Annales corrigées', 'bac-a', 'anglais', 2),
('bac-a-anglais-3', 'Épreuves blanches', 'bac-a', 'anglais', 3)
on conflict (slug) do nothing;

insert into subchapters (slug, title, chapter_id, sort_order)
select v.slug, v.title, c.id, v.sort_order from (values
('probatoire-a-mathematiques-1-s1', 'Réussir l''épreuve', 'probatoire-a-mathematiques-1', 1),
('probatoire-a-mathematiques-2-s1', 'Sujets des sessions passées', 'probatoire-a-mathematiques-2', 1),
('probatoire-a-mathematiques-3-s1', 'En conditions réelles', 'probatoire-a-mathematiques-3', 1),
('probatoire-a-physique-1-s1', 'Réussir l''épreuve', 'probatoire-a-physique-1', 1),
('probatoire-a-physique-2-s1', 'Sujets des sessions passées', 'probatoire-a-physique-2', 1),
('probatoire-a-physique-3-s1', 'En conditions réelles', 'probatoire-a-physique-3', 1),
('probatoire-a-chimie-1-s1', 'Réussir l''épreuve', 'probatoire-a-chimie-1', 1),
('probatoire-a-chimie-2-s1', 'Sujets des sessions passées', 'probatoire-a-chimie-2', 1),
('probatoire-a-chimie-3-s1', 'En conditions réelles', 'probatoire-a-chimie-3', 1),
('probatoire-a-svt-1-s1', 'Réussir l''épreuve', 'probatoire-a-svt-1', 1),
('probatoire-a-svt-2-s1', 'Sujets des sessions passées', 'probatoire-a-svt-2', 1),
('probatoire-a-svt-3-s1', 'En conditions réelles', 'probatoire-a-svt-3', 1),
('probatoire-a-anglais-1-s1', 'Réussir l''épreuve', 'probatoire-a-anglais-1', 1),
('probatoire-a-anglais-2-s1', 'Sujets des sessions passées', 'probatoire-a-anglais-2', 1),
('probatoire-a-anglais-3-s1', 'En conditions réelles', 'probatoire-a-anglais-3', 1),
('bac-a-mathematiques-1-s1', 'Réussir l''épreuve', 'bac-a-mathematiques-1', 1),
('bac-a-mathematiques-2-s1', 'Sujets des sessions passées', 'bac-a-mathematiques-2', 1),
('bac-a-mathematiques-3-s1', 'En conditions réelles', 'bac-a-mathematiques-3', 1),
('bac-a-physique-1-s1', 'Réussir l''épreuve', 'bac-a-physique-1', 1),
('bac-a-physique-2-s1', 'Sujets des sessions passées', 'bac-a-physique-2', 1),
('bac-a-physique-3-s1', 'En conditions réelles', 'bac-a-physique-3', 1),
('bac-a-chimie-1-s1', 'Réussir l''épreuve', 'bac-a-chimie-1', 1),
('bac-a-chimie-2-s1', 'Sujets des sessions passées', 'bac-a-chimie-2', 1),
('bac-a-chimie-3-s1', 'En conditions réelles', 'bac-a-chimie-3', 1),
('bac-a-svt-1-s1', 'Réussir l''épreuve', 'bac-a-svt-1', 1),
('bac-a-svt-2-s1', 'Sujets des sessions passées', 'bac-a-svt-2', 1),
('bac-a-svt-3-s1', 'En conditions réelles', 'bac-a-svt-3', 1),
('bac-a-anglais-1-s1', 'Réussir l''épreuve', 'bac-a-anglais-1', 1),
('bac-a-anglais-2-s1', 'Sujets des sessions passées', 'bac-a-anglais-2', 1),
('bac-a-anglais-3-s1', 'En conditions réelles', 'bac-a-anglais-3', 1)
) as v(slug,title,chapter_slug,sort_order)
join chapters c on c.slug=v.chapter_slug
on conflict (slug) do nothing;

insert into lessons (slug, title, summary, chapter_id, subchapter_id, sort_order, status, is_free_preview)
select v.slug, v.title, v.summary, c.id, sc.id, v.sort_order, 'draft', false from (values
('probatoire-a-mathematiques-1-l1', 'Format et barème de l''épreuve', 'Comprendre la structure, la notation et les attentes.', 'probatoire-a-mathematiques-1', 'probatoire-a-mathematiques-1-s1', 1),
('probatoire-a-mathematiques-1-l2', 'Gérer son temps le jour J', 'Répartir le temps entre les exercices efficacement.', 'probatoire-a-mathematiques-1', 'probatoire-a-mathematiques-1-s1', 2),
('probatoire-a-mathematiques-1-l3', 'Rédaction et présentation', 'Rédiger clairement pour gagner tous ses points.', 'probatoire-a-mathematiques-1', 'probatoire-a-mathematiques-1-s1', 3),
('probatoire-a-mathematiques-1-l4', 'Pièges fréquents à éviter', 'Les erreurs classiques qui coûtent des points.', 'probatoire-a-mathematiques-1', 'probatoire-a-mathematiques-1-s1', 4),
('probatoire-a-mathematiques-2-l1', 'Sujet corrigé (session 1)', 'Résolution détaillée pas à pas d''un sujet d''examen.', 'probatoire-a-mathematiques-2', 'probatoire-a-mathematiques-2-s1', 1),
('probatoire-a-mathematiques-2-l2', 'Sujet corrigé (session 2)', 'Résolution détaillée d''un autre sujet d''examen.', 'probatoire-a-mathematiques-2', 'probatoire-a-mathematiques-2-s1', 2),
('probatoire-a-mathematiques-2-l3', 'Sujet corrigé (session 3)', 'Résolution détaillée d''un troisième sujet.', 'probatoire-a-mathematiques-2', 'probatoire-a-mathematiques-2-s1', 3),
('probatoire-a-mathematiques-3-l1', 'Épreuve blanche 1', 'Composer en temps limité, puis se corriger.', 'probatoire-a-mathematiques-3', 'probatoire-a-mathematiques-3-s1', 1),
('probatoire-a-mathematiques-3-l2', 'Épreuve blanche 2', 'Deuxième épreuve blanche chronométrée.', 'probatoire-a-mathematiques-3', 'probatoire-a-mathematiques-3-s1', 2),
('probatoire-a-physique-1-l1', 'Format et barème de l''épreuve', 'Comprendre la structure, la notation et les attentes.', 'probatoire-a-physique-1', 'probatoire-a-physique-1-s1', 1),
('probatoire-a-physique-1-l2', 'Gérer son temps le jour J', 'Répartir le temps entre les exercices efficacement.', 'probatoire-a-physique-1', 'probatoire-a-physique-1-s1', 2),
('probatoire-a-physique-1-l3', 'Rédaction et présentation', 'Rédiger clairement pour gagner tous ses points.', 'probatoire-a-physique-1', 'probatoire-a-physique-1-s1', 3),
('probatoire-a-physique-1-l4', 'Pièges fréquents à éviter', 'Les erreurs classiques qui coûtent des points.', 'probatoire-a-physique-1', 'probatoire-a-physique-1-s1', 4),
('probatoire-a-physique-2-l1', 'Sujet corrigé (session 1)', 'Résolution détaillée pas à pas d''un sujet d''examen.', 'probatoire-a-physique-2', 'probatoire-a-physique-2-s1', 1),
('probatoire-a-physique-2-l2', 'Sujet corrigé (session 2)', 'Résolution détaillée d''un autre sujet d''examen.', 'probatoire-a-physique-2', 'probatoire-a-physique-2-s1', 2),
('probatoire-a-physique-2-l3', 'Sujet corrigé (session 3)', 'Résolution détaillée d''un troisième sujet.', 'probatoire-a-physique-2', 'probatoire-a-physique-2-s1', 3),
('probatoire-a-physique-3-l1', 'Épreuve blanche 1', 'Composer en temps limité, puis se corriger.', 'probatoire-a-physique-3', 'probatoire-a-physique-3-s1', 1),
('probatoire-a-physique-3-l2', 'Épreuve blanche 2', 'Deuxième épreuve blanche chronométrée.', 'probatoire-a-physique-3', 'probatoire-a-physique-3-s1', 2),
('probatoire-a-chimie-1-l1', 'Format et barème de l''épreuve', 'Comprendre la structure, la notation et les attentes.', 'probatoire-a-chimie-1', 'probatoire-a-chimie-1-s1', 1),
('probatoire-a-chimie-1-l2', 'Gérer son temps le jour J', 'Répartir le temps entre les exercices efficacement.', 'probatoire-a-chimie-1', 'probatoire-a-chimie-1-s1', 2),
('probatoire-a-chimie-1-l3', 'Rédaction et présentation', 'Rédiger clairement pour gagner tous ses points.', 'probatoire-a-chimie-1', 'probatoire-a-chimie-1-s1', 3),
('probatoire-a-chimie-1-l4', 'Pièges fréquents à éviter', 'Les erreurs classiques qui coûtent des points.', 'probatoire-a-chimie-1', 'probatoire-a-chimie-1-s1', 4),
('probatoire-a-chimie-2-l1', 'Sujet corrigé (session 1)', 'Résolution détaillée pas à pas d''un sujet d''examen.', 'probatoire-a-chimie-2', 'probatoire-a-chimie-2-s1', 1),
('probatoire-a-chimie-2-l2', 'Sujet corrigé (session 2)', 'Résolution détaillée d''un autre sujet d''examen.', 'probatoire-a-chimie-2', 'probatoire-a-chimie-2-s1', 2),
('probatoire-a-chimie-2-l3', 'Sujet corrigé (session 3)', 'Résolution détaillée d''un troisième sujet.', 'probatoire-a-chimie-2', 'probatoire-a-chimie-2-s1', 3),
('probatoire-a-chimie-3-l1', 'Épreuve blanche 1', 'Composer en temps limité, puis se corriger.', 'probatoire-a-chimie-3', 'probatoire-a-chimie-3-s1', 1),
('probatoire-a-chimie-3-l2', 'Épreuve blanche 2', 'Deuxième épreuve blanche chronométrée.', 'probatoire-a-chimie-3', 'probatoire-a-chimie-3-s1', 2),
('probatoire-a-svt-1-l1', 'Format et barème de l''épreuve', 'Comprendre la structure, la notation et les attentes.', 'probatoire-a-svt-1', 'probatoire-a-svt-1-s1', 1),
('probatoire-a-svt-1-l2', 'Gérer son temps le jour J', 'Répartir le temps entre les exercices efficacement.', 'probatoire-a-svt-1', 'probatoire-a-svt-1-s1', 2),
('probatoire-a-svt-1-l3', 'Rédaction et présentation', 'Rédiger clairement pour gagner tous ses points.', 'probatoire-a-svt-1', 'probatoire-a-svt-1-s1', 3),
('probatoire-a-svt-1-l4', 'Pièges fréquents à éviter', 'Les erreurs classiques qui coûtent des points.', 'probatoire-a-svt-1', 'probatoire-a-svt-1-s1', 4),
('probatoire-a-svt-2-l1', 'Sujet corrigé (session 1)', 'Résolution détaillée pas à pas d''un sujet d''examen.', 'probatoire-a-svt-2', 'probatoire-a-svt-2-s1', 1),
('probatoire-a-svt-2-l2', 'Sujet corrigé (session 2)', 'Résolution détaillée d''un autre sujet d''examen.', 'probatoire-a-svt-2', 'probatoire-a-svt-2-s1', 2),
('probatoire-a-svt-2-l3', 'Sujet corrigé (session 3)', 'Résolution détaillée d''un troisième sujet.', 'probatoire-a-svt-2', 'probatoire-a-svt-2-s1', 3),
('probatoire-a-svt-3-l1', 'Épreuve blanche 1', 'Composer en temps limité, puis se corriger.', 'probatoire-a-svt-3', 'probatoire-a-svt-3-s1', 1),
('probatoire-a-svt-3-l2', 'Épreuve blanche 2', 'Deuxième épreuve blanche chronométrée.', 'probatoire-a-svt-3', 'probatoire-a-svt-3-s1', 2),
('probatoire-a-anglais-1-l1', 'Format et barème de l''épreuve', 'Comprendre la structure, la notation et les attentes.', 'probatoire-a-anglais-1', 'probatoire-a-anglais-1-s1', 1),
('probatoire-a-anglais-1-l2', 'Gérer son temps le jour J', 'Répartir le temps entre les exercices efficacement.', 'probatoire-a-anglais-1', 'probatoire-a-anglais-1-s1', 2),
('probatoire-a-anglais-1-l3', 'Rédaction et présentation', 'Rédiger clairement pour gagner tous ses points.', 'probatoire-a-anglais-1', 'probatoire-a-anglais-1-s1', 3),
('probatoire-a-anglais-1-l4', 'Pièges fréquents à éviter', 'Les erreurs classiques qui coûtent des points.', 'probatoire-a-anglais-1', 'probatoire-a-anglais-1-s1', 4),
('probatoire-a-anglais-2-l1', 'Sujet corrigé (session 1)', 'Résolution détaillée pas à pas d''un sujet d''examen.', 'probatoire-a-anglais-2', 'probatoire-a-anglais-2-s1', 1),
('probatoire-a-anglais-2-l2', 'Sujet corrigé (session 2)', 'Résolution détaillée d''un autre sujet d''examen.', 'probatoire-a-anglais-2', 'probatoire-a-anglais-2-s1', 2),
('probatoire-a-anglais-2-l3', 'Sujet corrigé (session 3)', 'Résolution détaillée d''un troisième sujet.', 'probatoire-a-anglais-2', 'probatoire-a-anglais-2-s1', 3),
('probatoire-a-anglais-3-l1', 'Épreuve blanche 1', 'Composer en temps limité, puis se corriger.', 'probatoire-a-anglais-3', 'probatoire-a-anglais-3-s1', 1),
('probatoire-a-anglais-3-l2', 'Épreuve blanche 2', 'Deuxième épreuve blanche chronométrée.', 'probatoire-a-anglais-3', 'probatoire-a-anglais-3-s1', 2),
('bac-a-mathematiques-1-l1', 'Format et barème de l''épreuve', 'Comprendre la structure, la notation et les attentes.', 'bac-a-mathematiques-1', 'bac-a-mathematiques-1-s1', 1),
('bac-a-mathematiques-1-l2', 'Gérer son temps le jour J', 'Répartir le temps entre les exercices efficacement.', 'bac-a-mathematiques-1', 'bac-a-mathematiques-1-s1', 2),
('bac-a-mathematiques-1-l3', 'Rédaction et présentation', 'Rédiger clairement pour gagner tous ses points.', 'bac-a-mathematiques-1', 'bac-a-mathematiques-1-s1', 3),
('bac-a-mathematiques-1-l4', 'Pièges fréquents à éviter', 'Les erreurs classiques qui coûtent des points.', 'bac-a-mathematiques-1', 'bac-a-mathematiques-1-s1', 4),
('bac-a-mathematiques-2-l1', 'Sujet corrigé (session 1)', 'Résolution détaillée pas à pas d''un sujet d''examen.', 'bac-a-mathematiques-2', 'bac-a-mathematiques-2-s1', 1),
('bac-a-mathematiques-2-l2', 'Sujet corrigé (session 2)', 'Résolution détaillée d''un autre sujet d''examen.', 'bac-a-mathematiques-2', 'bac-a-mathematiques-2-s1', 2),
('bac-a-mathematiques-2-l3', 'Sujet corrigé (session 3)', 'Résolution détaillée d''un troisième sujet.', 'bac-a-mathematiques-2', 'bac-a-mathematiques-2-s1', 3),
('bac-a-mathematiques-3-l1', 'Épreuve blanche 1', 'Composer en temps limité, puis se corriger.', 'bac-a-mathematiques-3', 'bac-a-mathematiques-3-s1', 1),
('bac-a-mathematiques-3-l2', 'Épreuve blanche 2', 'Deuxième épreuve blanche chronométrée.', 'bac-a-mathematiques-3', 'bac-a-mathematiques-3-s1', 2),
('bac-a-physique-1-l1', 'Format et barème de l''épreuve', 'Comprendre la structure, la notation et les attentes.', 'bac-a-physique-1', 'bac-a-physique-1-s1', 1),
('bac-a-physique-1-l2', 'Gérer son temps le jour J', 'Répartir le temps entre les exercices efficacement.', 'bac-a-physique-1', 'bac-a-physique-1-s1', 2),
('bac-a-physique-1-l3', 'Rédaction et présentation', 'Rédiger clairement pour gagner tous ses points.', 'bac-a-physique-1', 'bac-a-physique-1-s1', 3),
('bac-a-physique-1-l4', 'Pièges fréquents à éviter', 'Les erreurs classiques qui coûtent des points.', 'bac-a-physique-1', 'bac-a-physique-1-s1', 4),
('bac-a-physique-2-l1', 'Sujet corrigé (session 1)', 'Résolution détaillée pas à pas d''un sujet d''examen.', 'bac-a-physique-2', 'bac-a-physique-2-s1', 1),
('bac-a-physique-2-l2', 'Sujet corrigé (session 2)', 'Résolution détaillée d''un autre sujet d''examen.', 'bac-a-physique-2', 'bac-a-physique-2-s1', 2),
('bac-a-physique-2-l3', 'Sujet corrigé (session 3)', 'Résolution détaillée d''un troisième sujet.', 'bac-a-physique-2', 'bac-a-physique-2-s1', 3),
('bac-a-physique-3-l1', 'Épreuve blanche 1', 'Composer en temps limité, puis se corriger.', 'bac-a-physique-3', 'bac-a-physique-3-s1', 1),
('bac-a-physique-3-l2', 'Épreuve blanche 2', 'Deuxième épreuve blanche chronométrée.', 'bac-a-physique-3', 'bac-a-physique-3-s1', 2),
('bac-a-chimie-1-l1', 'Format et barème de l''épreuve', 'Comprendre la structure, la notation et les attentes.', 'bac-a-chimie-1', 'bac-a-chimie-1-s1', 1),
('bac-a-chimie-1-l2', 'Gérer son temps le jour J', 'Répartir le temps entre les exercices efficacement.', 'bac-a-chimie-1', 'bac-a-chimie-1-s1', 2),
('bac-a-chimie-1-l3', 'Rédaction et présentation', 'Rédiger clairement pour gagner tous ses points.', 'bac-a-chimie-1', 'bac-a-chimie-1-s1', 3),
('bac-a-chimie-1-l4', 'Pièges fréquents à éviter', 'Les erreurs classiques qui coûtent des points.', 'bac-a-chimie-1', 'bac-a-chimie-1-s1', 4),
('bac-a-chimie-2-l1', 'Sujet corrigé (session 1)', 'Résolution détaillée pas à pas d''un sujet d''examen.', 'bac-a-chimie-2', 'bac-a-chimie-2-s1', 1),
('bac-a-chimie-2-l2', 'Sujet corrigé (session 2)', 'Résolution détaillée d''un autre sujet d''examen.', 'bac-a-chimie-2', 'bac-a-chimie-2-s1', 2),
('bac-a-chimie-2-l3', 'Sujet corrigé (session 3)', 'Résolution détaillée d''un troisième sujet.', 'bac-a-chimie-2', 'bac-a-chimie-2-s1', 3),
('bac-a-chimie-3-l1', 'Épreuve blanche 1', 'Composer en temps limité, puis se corriger.', 'bac-a-chimie-3', 'bac-a-chimie-3-s1', 1),
('bac-a-chimie-3-l2', 'Épreuve blanche 2', 'Deuxième épreuve blanche chronométrée.', 'bac-a-chimie-3', 'bac-a-chimie-3-s1', 2),
('bac-a-svt-1-l1', 'Format et barème de l''épreuve', 'Comprendre la structure, la notation et les attentes.', 'bac-a-svt-1', 'bac-a-svt-1-s1', 1),
('bac-a-svt-1-l2', 'Gérer son temps le jour J', 'Répartir le temps entre les exercices efficacement.', 'bac-a-svt-1', 'bac-a-svt-1-s1', 2),
('bac-a-svt-1-l3', 'Rédaction et présentation', 'Rédiger clairement pour gagner tous ses points.', 'bac-a-svt-1', 'bac-a-svt-1-s1', 3),
('bac-a-svt-1-l4', 'Pièges fréquents à éviter', 'Les erreurs classiques qui coûtent des points.', 'bac-a-svt-1', 'bac-a-svt-1-s1', 4),
('bac-a-svt-2-l1', 'Sujet corrigé (session 1)', 'Résolution détaillée pas à pas d''un sujet d''examen.', 'bac-a-svt-2', 'bac-a-svt-2-s1', 1),
('bac-a-svt-2-l2', 'Sujet corrigé (session 2)', 'Résolution détaillée d''un autre sujet d''examen.', 'bac-a-svt-2', 'bac-a-svt-2-s1', 2),
('bac-a-svt-2-l3', 'Sujet corrigé (session 3)', 'Résolution détaillée d''un troisième sujet.', 'bac-a-svt-2', 'bac-a-svt-2-s1', 3),
('bac-a-svt-3-l1', 'Épreuve blanche 1', 'Composer en temps limité, puis se corriger.', 'bac-a-svt-3', 'bac-a-svt-3-s1', 1),
('bac-a-svt-3-l2', 'Épreuve blanche 2', 'Deuxième épreuve blanche chronométrée.', 'bac-a-svt-3', 'bac-a-svt-3-s1', 2),
('bac-a-anglais-1-l1', 'Format et barème de l''épreuve', 'Comprendre la structure, la notation et les attentes.', 'bac-a-anglais-1', 'bac-a-anglais-1-s1', 1),
('bac-a-anglais-1-l2', 'Gérer son temps le jour J', 'Répartir le temps entre les exercices efficacement.', 'bac-a-anglais-1', 'bac-a-anglais-1-s1', 2),
('bac-a-anglais-1-l3', 'Rédaction et présentation', 'Rédiger clairement pour gagner tous ses points.', 'bac-a-anglais-1', 'bac-a-anglais-1-s1', 3),
('bac-a-anglais-1-l4', 'Pièges fréquents à éviter', 'Les erreurs classiques qui coûtent des points.', 'bac-a-anglais-1', 'bac-a-anglais-1-s1', 4),
('bac-a-anglais-2-l1', 'Sujet corrigé (session 1)', 'Résolution détaillée pas à pas d''un sujet d''examen.', 'bac-a-anglais-2', 'bac-a-anglais-2-s1', 1),
('bac-a-anglais-2-l2', 'Sujet corrigé (session 2)', 'Résolution détaillée d''un autre sujet d''examen.', 'bac-a-anglais-2', 'bac-a-anglais-2-s1', 2),
('bac-a-anglais-2-l3', 'Sujet corrigé (session 3)', 'Résolution détaillée d''un troisième sujet.', 'bac-a-anglais-2', 'bac-a-anglais-2-s1', 3),
('bac-a-anglais-3-l1', 'Épreuve blanche 1', 'Composer en temps limité, puis se corriger.', 'bac-a-anglais-3', 'bac-a-anglais-3-s1', 1),
('bac-a-anglais-3-l2', 'Épreuve blanche 2', 'Deuxième épreuve blanche chronométrée.', 'bac-a-anglais-3', 'bac-a-anglais-3-s1', 2)
) as v(slug,title,summary,chapter_slug,subchapter_slug,sort_order)
join chapters c on c.slug=v.chapter_slug
join subchapters sc on sc.slug=v.subchapter_slug
on conflict (slug) do nothing;

insert into activities (lesson_id, type, title, video_provider, sort_order)
select l.id, 'video', 'Vidéo (à venir)', 'placeholder', 0
from lessons l join chapters c on c.id=l.chapter_id
where c.class_slug in ('probatoire-a','bac-a')
and not exists (select 1 from activities a where a.lesson_id=l.id and a.type='video');
