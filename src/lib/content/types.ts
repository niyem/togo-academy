// Domain types for the Togo Academy content hierarchy.
// Hierarchy: Education level -> Class -> Subject -> Chapter -> Lesson -> Activities.
// These types are the single source of truth shared by the seed data (demo mode)
// and the Supabase-backed data layer (production). The SQL migration in
// supabase/migrations mirrors this shape.

export type LevelStage =
  | "primaire"
  | "college"
  | "lycee"
  | "certifications"; // hors cursus scolaire (TOEFL, concours)

export type SubjectKey =
  | "mathematiques"
  | "physique"
  | "chimie"
  | "svt" // Sciences de la Vie et de la Terre (biology / life sciences)
  | "spt" // Sciences Physiques et Technologie (physique-chimie-techno, college)
  | "anglais" // English (school subject + primary songs + TOEFL prep)
  | "technologie"
  | "informatique";

export type ActivityType =
  | "video"
  | "lecture" // written explanation
  | "exemple" // worked example
  | "exercice" // interactive practice
  | "quiz";

export type ContentStatus = "brouillon" | "en_revue" | "publie";

export interface EducationLevel {
  slug: LevelStage;
  name: string; // e.g. "Collège"
  description: string;
  order: number;
}

/** Filiere apres le CEPD : enseignement general ou technique. */
export type Track = "general" | "technique";

export interface SchoolClass {
  slug: string; // e.g. "3eme"
  name: string; // e.g. "3ème"
  levelSlug: LevelStage;
  order: number;
  track: Track;
}

export interface Subject {
  key: SubjectKey;
  name: string; // e.g. "Mathématiques"
  icon: string; // emoji used as a lightweight, low-bandwidth glyph
  description: string;
}

export interface Chapter {
  slug: string;
  title: string;
  classSlug: string;
  subjectKey: SubjectKey;
  order: number;
}

export interface QuizOption {
  id: string;
  label: string;
  correct: boolean;
}

export type QuestionType =
  | "qcm"
  | "vrai_faux"
  | "texte_trous"
  | "appariement"
  | "traditionnelle"
  | "situation_probleme";

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  explanation: string; // shown as immediate feedback
  /** Quiz dans la video : seconde a laquelle la video se met en pause. */
  atTimeSec?: number;
  /** Format BAC : type de question (defaut qcm). */
  qtype?: QuestionType;
  /** Donnees propres au type (blancs, paires, reponses attendues...). */
  payload?: Record<string, unknown>;
  /** Bareme de la question (points, defaut 1). */
  points?: number;
  /** Exercice du sujet (ex1 situations, ex2 objectives, ex3 traditionnelles). */
  section?: string;
}

/** Sous-chapitre : groupe de lecons, conclu par une evaluation. */
export interface Subchapter {
  id: string;
  slug: string;
  title: string;
  order: number;
}

/** Evaluation de sous-chapitre ou examen final de chapitre. */
export interface Assessment {
  id: string;
  slug: string;
  title: string;
  kind: "evaluation" | "examen";
  passPercent: number;
  subchapterId?: string;
  questions: QuizQuestion[];
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  // Rich, type-specific payload. Kept loose here; the seed fills what each type needs.
  body?: string; // markdown for lecture / exemple / exercice statements
  videoProvider?: "youtube" | "bunny" | "cloudflare" | "supabase" | "placeholder";
  videoRef?: string; // provider id / url; provider-agnostic on purpose
  durationSec?: number;
  questions?: QuizQuestion[]; // for quiz
  hint?: string; // for exercice
  solution?: string; // for exercice / exemple
}

export interface Lesson {
  slug: string;
  title: string;
  summary: string;
  chapterSlug: string;
  classSlug: string;
  subjectKey: SubjectKey;
  order: number;
  isFreePreview: boolean;
  status: ContentStatus;
  subchapterId?: string;
  pdfPath?: string; // subscriber-gated download (Supabase Storage signed URL)
  activities: Activity[];
}

export interface SubscriptionPlan {
  slug: string;
  name: string;
  priceXof: number; // West African CFA franc
  cadence: "hebdomadaire" | "mensuel" | "trimestriel" | "annuel";
  scope: "plateforme" | "classe" | "matiere";
  highlights: string[];
  recommended?: boolean;
}
