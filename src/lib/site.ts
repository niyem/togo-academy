import { headers } from "next/headers";

// Origine du site (https://academie.groupebm.net en prod), deduite de la requete.
export async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "academie.groupebm.net";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}
