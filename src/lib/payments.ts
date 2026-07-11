// Moyens de paiement : identiques a la plateforme de traduction GBM
// (src/lib/payments.ts). Flux manuel : l'utilisateur paie, envoie une
// reference/preuve, l'administration verifie et active l'abonnement.

export type PaymentMethodId = "flooz" | "orabank" | "zelle" | "wells";

export interface PaymentMethod {
  id: PaymentMethodId;
  where: string; // contexte ("Au Togo", ...)
  label: string; // nom du moyen
  details: string[]; // instructions affichees ligne par ligne
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "flooz",
    where: "Au Togo",
    label: "Flooz",
    details: ["+228 79 93 49 48"],
  },
  {
    id: "orabank",
    where: "Virement bancaire (FCFA)",
    label: "Orabank Togo",
    details: [
      "Orabank Togo, Lomé",
      "Titulaire : BAWANA NIYEM MAWENBE",
      "Banque TG116 · Agence 01001 · Compte 067768100101 · Clé 50",
      "IBAN : TG53TG1160100106776810010150",
      "BIC : ORBKTGTG",
    ],
  },
  {
    id: "zelle",
    where: "Aux États-Unis",
    label: "Zelle",
    details: ["+1 813 327 2419", "NIYEM MAWENBE BAWANA"],
  },
  {
    id: "wells",
    where: "Virement international (USD)",
    label: "Wells Fargo",
    details: [
      "Wells Fargo Bank",
      "Titulaire : NIYEM MAWENBE BAWANA",
      "Compte : 8434296375",
      "Routing (RTN) : 107002192",
    ],
  },
];

export function formatXof(n: number): string {
  return `${n.toLocaleString("fr-FR")} FCFA`;
}
