// Mention de confidentialite et de propriete, affichee partout dans l'espace
// collaboratif. Le contenu produit est destine a Togo Academy et devient sa
// propriete, conformement aux contrats conclus avec les contributeurs.

export const CONFIDENTIAL_NOTICE =
  "Contenu confidentiel réalisé pour Togo Academy. Ce contenu et ses différentes versions sont la propriété de Togo Academy. Toute reproduction, diffusion, modification ou utilisation non autorisée est interdite.";

export const IP_TRANSFER_TERMS =
  "En participant, j'accepte que les documents, cours, illustrations, vidéos et autres contenus que je réalise dans le cadre de cette mission soient destinés à Togo Academy et deviennent sa propriété. Je cède à Togo Academy les droits patrimoniaux nécessaires à leur exploitation, modification, reproduction, diffusion et commercialisation, conformément au contrat conclu.";

export function ConfidentialNotice({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-togo-yellow-400/60 bg-togo-yellow-100 px-4 py-3 text-sm text-ink ${className}`}
    >
      <span className="mr-1" aria-hidden>
        🔒
      </span>
      {CONFIDENTIAL_NOTICE}
    </div>
  );
}
