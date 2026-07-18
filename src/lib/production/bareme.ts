// Bareme de remuneration de la production de contenu.
//
// UNITE = LE MODULE (chapitre : ex. "PHY 1 · Energie electrique..."), qui
// contient plusieurs lecons/capacites. On attribue et on tarife par module.
//
// Principe (Niyem, 18/07/2026) : on ne recrute que des enseignants assermentes
// qui ont DEJA leurs cours -> tout est de l'ADAPTATION en format APC + plateforme.
// Le prix depend de la CLASSE / SERIE du module, pas d'un decompte d'elements.
//
// Echelle 3 000 (primaire, plancher) -> 7 000 FCFA (Terminale C/D, plafond),
// par regression selon le niveau. Les series litteraires (A) sont plafonnees au
// prix de la 3e (5 000). L'inspecteur est paye une fraction du tarif enseignant.
//
// Tout se regle ici : modifiez ces montants pour recalibrer apres le pilote.

export const INSPECTOR_FACTOR = 0.35; // relecture inspecteur ~35 % du tarif auteur

// Prix enseignant (FCFA) par slug de classe. Litteraire (serie A) = prix de la 3e.
export const LESSON_PRICE: Record<string, number> = {
  // Primaire (plancher) + CEPD (fin de primaire)
  cp1: 3000,
  cp2: 3000,
  ce1: 3000,
  ce2: 3000,
  cm1: 3000,
  cm2: 3000,
  cepd: 3000,
  // College : regression
  "6eme": 3500,
  "5eme": 4000,
  "4eme": 4500,
  "3eme": 5000,
  bepc: 5000, // fin de college = 3e
  // Lycee LITTERAIRE (serie A) : plafonne au prix de la 3e
  seconde: 5000, // Seconde A
  premiere: 5000, // Premiere A
  terminale: 5000, // Terminale A
  "probatoire-a": 5000,
  "bac-a": 5000,
  toefl: 5000, // preparation TOEFL (produit a part) : ajustable
  // Lycee SCIENTIFIQUE : regression jusqu'au plafond
  "seconde-c": 5500, // Seconde C (le "scientifique" du niveau seconde)
  "premiere-c": 6000,
  "premiere-d": 6000,
  "probatoire-c": 6000,
  "probatoire-d": 6000,
  "terminale-c": 7000, // top
  "terminale-d": 7000, // top
  "bac-c": 7000,
  "bac-d": 7000,
};

export const DEFAULT_PRICE = 5000; // classe inconnue : repli prudent

/** Prix enseignant (FCFA) d'un MODULE selon sa classe. */
export function modulePrice(classSlug: string): number {
  return LESSON_PRICE[classSlug] ?? DEFAULT_PRICE;
}

/** Prix inspecteur (FCFA) pour la relecture d'un module, arrondi a 50. */
export function inspectorPrice(classSlug: string): number {
  return Math.round((modulePrice(classSlug) * INSPECTOR_FACTOR) / 50) * 50;
}
