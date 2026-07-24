// Bareme de remuneration de la production de contenu.
//
// UNITE = LA MATIERE a un niveau de classe (subject_key x class_slug). Le
// concepteur concoit TOUS les modules de la matiere (ex. « Sciences physiques »
// en Terminale D = tous les modules PHY et CHI) pour ce prix FORFAITAIRE ;
// l'inspecteur relit toute la matiere pour 50 % de ce prix.
//
// Grille arretee par Niyem (24/07/2026). Les classes de revision d'examen
// (CEPD, BEPC, Probatoire A/C/D, BAC A/C/D, TOEFL) ne sont pas encore tarifees
// (a definir) -> subjectPrice renvoie null pour elles.
//
// Ces prix ne s'affichent QUE dans l'espace administration.

export const INSPECTOR_FACTOR = 0.5; // inspecteur = 50 % du prix concepteur

// Prix concepteur (FCFA) PAR MATIERE, selon le slug de classe.
export const SUBJECT_PRICE: Record<string, number> = {
  // Primaire
  cp1: 10000,
  cp2: 12500,
  ce1: 15000,
  ce2: 17500,
  cm1: 17500,
  cm2: 20000,
  // College
  "6eme": 35000,
  "5eme": 40000,
  "4eme": 50000,
  "3eme": 60000,
  // Lycee serie A (litteraire)
  seconde: 60000, // Seconde A
  premiere: 70000, // Premiere A
  terminale: 80000, // Terminale A
  // Lycee scientifique (series C et D)
  "seconde-c": 80000, // Seconde scientifique
  "premiere-c": 90000,
  "premiere-d": 90000,
  "terminale-c": 100000,
  "terminale-d": 100000,
  // Classes d'examen (CEPD, BEPC, Probatoire, BAC, TOEFL) : A DEFINIR.
};

/** Prix concepteur (FCFA) d'une MATIERE selon sa classe ; null si non tarife. */
export function subjectPrice(classSlug: string): number | null {
  return SUBJECT_PRICE[classSlug] ?? null;
}

/** Prix inspecteur (FCFA) = 50 % du prix concepteur (arrondi a 50) ; null si non tarife. */
export function inspectorSubjectPrice(classSlug: string): number | null {
  const p = subjectPrice(classSlug);
  return p == null ? null : Math.round((p * INSPECTOR_FACTOR) / 50) * 50;
}
