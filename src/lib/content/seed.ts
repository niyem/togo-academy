// Seed content for the Togo Academy demo (Phase 0).
// This mirrors the Togolese national curriculum structure. Real content is added
// later via the teacher dashboard; for now one full lesson path is fleshed out so
// the whole hierarchy is visibly real end-to-end.

import type {
  Activity,
  Chapter,
  EducationLevel,
  Lesson,
  SchoolClass,
  Subject,
  SubscriptionPlan,
} from "./types";

export const levels: EducationLevel[] = [
  {
    slug: "primaire",
    name: "Primaire",
    description: "Les fondations : lire, compter et découvrir le monde.",
    order: 1,
  },
  {
    slug: "college",
    name: "Collège",
    description: "Consolider les bases scientifiques du CEG au BEPC.",
    order: 2,
  },
  {
    slug: "lycee",
    name: "Lycée",
    description: "Approfondir les sciences jusqu'au Baccalauréat.",
    order: 3,
  },
  {
    slug: "certifications",
    name: "Préparation aux examens",
    description: "Certifications d'anglais et concours : ouvrez-vous au monde.",
    order: 4,
  },
];

export const classes: SchoolClass[] = [
  // Primaire (jusqu'au CEPD)
  { slug: "cp1", name: "CP1", levelSlug: "primaire", order: 1, track: "general" },
  { slug: "cp2", name: "CP2", levelSlug: "primaire", order: 2, track: "general" },
  { slug: "ce1", name: "CE1", levelSlug: "primaire", order: 3, track: "general" },
  { slug: "ce2", name: "CE2", levelSlug: "primaire", order: 4, track: "general" },
  { slug: "cm1", name: "CM1", levelSlug: "primaire", order: 5, track: "general" },
  { slug: "cm2", name: "CM2", levelSlug: "primaire", order: 6, track: "general" },
  // Collège : enseignement général (BEPC). Pas de collège technique.
  { slug: "6eme", name: "6ème", levelSlug: "college", order: 1, track: "general" },
  { slug: "5eme", name: "5ème", levelSlug: "college", order: 2, track: "general" },
  { slug: "4eme", name: "4ème", levelSlug: "college", order: 3, track: "general" },
  { slug: "3eme", name: "3ème", levelSlug: "college", order: 4, track: "general" },
  // Lycée : enseignement général (BAC). Pas de lycée technique.
  { slug: "seconde", name: "Seconde", levelSlug: "lycee", order: 1, track: "general" },
  { slug: "premiere", name: "Première", levelSlug: "lycee", order: 2, track: "general" },
  { slug: "terminale", name: "Terminale", levelSlug: "lycee", order: 3, track: "general" },
  // Préparation aux examens (hors cursus scolaire).
  { slug: "toefl", name: "Préparation TOEFL", levelSlug: "certifications", order: 1, track: "general" },
];

export const subjects: Subject[] = [
  {
    key: "mathematiques",
    name: "Mathématiques",
    icon: "➗",
    description: "Nombres, géométrie, algèbre et raisonnement.",
  },
  {
    key: "physique",
    name: "Physique",
    icon: "🧲",
    description: "Mécanique, électricité, optique et énergie.",
  },
  {
    key: "chimie",
    name: "Chimie",
    icon: "⚗️",
    description: "Matière, réactions et transformations.",
  },
  {
    key: "svt",
    name: "SVT",
    icon: "🌱",
    description: "Sciences de la vie et de la terre.",
  },
  {
    key: "spt",
    name: "Sciences physiques (SPT)",
    icon: "🔬",
    description: "Physique, chimie et technologie au collège.",
  },
  {
    key: "anglais",
    name: "Anglais",
    icon: "🗣️",
    description: "Anglais du primaire au lycée, et préparation au TOEFL.",
  },
  {
    key: "technologie",
    name: "Technologie",
    icon: "⚙️",
    description: "Objets techniques et démarche d'ingénierie.",
  },
  {
    key: "informatique",
    name: "Informatique",
    icon: "💻",
    description: "Algorithmique, bureautique et culture numérique.",
  },
];

export const chapters: Chapter[] = [
  {
    slug: "theoreme-de-thales",
    title: "Le théorème de Thalès",
    classSlug: "3eme",
    subjectKey: "mathematiques",
    order: 1,
  },
  {
    slug: "theoreme-de-pythagore",
    title: "Le théorème de Pythagore",
    classSlug: "3eme",
    subjectKey: "mathematiques",
    order: 2,
  },
  {
    slug: "calcul-litteral",
    title: "Calcul littéral et identités remarquables",
    classSlug: "3eme",
    subjectKey: "mathematiques",
    order: 3,
  },
];

