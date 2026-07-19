import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button, Card, Container, Section } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Compte en attente d'approbation" };

// Page affichee lorsqu'un compte "en attente" (concepteur, inspecteur, tuteur
// ou parent) se connecte avant que l'administration ne l'ait approuve.
export default async function PendingAccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, access_state")
    .eq("id", user.id)
    .single();

  // Compte deja actif : rien a attendre, on renvoie au tableau de bord.
  if (!profile || profile.access_state === "active") redirect("/tableau-de-bord");

  const rejected = profile.access_state === "rejected";
  const firstName = profile.full_name?.split(" ")[0] ?? "";

  return (
    <Section>
      <Container className="max-w-xl">
        <Card className="text-center">
          <div className="text-5xl">{rejected ? "😔" : "⏳"}</div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-ink sm:text-3xl">
            {rejected
              ? "Votre demande n'a pas été retenue"
              : "Votre compte est en attente d'approbation"}
          </h1>

          {rejected ? (
            <p className="mt-3 text-[var(--color-muted)]">
              Bonjour {firstName}. Après examen, l&apos;administration n&apos;a
              pas pu valider votre demande pour le moment. Si vous pensez
              qu&apos;il s&apos;agit d&apos;une erreur, contactez-nous et nous
              reverrons votre dossier.
            </p>
          ) : (
            <div className="mt-3 space-y-3 text-[var(--color-muted)]">
              <p>
                Bonjour {firstName}. Votre compte a bien été créé. Il sera{" "}
                <strong className="text-ink">activé dès qu&apos;un
                administrateur aura approuvé votre demande</strong>.
              </p>
              <p>
                Vous recevrez alors un e-mail contenant un lien de connexion.
                Vous vous connecterez avec l&apos;adresse e-mail et le mot de
                passe que vous avez choisis lors de votre demande.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/" variant="secondary">
              Retour à l&apos;accueil
            </Button>
            <form action={signOut}>
              <Button type="submit" variant="outline">
                Se déconnecter
              </Button>
            </form>
          </div>
        </Card>
      </Container>
    </Section>
  );
}
