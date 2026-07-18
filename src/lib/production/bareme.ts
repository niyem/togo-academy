// Bareme de remuneration de la production de contenu.
//
// UNITE = LE MODULE (chapitre : ex. "PHY 1 · Energie electrique..."), qui
// contient plusieurs lecons/capacites. On attribue et on tarife par module.
//
// Principe (Niyem, 18/07/2026) : on ne recrute que des enseignants assermentes
// qui ont DEJA leurs cours -> tout est de l'ADAPTATION en format APC + plateforme.
// Le prix depend de la CLASSE / SERIE du module, pas d'un decompte d'elements.
//
// Echelle 1 000 (primaire, plancher) -> 3 000 (fin college / serie A) -> 5 000
// FCFA (Terminale C/D, plafond). Les series litteraires (A) sont plafonnees au
// prix de la 3e (3 000). L'inspecteur est paye 60 % du tarif enseignant.
//
// Tout se regle ici : modifiez ces montants pour recalibrer apres le pilote.

export const INSPECTOR_FACTOR = 0.6; // relecture inspecteur = 60 % du tarif auteur

// Prix enseignant (FCFA) par slug de classe. Grille revue le 18/07/2026 pour
// tenir le budget (conception + relecture + mise en video par module) :
// 1 000 (primaire) -> 3 000 (fin college / serie A) -> 5 000 (Terminale sci).
// Litteraire (serie A) = plafonne au prix de la 3e (3 000).
export const LESSON_PRICE: Record<string, number> = {
  // Primaire (plancher) + CEPD (fin de primaire)
  cp1: 1000,
  cp2: 1000,
  ce1: 1000,
  ce2: 1000,
  cm1: 1000,
  cm2: 1000,
  cepd: 1000,
  // College : regression 1 500 -> 3 000
  "6eme": 1500,
  "5eme": 2000,
  "4eme": 2500,
  "3eme": 3000,
  bepc: 3000, // fin de college = 3e
  // Lycee LITTERAIRE (serie A) : plafonne au prix de la 3e (3 000)
  seconde: 3000, // Seconde A
  premiere: 3000, // Premiere A
  terminale: 3000, // Terminale A
  "probatoire-a": 3000,
  "bac-a": 3000,
  toefl: 3000, // preparation TOEFL (produit a part) : ajustable
  // Lycee SCIENTIFIQUE : regression 3 500 -> 5 000
  "seconde-c": 3500, // Seconde C (le "scientifique" du niveau seconde)
  "premiere-c": 4000,
  "premiere-d": 4000,
  "probatoire-c": 4000,
  "probatoire-d": 4000,
  "terminale-c": 5000, // top
  "terminale-d": 5000, // top
  "bac-c": 5000,
  "bac-d": 5000,
};

export const DEFAULT_PRICE = 3000; // classe inconnue : repli prudent

/** Prix enseignant (FCFA) d'un MODULE selon sa classe. */
export function modulePrice(classSlug: string): number {
  return LESSON_PRICE[classSlug] ?? DEFAULT_PRICE;
}

/** Prix inspecteur (FCFA) pour la relecture d'un module, arrondi a 50. */
export function inspectorPrice(classSlug: string): number {
  return Math.round((modulePrice(classSlug) * INSPECTOR_FACTOR) / 50) * 50;
}
