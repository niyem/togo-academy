-- 0038 : ajouter l'Anglais aux kits d'examen ou il est epreuve officielle
-- (BEPC, Probatoire C/D, Baccalaureat C/D). Le CEPD (primaire) n'a pas
-- d'epreuve d'anglais. Serie A a deja l'anglais (0037). Meme structure que
-- 0035/0037. Idempotent.

insert into chapters (slug, title, class_slug, subject_key, sort_order) values
('bepc-anglais-1', 'Méthodologie de l''épreuve', 'bepc', 'anglais', 1),
('bepc-anglais-2', 'Annales corrigées', 'bepc', 'anglais', 2),
('bepc-anglais-3', 'Épreuves blanches', 'bepc', 'anglais', 3),
('probatoire-c-anglais-1', 'Méthodologie de l''épreuve', 'probatoire-c', 'anglais', 1),
('probatoire-c-anglais-2', 'Annales corrigées', 'probatoire-c', 'anglais', 2),
('probatoire-c-anglais-3', 'Épreuves blanches', 'probatoire-c', 'anglais', 3),
('probatoire-d-anglais-1', 'Méthodologie de l''épreuve', 'probatoire-d', 'anglais', 1),
('probatoire-d-anglais-2', 'Annales corrigées', 'probatoire-d', 'anglais', 2),
('probatoire-d-anglais-3', 'Épreuves blanches', 'probatoire-d', 'anglais', 3),
('bac-c-anglais-1', 'Méthodologie de l''épreuve', 'bac-c', 'anglais', 1),
('bac-c-anglais-2', 'Annales corrigées', 'bac-c', 'anglais', 2),
('bac-c-anglais-3', 'Épreuves blanches', 'bac-c', 'anglais', 3),
('bac-d-anglais-1', 'Méthodologie de l''épreuve', 'bac-d', 'anglais', 1),
('bac-d-anglais-2', 'Annales corrigées', 'bac-d', 'anglais', 2),
('bac-d-anglais-3', 'Épreuves blanches', 'bac-d', 'anglais', 3)
on conflict (slug) do nothing;

insert into subchapters (slug, title, chapter_id, sort_order)
select v.slug, v.title, c.id, v.sort_order from (values
('bepc-anglais-1-s1', 'Réussir l''épreuve', 'bepc-anglais-1', 1),
('bepc-anglais-2-s1', 'Sujets des sessions passées', 'bepc-anglais-2', 1),
('bepc-anglais-3-s1', 'En conditions réelles', 'bepc-anglais-3', 1),
('probatoire-c-anglais-1-s1', 'Réussir l''épreuve', 'probatoire-c-anglais-1', 1),
('probatoire-c-anglais-2-s1', 'Sujets des sessions passées', 'probatoire-c-anglais-2', 1),
('probatoire-c-anglais-3-s1', 'En conditions réelles', 'probatoire-c-anglais-3', 1),
('probatoire-d-anglais-1-s1', 'Réussir l''épreuve', 'probatoire-d-anglais-1', 1),
('probatoire-d-anglais-2-s1', 'Sujets des sessions passées', 'probatoire-d-anglais-2', 1),
('probatoire-d-anglais-3-s1', 'En conditions réelles', 'probatoire-d-anglais-3', 1),
('bac-c-anglais-1-s1', 'Réussir l''épreuve', 'bac-c-anglais-1', 1),
('bac-c-anglais-2-s1', 'Sujets des sessions passées', 'bac-c-anglais-2', 1),
('bac-c-anglais-3-s1', 'En conditions réelles', 'bac-c-anglais-3', 1),
('bac-d-anglais-1-s1', 'Réussir l''épreuve', 'bac-d-anglais-1', 1),
('bac-d-anglais-2-s1', 'Sujets des sessions passées', 'bac-d-anglais-2', 1),
('bac-d-anglais-3-s1', 'En conditions réelles', 'bac-d-anglais-3', 1)
) as v(slug,title,chapter_slug,sort_order)
join chapters c on c.slug=v.chapter_slug
on conflict (slug) do nothing;

