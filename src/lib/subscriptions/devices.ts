import "server-only";

// Limite d'appareils simultanes par abonnement (anti-partage de compte).
// Regle : un appareil "actif" est un appareil vu dans la fenetre glissante.
// Un nouvel appareil est refuse tant que la limite d'actifs est atteinte;
// les appareils connus continuent de fonctionner. Un appareil inactif
// libere sa place tout seul a la fin de la fenetre : rien a nettoyer.

import { cookies, headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const DEVICE_LIMIT = 2;
export const DEVICE_WINDOW_MINUTES = 15;

export const DEVICE_COOKIE = "ta_device";

export type DeviceCheck = {
  allowed: boolean;
  activeCount: number;
};

/**
 * Enregistre l'appareil courant et verifie la limite d'appareils actifs.
 * Ne s'applique qu'aux abonnes (le contenu gratuit n'est jamais limite).
 * En cas de doute (pas de cookie, pas de client admin), on laisse passer :
 * la limite est une protection, pas un piege.
 */
export async function checkDeviceLimit(userId: string): Promise<DeviceCheck> {
  const admin = createSupabaseAdminClient();
  if (!admin) return { allowed: true, activeCount: 0 };

  const store = await cookies();
  const deviceId = store.get(DEVICE_COOKIE)?.value;
  // UUID pose par le middleware; absent sur la toute premiere requete.
  if (!deviceId || !/^[0-9a-f-]{36}$/i.test(deviceId)) {
    return { allowed: true, activeCount: 0 };
  }

  const since = new Date(
    Date.now() - DEVICE_WINDOW_MINUTES * 60 * 1000,
  ).toISOString();
  const { data } = await admin
    .from("account_devices")
    .select("device_id")
    .eq("user_id", userId)
    .gt("last_seen", since);
  const actives = data ?? [];
  const isKnown = actives.some((d) => d.device_id === deviceId);

  if (!isKnown && actives.length >= DEVICE_LIMIT) {
    return { allowed: false, activeCount: actives.length };
  }

  const ua = (await headers()).get("user-agent")?.slice(0, 200) ?? null;
  await admin.from("account_devices").upsert(
    {
      user_id: userId,
      device_id: deviceId,
      user_agent: ua,
      last_seen: new Date().toISOString(),
    },
    { onConflict: "user_id,device_id" },
  );
  return { allowed: true, activeCount: isKnown ? actives.length : actives.length + 1 };
}
