"use server";

// Actions serveur du compte parent.

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LinkState = { error?: string; linkedName?: string };

export async function linkStudent(
  _prev: LinkState,
  formData: FormData,
): Promise<LinkState> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "Entrez le code de liaison de votre enfant." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("link_student_by_code", { code });

  if (error) return { error: "Une erreur est survenue. Réessayez." };
  if (!data?.ok) {
    return {
      error:
        data?.error === "not_parent"
          ? "Seul un compte parent peut relier un élève."
          : "Code invalide. Vérifiez le code affiché sur le tableau de bord de votre enfant.",
    };
  }
  revalidatePath("/tableau-de-bord");
  return { linkedName: data.student_name as string };
}
