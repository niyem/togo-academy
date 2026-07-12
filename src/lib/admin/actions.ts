"use server";

// Actions d'administration. La RLS ("admin writes subscription/payment",
// is_admin()) reste la barriere reelle ; le role est verifie ici aussi.

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminState = { error?: string; ok?: boolean };

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, admin: false };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return { supabase, admin: profile?.role === "admin" };
}

const MONTHS: Record<string, number> = {
  monthly: 1,
  termly: 3,
  annual: 12,
};

export async function activateSubscription(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const { supabase, admin } = await requireAdmin();
  if (!admin) return { error: "Réservé à l'administration." };

  const subscriptionId = String(formData.get("subscription_id") ?? "");
  if (!subscriptionId) return { error: "Souscription manquante." };

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("id, plan_slug, plans(cadence)")
    .eq("id", subscriptionId)
    .limit(1);
  const sub = subs?.[0];
  if (!sub) return { error: "Souscription introuvable." };

  const cadence =
    (sub.plans as unknown as { cadence: string } | null)?.cadence ?? "monthly";
  const months = MONTHS[cadence] ?? 1;
  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const { error: e1 } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      period_start: iso(start),
      period_end: iso(end),
    })
    .eq("id", subscriptionId);
  if (e1) return { error: "Erreur d'activation." };

  await supabase
    .from("payments")
    .update({ status: "confirmed" })
    .eq("subscription_id", subscriptionId)
    .eq("status", "pending");

  revalidatePath("/admin");
  return { ok: true };
}

export async function rejectSubscription(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const { supabase, admin } = await requireAdmin();
  if (!admin) return { error: "Réservé à l'administration." };

  const subscriptionId = String(formData.get("subscription_id") ?? "");
  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("id", subscriptionId);
  if (error) return { error: "Erreur." };
  await supabase
    .from("payments")
    .update({ status: "failed" })
    .eq("subscription_id", subscriptionId)
    .eq("status", "pending");
  revalidatePath("/admin");
  return { ok: true };
}
