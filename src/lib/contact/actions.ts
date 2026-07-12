"use server";

// Formulaire de contact : insertion publique (RLS "contact insert public"),
// traitement reserve aux admins (RLS is_admin()). Pas de dependance email :
// les messages arrivent dans la file de /admin, comme les paiements.

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ContactState = { error?: string; ok?: boolean };

const TOPICS = new Set([
  "question",
  "abonnement",
  "tuteur",
  "technique",
  "partenariat",
  "autre",
]);

export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Champ piege anti-robots : invisible pour les humains ; s'il est rempli,
  // on repond "ok" sans rien enregistrer.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { ok: true };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const topicRaw = String(formData.get("topic") ?? "question");
  const message = String(formData.get("message") ?? "").trim();

  if (!name || name.length > 120) return { error: "Indiquez votre nom." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return { error: "Indiquez une adresse e-mail valide." };
  }
  if (phone.length > 40) return { error: "Numéro de téléphone trop long." };
  if (message.length < 10) {
    return { error: "Votre message est trop court (10 caractères minimum)." };
  }
  if (message.length > 4000) {
    return { error: "Votre message est trop long (4000 caractères maximum)." };
  }
  const topic = TOPICS.has(topicRaw) ? topicRaw : "question";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("contact_messages").insert({
    name,
    email,
    phone: phone || null,
    topic,
    message,
    user_id: user?.id ?? null,
  });
  if (error) {
    return { error: "Une erreur est survenue. Réessayez dans un instant." };
  }
  return { ok: true };
}

export async function markContactHandled(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Réservé à l'administration." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { error: "Réservé à l'administration." };

  const id = String(formData.get("message_id") ?? "");
  if (!id) return { error: "Message manquant." };
  const { error } = await supabase
    .from("contact_messages")
    .update({ status: "traite", handled_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Erreur." };
  revalidatePath("/admin");
  return { ok: true };
}