insert into lessons (slug, title, summary, chapter_id, subchapter_id, sort_order, status, is_free_preview)
select v.slug, v.title, v.summary, c.id, sc.id, v.sort_order, 'draft', false from (values
('bepc-anglais-1-l1', 'Format et barème de l''épreuve', 'Comprendre la structure, la notation et les attentes.', 'bepc-anglais-1', 'bepc-anglais-1-s1', 1),
('bepc-anglais-1-l2', 'Gérer son temps le jour J', 'Répartir le temps entre les exercices efficacement.', 'bepc-anglais-1', 'bepc-anglais-1-s1', 2),
('bepc-anglais-1-l3', 'Rédaction et présentation', 'Rédiger clairement pour gagner tous ses points.', 'bepc-anglais-1', 'bepc-anglais-1-s1', 3),
('bepc-anglais-1-l4', 'Pièges fréquents à éviter', 'Les erreurs classiques qui coûtent des points.', 'bepc-anglais-1', 'bepc-anglais-1-s1', 4),
('bepc-anglais-2-l1', 'Sujet corrigé (session 1)', 'Résolution détaillée pas à pas d''un sujet d''examen.', 'bepc-anglais-2', 'bepc-anglais-2-s1', 1),
('bepc-anglais-2-l2', 'Sujet corrigé (session 2)', 'Résolution détaillée d''un autre sujet d''examen.', 'bepc-anglais-2', 'bepc-anglais-2-s1', 2),
('bepc-anglais-2-l3', 'Sujet corrigé (session 3)', 'Résolution détaillée d''un troisième sujet.', 'bepc-anglais-2', 'bepc-anglais-2-s1', 3),
('bepc-anglais-3-l1', 'Épreuve blanche 1', 'Composer en temps limité, puis se corriger.', 'bepc-anglais-3', 'bepc-anglais-3-s1', 1),
('bepc-anglais-3-l2', 'Épreuve blanche 2', 'Deuxième épreuve blanche chronométrée.', 'bepc-anglais-3', 'bepc-anglais-3-s1', 2),
('probatoire-c-anglais-1-l1', 'Format et barème de l''épreuve', 'Comprendre la structure, la notation et les attentes.', 'probatoire-c-anglais-1', 'probatoire-c-anglais-1-s1', 1),
('probatoire-c-anglais-1-l2', 'Gérer son temps le jour J', 'Répartir le temps entre les exercices efficacement.', 'probatoire-c-anglais-1', 'probatoire-c-anglais-1-s1', 2),
('probatoire-c-anglais-1-l3', 'Rédaction et présentation', 'Rédiger clairement pour gagner tous ses points.', 'probatoire-c-anglais-1', 'probatoire-c-anglais-1-s1', 3),
('probatoire-c-anglais-1-l4', 'Pièges fréquents à éviter', 'Les erreurs classiques qui coûtent des points.', 'probatoire-c-anglais-1', 'probatoire-c-anglais-1-s1', 4),
('probatoire-c-anglais-2-l1', 'Sujet corrigé (session 1)', 'Résolution détaillée pas à pas d''un sujet d''examen.', 'probatoire-c-anglais-2', 'probatoire-c-anglais-2-s1', 1),
('probatoire-c-anglais-2-l2', 'Sujet corrigé (session 2)', 'Résolution détaillée d''un autre sujet d''examen.', 'probatoire-c-anglais-2', 'probatoire-c-anglais-2-s1', 2),
('probatoire-c-anglais-2-l3', 'Sujet corrigé (session 3)', 'Résolution détaillée d''un troisième sujet.', 'probatoire-c-anglais-2', 'probatoire-c-anglais-2-s1', 3),
('probatoire-c-anglais-3-l1', 'Épreuve blanche 1', 'Composer en temps limité, puis se corriger.', 'probatoire-c-anglais-3', 'probatoire-c-anglais-3-s1', 1),
('probatoire-c-anglais-3-l2', 'Épreuve blanche 2', 'Deuxième épreuve blanche chronométrée.', 'probatoire-c-anglais-3', 'probatoire-c-anglais-3-s1', 2),
('probatoire-d-anglais-1-l1', 'Format et barème de l''épreuve', 'Comprendre la structure, la notation et les attentes.', 'probatoire-d-anglais-1', 'probatoire-d-anglais-1-s1', 1),
('probatoire-d-anglais-1-l2', 'Gérer son temps le jour J', 'Répartir le temps entre les exercices efficacement.', 'probatoire-d-anglais-1', 'probatoire-d-anglais-1-s1', 2),
('probatoire-d-anglais-1-l3', 'Rédaction et présentation', 'Rédiger clairement pour gagner tous ses points.', 'probatoire-d-anglais-1', 'probatoire-d-anglais-1-s1', 3),
('probatoire-d-anglais-1-l4', 'Pièges fréquents à éviter', 'Les erreurs classiques qui coûtent des points.', 'probatoire-d-anglais-1', 'probatoire-d-anglais-1-s1', 4),
('probatoire-d-anglais-2-l1', 'Sujet corrigé (session 1)', 'Résolution détaillée pas à pas d''un sujet d''examen.', 'probatoire-d-anglais-2', 'probatoire-d-anglais-2-s1', 1),
('probatoire-d-anglais-2-l2', 'Sujet corrigé (session 2)', 'Résolution détaillée d''un autre sujet d''examen.', 'probatoire-d-anglais-2', 'probatoire-d-anglais-2-s1', 2),
('probatoire-d-anglais-2-l3', 'Sujet corrigé (session 3)', 'Résolution détaillée d''un troisième sujet.', 'probatoire-d-anglais-2', 'probatoire-d-anglais-2-s1', 3),
('probatoire-d-anglais-3-l1', 'Épreuve blanche 1', 'Composer en temps limité, puis se corriger.', 'probatoire-d-anglais-3', 'probatoire-d-anglais-3-s1', 1),
('probatoire-d-anglais-3-l2', 'Épreuve blanche 2', 'Deuxième épreuve blanche chronométrée.', 'probatoire-d-anglais-3', 'probatoire-d-anglais-3-s1', 2),
('bac-c-anglais-1-l1', 'Format et barème de l''épreuve', 'Comprendre la structure, la notation et les attentes.', 'bac-c-anglais-1', 'bac-c-anglais-1-s1', 1),
('bac-c-anglais-1-l2', 'Gérer son temps le jour J', 'Répartir le temps entre les exercices efficacement.', 'bac-c-anglais-1', 'bac-c-anglais-1-s1', 2),
('bac-c-anglais-1-l3', 'Rédaction et présentation', 'Rédiger clairement pour gagner tous ses points.', 'bac-c-anglais-1', 'bac-c-anglais-1-s1', 3),
('bac-c-anglais-1-l4', 'Pièges fréquents à éviter', 'Les erreurs classiques qui coûtent des points.', 'bac-c-anglais-1', 'bac-c-anglais-1-s1', 4),
('bac-c-anglais-2-l1', 'Sujet corrigé (session 1)', 'Résolution détaillée pas à pas d''un sujet d''examen.', 'bac-c-anglais-2', 'bac-c-anglais-2-s1', 1),
('bac-c-anglais-2-l2', 'Sujet corrigé (session 2)', 'Résolution détaillée d''un autre sujet d''examen.', 'bac-c-anglais-2', 'bac-c-anglais-2-s1', 2),
('bac-c-anglais-2-l3', 'Sujet corrigé (session 3)', 'Résolution détaillée d''un troisième sujet.', 'bac-c-anglais-2', 'bac-c-anglais-2-s1', 3),
('bac-c-anglais-3-l1', 'Épreuve blanche 1', 'Composer en temps limité, puis se corriger.', 'bac-c-anglais-3', 'bac-c-anglais-3-s1', 1),
('bac-c-anglais-3-l2', 'Épreuve blanche 2', 'Deuxième épreuve blanche chronométrée.', 'bac-c-anglais-3', 'bac-c-anglais-3-s1', 2),
('bac-d-anglais-1-l1', 'Format et barème de l''épreuve', 'Comprendre la structure, la notation et les attentes.', 'bac-d-anglais-1', 'bac-d-anglais-1-s1', 1),
('bac-d-anglais-1-l2', 'Gérer son temps le jour J', 'Répartir le temps entre les exercices efficacement.', 'bac-d-anglais-1', 'bac-d-anglais-1-s1', 2),
('bac-d-anglais-1-l3', 'Rédaction et présentation', 'Rédiger clairement pour gagner tous ses points.', 'bac-d-anglais-1', 'bac-d-anglais-1-s1', 3),
('bac-d-anglais-1-l4', 'Pièges fréquents à éviter', 'Les erreurs classiques qui coûtent des points.', 'bac-d-anglais-1', 'bac-d-anglais-1-s1', 4),
('bac-d-anglais-2-l1', 'Sujet corrigé (session 1)', 'Résolution détaillée pas à pas d''un sujet d''examen.', 'bac-d-anglais-2', 'bac-d-anglais-2-s1', 1),
('bac-d-anglais-2-l2', 'Sujet corrigé (session 2)', 'Résolution détaillée d''un autre sujet d''examen.', 'bac-d-anglais-2', 'bac-d-anglais-2-s1', 2),
('bac-d-anglais-2-l3', 'Sujet corrigé (session 3)', 'Résolution détaillée d''un troisième sujet.', 'bac-d-anglais-2', 'bac-d-anglais-2-s1', 3),
('bac-d-anglais-3-l1', 'Épreuve blanche 1', 'Composer en temps limité, puis se corriger.', 'bac-d-anglais-3', 'bac-d-anglais-3-s1', 1),
('bac-d-anglais-3-l2', 'Épreuve blanche 2', 'Deuxième épreuve blanche chronométrée.', 'bac-d-anglais-3', 'bac-d-anglais-3-s1', 2)
) as v(slug,title,summary,chapter_slug,subchapter_slug,sort_order)
join chapters c on c.slug=v.chapter_slug
join subchapters sc on sc.slug=v.subchapter_slug
on conflict (slug) do nothing;

insert into activities (lesson_id, type, title, video_provider, sort_order)
select l.id, 'video', 'Vidéo (à venir)', 'placeholder', 0
from lessons l join chapters c on c.id=l.chapter_id
where c.class_slug in ('bepc','probatoire-c','probatoire-d','bac-c','bac-d')
  and c.subject_key = 'anglais'
  and not exists (select 1 from activities a where a.lesson_id=l.id and a.type='video');
