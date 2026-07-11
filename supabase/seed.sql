-- Togo Academy — seed data. Mirrors src/lib/content/seed.ts so a provisioned
-- database reproduces the Phase 0 demo. Run after 0001_init.sql.

insert into education_levels (slug, name, description, sort_order) values
  ('primaire', 'Primaire', 'Les fondations : lire, compter et découvrir le monde.', 1),
  ('college',  'Collège',  'Consolider les bases scientifiques du CEG au BEPC.', 2),
  ('lycee',    'Lycée',    'Approfondir les sciences jusqu''au Baccalauréat.', 3);

insert into classes (slug, name, level_slug, sort_order) values
  ('cp1','CP1','primaire',1),('cp2','CP2','primaire',2),('ce1','CE1','primaire',3),
  ('ce2','CE2','primaire',4),('cm1','CM1','primaire',5),('cm2','CM2','primaire',6),
  ('6eme','6ème','college',1),('5eme','5ème','college',2),('4eme','4ème','college',3),
  ('3eme','3ème','college',4),
  ('seconde','Seconde','lycee',1),('premiere','Première','lycee',2),('terminale','Terminale','lycee',3);

insert into subjects (key, name, icon, description) values
  ('mathematiques','Mathématiques','➗','Nombres, géométrie, algèbre et raisonnement.'),
  ('physique','Physique','🧲','Mécanique, électricité, optique et énergie.'),
  ('chimie','Chimie','⚗️','Matière, réactions et transformations.'),
  ('svt','SVT','🌱','Sciences de la vie et de la terre.'),
  ('technologie','Technologie','⚙️','Objets techniques et démarche d''ingénierie.'),
  ('informatique','Informatique','💻','Algorithmique, bureautique et culture numérique.');

insert into plans (slug, name, price_xof, cadence, scope, is_active) values
  ('decouverte','Découverte',0,'monthly','platform',true),
  ('mensuel-classe','Mensuel (une classe)',3000,'monthly','class',true),
  ('annuel-plateforme','Annuel (toute la plateforme)',25000,'annual','platform',true);

-- Chapters for 3ème Mathématiques
insert into chapters (id, slug, title, class_slug, subject_key, sort_order) values
  ('11111111-0000-0000-0000-000000000001','theoreme-de-thales','Le théorème de Thalès','3eme','mathematiques',1),
  ('11111111-0000-0000-0000-000000000002','theoreme-de-pythagore','Le théorème de Pythagore','3eme','mathematiques',2),
  ('11111111-0000-0000-0000-000000000003','calcul-litteral','Calcul littéral et identités remarquables','3eme','mathematiques',3);

-- Lessons
insert into lessons (id, slug, title, summary, chapter_id, sort_order, is_free_preview, status, pdf_path) values
  ('22222222-0000-0000-0000-000000000001','decouvrir-le-theoreme-de-thales',
   'Découvrir le théorème de Thalès',
   'Comprendre la configuration de Thalès et calculer une longueur inconnue grâce à la proportionnalité.',
   '11111111-0000-0000-0000-000000000001',1,true,'published','3eme/maths/theoreme-de-thales/fiche-lecon.pdf'),
  ('22222222-0000-0000-0000-000000000002','reciproque-du-theoreme-de-thales',
   'La réciproque du théorème de Thalès',
   'Utiliser la réciproque pour démontrer que deux droites sont parallèles.',
   '11111111-0000-0000-0000-000000000001',2,false,'published',null);

-- Activities for the free lesson
insert into activities (id, lesson_id, type, title, sort_order, body, video_provider, video_ref, duration_sec, hint, solution) values
  ('33333333-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000001','video','Vidéo : comprendre le théorème de Thalès',1,null,'placeholder','thales-intro',360,null,null),
  ('33333333-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000001','lecture','Le cours',2,
   E'## Configuration de Thalès\n\nDeux droites sécantes en A, coupées par deux droites parallèles (BC) et (MN), donnent des longueurs proportionnelles : AM/AB = AN/AC = MN/BC.',
   null,null,null,null,null),
  ('33333333-0000-0000-0000-000000000003','22222222-0000-0000-0000-000000000001','exercice','À toi de jouer',4,
   'AM = 4 cm, AB = 6 cm et BC = 9 cm. Calculer MN.',null,null,null,
   'Utilise le rapport AM/AB, puis applique-le à MN et BC.',
   'MN = BC × (AM / AB) = 9 × (4 / 6) = 6 cm.'),
  ('33333333-0000-0000-0000-000000000004','22222222-0000-0000-0000-000000000001','quiz','Quiz : as-tu compris ?',5,null,null,null,null,null,null);

-- Quiz question + options
insert into quiz_questions (id, activity_id, prompt, explanation, sort_order) values
  ('44444444-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000004',
   'Quelle condition est indispensable pour appliquer le théorème de Thalès ?',
   'Le théorème repose sur deux droites parallèles coupant deux sécantes.',1);

insert into quiz_options (question_id, label, is_correct, sort_order) values
  ('44444444-0000-0000-0000-000000000001','Les droites doivent être perpendiculaires',false,1),
  ('44444444-0000-0000-0000-000000000001','Deux droites doivent être parallèles',true,2),
  ('44444444-0000-0000-0000-000000000001','Le triangle doit être équilatéral',false,3);
