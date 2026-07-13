// Types et constantes du moteur d'epreuves format BAC (partages entre le
// serveur de correction et les composants client).

export const BASE_EXAM_ATTEMPTS = 4;
export const EXAM_COOLDOWN_HOURS = 12;

export interface AttemptStatus {
  used: number;
  allowed: number;
  nextAllowedAt: string | null; // ISO : fin du delai de 12 h, sinon null
  exhausted: boolean; // plus de tentatives : paiement requis
  passed: boolean;
}

export interface QuestionResult {
  questionId: string;
  earned: number;
  max: number;
  feedback: string;
  /** Grille APC pour les situations problemes. */
  grid?: {
    pertinence: number;
    correction: number;
    coherence: number;
    perfectionnement: number;
  };
}

export interface GradeResult {
  ok: true;
  earned: number;
  max: number;
  percent: number;
  passed: boolean;
  results: QuestionResult[];
  status: AttemptStatus;
}

export interface GradeError {
  ok: false;
  error: string;
  status?: AttemptStatus;
}