const thalesActivities: Activity[] = [
  {
    id: "act-thales-video",
    type: "video",
    title: "Vidéo : comprendre le théorème de Thalès",
    videoProvider: "placeholder",
    videoRef: "thales-intro",
    durationSec: 360,
  },
  {
    id: "act-thales-lecture",
    type: "lecture",
    title: "Le cours",
    body: `## Configuration de Thalès

On considère deux droites sécantes en un point **A**. Deux autres droites **(BC)** et **(MN)** sont **parallèles**.

Si les points sont alignés dans le bon ordre, alors les longueurs sont **proportionnelles** :

$$\\frac{AM}{AB} = \\frac{AN}{AC} = \\frac{MN}{BC}$$

Ce théorème permet de **calculer une longueur inconnue** dès que l'on connaît trois des autres longueurs.`,
  },
  {
    id: "act-thales-exemple",
    type: "exemple",
    title: "Exemple résolu",
    body: `On sait que \`AM = 3 cm\`, \`AB = 5 cm\` et \`AC = 8 cm\`. Les droites (MN) et (BC) sont parallèles. Calculer \`AN\`.`,
    solution: `D'après le théorème de Thalès : AM/AB = AN/AC.

Donc AN = AC × (AM / AB) = 8 × (3 / 5) = **4,8 cm**.`,
  },
  {
    id: "act-thales-exercice",
    type: "exercice",
    title: "À toi de jouer",
    body: `Dans la même configuration, \`AM = 4 cm\`, \`AB = 6 cm\` et \`BC = 9 cm\`. Calculer \`MN\`.`,
    hint: "Utilise le rapport AM/AB, puis applique-le à MN et BC.",
    solution: "MN = BC × (AM / AB) = 9 × (4 / 6) = 6 cm.",
  },
  {
    id: "act-thales-quiz",
    type: "quiz",
    title: "Quiz : as-tu compris ?",
    questions: [
      {
        id: "q1",
        prompt:
          "Quelle condition est indispensable pour appliquer le théorème de Thalès ?",
        options: [
          { id: "a", label: "Les droites doivent être perpendiculaires", correct: false },
          { id: "b", label: "Deux droites doivent être parallèles", correct: true },
          { id: "c", label: "Le triangle doit être équilatéral", correct: false },
        ],
        explanation:
          "Le théorème repose sur deux droites parallèles coupant deux sécantes.",
      },
      {
        id: "q2",
        prompt: "Si AM/AB = 3/5 et AC = 10 cm, combien vaut AN ?",
        options: [
          { id: "a", label: "6 cm", correct: true },
          { id: "b", label: "5 cm", correct: false },
          { id: "c", label: "3 cm", correct: false },
        ],
        explanation: "AN = AC × 3/5 = 10 × 0,6 = 6 cm.",
      },
    ],
  },
];

export const lessons: Lesson[] = [
  {
    slug: "decouvrir-le-theoreme-de-thales",
    title: "Découvrir le théorème de Thalès",
    summary:
      "Comprendre la configuration de Thalès et calculer une longueur inconnue grâce à la proportionnalité.",
    chapterSlug: "theoreme-de-thales",
    classSlug: "3eme",
    subjectKey: "mathematiques",
    order: 1,
    isFreePreview: true,
    status: "publie",
    pdfPath: "3eme/maths/theoreme-de-thales/fiche-lecon.pdf",
    activities: thalesActivities,
  },
  {
    slug: "reciproque-du-theoreme-de-thales",
    title: "La réciproque du théorème de Thalès",
    summary:
      "Utiliser la réciproque pour démontrer que deux droites sont parallèles.",
    chapterSlug: "theoreme-de-thales",
    classSlug: "3eme",
    subjectKey: "mathematiques",
    order: 2,
    isFreePreview: false,
    status: "publie",
    activities: [
      {
        id: "act-recip-lecture",
        type: "lecture",
        title: "Le cours",
        body: "La réciproque permet de **prouver un parallélisme** en comparant deux rapports de longueurs.",
      },
    ],
  },
];

export const plans: SubscriptionPlan[] = [
  {
    slug: "decouverte",
    name: "Découverte",
    priceXof: 0,
    cadence: "mensuel",
    scope: "plateforme",
    highlights: [
      "Leçons d'essai gratuites",
      "Aperçu des cours et des plans",
      "Assistant IA limité",
    ],
  },
  {
    slug: "hebdo-classe",
    name: "Hebdomadaire",
    priceXof: 1000,
    cadence: "hebdomadaire",
    scope: "matiere",
    highlights: [
      "Une matière de votre choix",
      "Idéal pour débloquer un point faible",
      "Vidéos, exercices et quiz",
      "Sans engagement",
    ],
  },
  {
    slug: "mensuel-classe",
    name: "Mensuel",
    priceXof: 3000,
    cadence: "mensuel",
    scope: "classe",
    highlights: [
      "Toutes les matières de sa classe",
      "Vidéos, exercices et quiz",
      "Fiches PDF téléchargeables",
      "Suivi de progression",
    ],
  },
  {
    slug: "trimestriel-plateforme",
    name: "Trimestriel",
    priceXof: 7500,
    cadence: "trimestriel",
    scope: "classe",
    highlights: [
      "Toutes les matières de sa classe",
      "Suit le rythme des trimestres scolaires",
      "Équivaut à 2 500 FCFA par mois",
      "Fiches PDF + tuteur IA complet",
    ],
    recommended: true,
  },
  {
    slug: "annuel-plateforme",
    name: "Annuel",
    priceXof: 25000,
    cadence: "annuel",
    scope: "plateforme",
    highlights: [
      "Accès à TOUTES les classes et matières",
      "Idéal pour les familles (plusieurs enfants)",
      "Toute l'année scolaire, examens compris",
      "Tableau de bord parent + rapports",
    ],
  },
  // Formule dediee TOEFL : uniquement annuelle, peu chere, hors grille scolaire.
  {
    slug: "toefl-annuel",
    name: "Préparation TOEFL",
    priceXof: 8000,
    cadence: "annuel",
    scope: "classe",
    highlights: [
      "Accès complet à la préparation TOEFL",
      "Reading, Listening, Speaking, Writing",
      "Grammaire, vocabulaire et tests blancs",
      "Un an d'accès, à petit prix",
    ],
  },
];
