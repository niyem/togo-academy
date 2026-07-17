// Kits d'examen : options payantes (niveau "certifications"). Un abonne annuel
// plateforme peut en ajouter UN seul a moitie prix. La remise est calculee ici,
// utilisee a la fois pour l'affichage (page abonnement) et pour le montant
// reellement enregistre (action subscribe) afin qu'elle ne soit pas falsifiable
// cote client.

import { getClasses } from "@/lib/content";
import type { SubscriptionPlan } from "@/lib/content/types";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type KitCheckout = {
  isKit: boolean;
  discounted: boolean;
  listPriceXof: number;
  priceXof: number;
};

export async function examKitCheckout(
  supabase: ServerClient,
  userId: string,
  plan: SubscriptionPlan,
): Promise<KitCheckout> {
  const base: KitCheckout = {
    isKit: false,
    discounted: false,
    listPriceXof: plan.priceXof,
    priceXof: plan.priceXof,
  };
  // Seuls les plans "{classe}-annuel" de portee classe peuvent etre des kits.
  if (plan.scope !== "classe" || !plan.slug.endsWith("-annuel")) return base;

  const classes = await getClasses();
  const certSlugs = classes
    .filter((c) => c.levelSlug === "certifications")
    .map((c) => c.slug);
  const kitSlug = plan.slug.slice(0, -"-annuel".length);
  if (!certSlugs.includes(kitSlug)) return base;

  const kit: KitCheckout = { ...base, isKit: true };

  // Eligibilite a la remise : abonnement annuel plateforme (actif ou en
  // attente de verification) ET aucun kit d'examen deja pris (l'offre porte
  // sur UN seul examen).
  const { data: platform } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("plan_slug", "annuel-plateforme")
    .in("status", ["active", "pending"])
    .limit(1);
  if (!platform || platform.length === 0) return kit;

  const { data: existingKits } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .in("status", ["active", "pending"])
    .in("class_slug", certSlugs);
  if (existingKits && existingKits.length > 0) return kit;

  return {
    isKit: true,
    discounted: true,
    listPriceXof: plan.priceXof,
    priceXof: Math.round(plan.priceXof / 2),
  };
}
