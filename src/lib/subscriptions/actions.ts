"use server";

// Souscription : cree la demande (pending) + la trace de paiement (pending).
// L'administration verifie le paiement puis active l'abonnement.

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPlans } from "@/lib/content";
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

  const plan = (await getPlans()).find((p) => p.slug === planSlug);
  if (!plan || plan.priceXof <= 0) return { error: "Formule inconnue." };
  if (!METHOD_IDS.includes(method)) {
    return { error: "Choisissez un moyen de paiement." };
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

  const { data: sub, error: subError } = await supabase
    .from("subscriptions")
    .insert({ user_id: user.id, plan_slug: plan.slug, status: "pending" })
    .select("id")
    .single();
  if (subError || !sub) return { error: "Erreur lors de la demande. Réessayez." };

  const { error: payError } = await supabase.from("payments").insert({
    user_id: user.id,
    subscription_id: sub.id,
    method,
    status: "pending",
    amount_xof: plan.priceXof,
    reference,
  });
  if (payError) return { error: "Erreur lors de l'enregistrement du paiement." };

  revalidatePath("/tableau-de-bord");
  return { submitted: true };
}
