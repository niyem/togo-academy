// Quotas journaliers d'usage IA : protegent le credit API Anthropic.
// Le tuteur et le chatbot sont plafonnes pour tout le monde sauf les
// administrateurs. Compteurs en base (table ai_usage, fonction atomique
// consume_ai_quota), remis a zero chaque jour par construction (cle = jour).

import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const TUTOR_DAILY_LIMIT = 10;
export const CHAT_DAILY_LIMIT = 10;

export const TUTOR_LIMIT_MESSAGE =
  "Tu as atteint ta limite de 10 questions au tuteur pour aujourd'hui. " +
  "Prends le temps de revoir la leçon et les quiz, et reviens demain : " +
  "le compteur repart à zéro chaque jour. 😊";

export const CHAT_LIMIT_MESSAGE =
  "Tu as atteint la limite de messages pour aujourd'hui. " +
  "Consulte la FAQ (/faq) ou écris-nous via /contact : l'équipe répond " +
  "sous 24 h. À demain !";

/**
 * Incremente le compteur du jour pour `identity` et dit si l'appel est
 * encore autorise. En cas de probleme technique (base injoignable), on
 * laisse passer : le quota protege le credit, il ne doit pas casser le
 * service.
 */
export async function consumeQuota(
  identity: string,
  kind: "tuteur" | "chat",
  limit: number,
): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (!admin) return true;
  const { data, error } = await admin.rpc("consume_ai_quota", {
    p_identity: identity,
    p_kind: kind,
    p_limit: limit,
  });
  if (error) return true;
  return data === true;
}

/** Identite anonyme stable pour la journee : premiere adresse IP connue. */
export function clientIdentity(req: Request, userId?: string): string {
  if (userId) return `user:${userId}`;
  const fwd = req.headers.get("x-forwarded-for");
  const ip = (fwd ? fwd.split(",")[0] : req.headers.get("x-real-ip")) ?? "inconnu";
  return `ip:${ip.trim()}`;
}
