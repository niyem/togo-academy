"use server";

// Souscription : cree la demande (pending) + la trace de paiement (pending).
// L'administration verifie le paiement puis active l'abonnement.

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPlans } from "@/lib/content";
import { examKitCheckout } from "@/lib/subscriptions/kit-discount";
import type { PaymentMethodId } from "@/lib/payments";

const METHOD_IDS: PaymentMethodId[] = ["flooz", "orabank", "zelle", "wells"];

export type SubscribeState = { error?: string; submitted?: boolean };

export async function subscribe(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  const planSlug = String(formData.get("plan") ?? "");
  const method = String(formData.get("method") ?? "") as PaymentMethodId;
  const reference = String(formData.get("reference") ?? "").trim();
  const classSlug = String(formData.get("class") ?? "").trim() || null;
  const subjectKey = String(formData.get("subject") ?? "").trim() || null;

  const plan = (await getPlans()).find((p) => p.slug === planSlug);
  if (!plan || plan.priceXof <= 0) return { error: "Formule inconnue." };
  if (!METHOD_IDS.includes(method)) {
    return { error: "Choisissez un moyen de paiement." };
  }

  // Perimetre de l'abonnement (voir has_lesson_access) :
  //   matiere  -> une (classe, matiere) ; classe -> une classe ; plateforme -> tout.
  if (plan.scope === "classe" && !classSlug) {
    return { error: "Choisissez la classe concernée." };
  }
  if (plan.scope === "matiere" && (!classSlug || !subjectKey)) {
    return { error: "Choisissez la classe et la matière." };
  }
  const targetClass = plan.scope === "plateforme" ? null : classSlug;
  const targetSubject = plan.scope === "matiere" ? subjectKey : null;

  // Les examens (TOEFL, BAC, BEPC...) ne sont accessibles que via LEUR formule
  // annuelle dediee ("{classe}-annuel"), jamais via un abonnement scolaire.
  if (targetClass) {
    const dedicated = `${targetClass}-annuel`;
    const hasDedicated = (await getPlans()).some((p) => p.slug === dedicated);
    if (hasDedicated && plan.slug !== dedicated) {
      return { error: "Cet examen a sa propre formule annuelle dédiée." };
    }
  }
  if (!reference) {
    return {
      error:
        "Indiquez la référence de votre paiement (numéro de transaction, nom de l'expéditeur...).",
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connectez-vous pour vous abonner." };

  // Remise "abonne annuel" sur un kit d'examen : montant reel a facturer.
  // Calcule AVANT l'insertion (sinon le kit en cours compterait comme deja pris).
  const checkout = await examKitCheckout(supabase, user.id, plan);

  const { data: sub, error: subError } = await supabase
    .from("subscriptions")
    .insert({
      user_id: user.id,
      plan_slug: plan.slug,
      status: "pending",
      class_slug: targetClass,
      subject_key: targetSubject,
    })
    .select("id")
    .single();
  if (subError || !sub) return { error: "Erreur lors de la demande. Réessayez." };

  const { error: payError } = await supabase.from("payments").insert({
    user_id: user.id,
    subscription_id: sub.id,
    method,
    status: "pending",
    amount_xof: checkout.priceXof,
    reference,
  });
  if (payError) return { error: "Erreur lors de l'enregistrement du paiement." };

  revalidatePath("/tableau-de-bord");
  return { submitted: true };
}
