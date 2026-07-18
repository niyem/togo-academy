// Les 8 etapes de la chaine de production, dans l'ordre, avec libelle et ton de
// badge. Partage entre la page serveur et le tableau client.

export type Stage =
  | "a_produire"
  | "brouillon"
  | "en_relecture"
  | "a_corriger"
  | "valide"
  | "en_production"
  | "verification"
  | "en_ligne";

export type BadgeTone = "green" | "yellow" | "red" | "neutral";

export const STAGES: { key: Stage; label: string; tone: BadgeTone }[] = [
  { key: "a_produire", label: "À produire", tone: "neutral" },
  { key: "brouillon", label: "Brouillon (enseignant)", tone: "yellow" },
  { key: "en_relecture", label: "En relecture (inspecteur)", tone: "yellow" },
  { key: "a_corriger", label: "À corriger", tone: "red" },
  { key: "valide", label: "Validé (inspecteur)", tone: "green" },
  { key: "en_production", label: "En production", tone: "yellow" },
  { key: "verification", label: "Vérification finale", tone: "yellow" },
  { key: "en_ligne", label: "En ligne", tone: "green" },
];

export const STAGE_LABEL: Record<Stage, string> = Object.fromEntries(
  STAGES.map((s) => [s.key, s.label]),
) as Record<Stage, string>;

export const STAGE_TONE: Record<Stage, BadgeTone> = Object.fromEntries(
  STAGES.map((s) => [s.key, s.tone]),
) as Record<Stage, BadgeTone>;

// Colonne d'horodatage stampee quand on entre dans l'etape (a_produire = created_at).
export const STAGE_TIMESTAMP: Partial<Record<Stage, string>> = {
  brouillon: "at_brouillon",
  en_relecture: "at_en_relecture",
  a_corriger: "at_a_corriger",
  valide: "at_valide",
  en_production: "at_en_production",
  verification: "at_verification",
  en_ligne: "at_en_ligne",
};

export function nextStage(current: Stage): Stage | null {
  const i = STAGES.findIndex((s) => s.key === current);
  return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1].key : null;
}
