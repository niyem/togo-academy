-- Demo du modele d'evaluation sur le chapitre Thales (3eme maths).
-- Sous-chapitre regroupant les 2 lecons + questions dans la video +
-- evaluation de sous-chapitre + examen final de chapitre.

insert into subchapters (id, slug, title, chapter_id, sort_order) values
  ('55555555-0000-0000-0000-000000000001', 'configuration-et-calculs',
   'Configuration et calculs de longueurs',
   '11111111-0000-0000-0000-000000000001', 1)
on conflict (slug) do nothing;

update lessons set subchapter_id = '55555555-0000-0000-0000-000000000001'
  where chapter_id = '11111111-0000-0000-0000-000000000001';

-- Questions horodatees dans la video de la lecon Thales (activite video).
insert into quiz_questions (id, activity_id, prompt, explanation, sort_order, at_time_sec) values
  ('44444444-0000-0000-0000-000000000101',
   '33333333-0000-0000-0000-000000000001',
   'Dans la configuration de Thalès, combien de droites se coupent au point A ?',
   'Deux droites sécantes se coupent en A ; elles sont ensuite coupées par deux droites parallèles.',
   1, 10),
  ('44444444-0000-0000-0000-000000000102',
   '33333333-0000-0000-0000-000000000001',
   'Que peut-on dire des longueurs AM/AB et AN/AC ?',
   'C''est le coeur du théorème : les rapports sont égaux.',
   2, 30)
on conflict (id) do nothing;

insert into quiz_options (question_id, label, is_correct, sort_order) values
  ('44444444-0000-0000-0000-000000000101', 'Une seule', false, 1),
  ('44444444-0000-0000-0000-000000000101', 'Deux', true, 2),
  ('44444444-0000-0000-0000-000000000101', 'Quatre', false, 3),
  ('44444444-0000-0000-0000-000000000102', 'Ils sont égaux', true, 1),
  ('44444444-0000-0000-0000-000000000102', 'AM/AB est toujours plus grand', false, 2),
  ('44444444-0000-0000-0000-000000000102', 'On ne peut rien dire', false, 3);

-- Evaluation du sous-chapitre.
insert into assessments (id, slug, title, kind, subchapter_id, pass_percent) values
  ('66666666-0000-0000-0000-000000000001', 'eval-configuration-et-calculs',
   'Évaluation : Configuration et calculs', 'evaluation',
   '55555555-0000-0000-0000-000000000001', 60)
on conflict (slug) do nothing;

insert into quiz_questions (id, assessment_id, prompt, explanation, sort_order) values
  ('44444444-0000-0000-0000-000000000201', '66666666-0000-0000-0000-000000000001',
   'AM = 2 cm, AB = 8 cm. Quel est le rapport AM/AB ?',
   '2/8 se simplifie en 1/4.', 1),
  ('44444444-0000-0000-0000-000000000202', '66666666-0000-0000-0000-000000000001',
   'Si AM/AB = 1/4 et AC = 12 cm, combien vaut AN ?',
   'AN = AC × 1/4 = 12/4 = 3 cm.', 2)
on conflict (id) do nothing;

insert into quiz_options (question_id, label, is_correct, sort_order) values
  ('44444444-0000-0000-0000-000000000201', '1/4', true, 1),
  ('44444444-0000-0000-0000-000000000201', '1/2', false, 2),
  ('44444444-0000-0000-0000-000000000201', '4', false, 3),
  ('44444444-0000-0000-0000-000000000202', '3 cm', true, 1),
  ('44444444-0000-0000-0000-000000000202', '4 cm', false, 2),
  ('44444444-0000-0000-0000-000000000202', '48 cm', false, 3);

-- Examen final du chapitre.
insert into assessments (id, slug, title, kind, chapter_id, pass_percent) values
  ('66666666-0000-0000-0000-000000000002', 'examen-theoreme-de-thales',
   'Examen final : Le théorème de Thalès', 'examen',
   '11111111-0000-0000-0000-000000000001', 60)
on conflict (slug) do nothing;

insert into quiz_questions (id, assessment_id, prompt, explanation, sort_order) values
  ('44444444-0000-0000-0000-000000000301', '66666666-0000-0000-0000-000000000002',
   'Condition indispensable pour appliquer le théorème de Thalès :',
   'Deux droites parallèles coupées par deux sécantes.', 1),
  ('44444444-0000-0000-0000-000000000302', '66666666-0000-0000-0000-000000000002',
   'AM = 3, AB = 5, BC = 10. Combien vaut MN ?',
   'MN = BC × AM/AB = 10 × 3/5 = 6.', 2),
  ('44444444-0000-0000-0000-000000000303', '66666666-0000-0000-0000-000000000002',
   'À quoi sert la réciproque du théorème de Thalès ?',
   'Elle permet de démontrer que deux droites sont parallèles.', 3)
on conflict (id) do nothing;

insert into quiz_options (question_id, label, is_correct, sort_order) values
  ('44444444-0000-0000-0000-000000000301', 'Deux droites parallèles', true, 1),
  ('44444444-0000-0000-0000-000000000301', 'Un angle droit', false, 2),
  ('44444444-0000-0000-0000-000000000301', 'Un triangle isocèle', false, 3),
  ('44444444-0000-0000-0000-000000000302', '6', true, 1),
  ('44444444-0000-0000-0000-000000000302', '5', false, 2),
  ('44444444-0000-0000-0000-000000000302', '16', false, 3),
  ('44444444-0000-0000-0000-000000000303', 'Démontrer que deux droites sont parallèles', true, 1),
  ('44444444-0000-0000-0000-000000000303', 'Calculer un angle', false, 2),
  ('44444444-0000-0000-0000-000000000303', 'Mesurer une aire', false, 3);
