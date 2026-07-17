import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, Container, Section } from "@/components/ui";
import { SubscribeForm } from "@/components/subscriptions/SubscribeForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getClasses, getPlans, getSubjects } from "@/lib/content";
import { formatXof } from "@/lib/payments";
import { examKitCheckout } from "@/lib/subscriptions/kit-discount";

export const metadata: Metadata = { title: "S'abonner" };

export default async function SubscribePage({
  params,
}: {
  params: Promise<{ planSlug: string }>;
}) {
  const { planSlug } = await params;
  const plan = (await getPlans()).find((p) => p.slug === planSlug);
  if (!plan || plan.priceXof <= 0) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  // Options de perimetre (classe / matiere). Le primaire est gratuit : on
  // ne propose que le college et le lycee general pour les abonnements payants.
  const [{ data: profile }, allClasses, allSubjects] = await Promise.all([
    supabase.from("profiles").select("class_slug").eq("id", user.id).single(),
    getClasses(),
    getSubjects(),
  ]);
  // Le primaire est gratuit et le TOEFL a sa propre formule : on ne les
  // propose pas dans le selecteur de classe des abonnements scolaires.
  const classOpts = allClasses
    .filter(
      (c) =>
        c.track === "general" &&
        c.levelSlug !== "primaire" &&
        c.levelSlug !== "certifications",
    )
    .map((c) => ({ value: c.slug, label: c.name }));
  const subjectOpts = allSubjects.map((s) => ({ value: s.key, label: s.name }));

  // Formules d'examen (TOEFL, BAC, BEPC...) : verrouillees sur leur classe
  // dediee (slug de plan = "{classe}-annuel" sous le niveau certifications).
  const kitClass = allClasses.find(
    (c) => c.levelSlug === "certifications" && plan.slug === `${c.slug}-annuel`,
  );
  const lockedClass = kitClass?.slug ?? null;

  // Remise "abonne annuel" sur un kit d'examen (calculee cote serveur).
  const checkout = await examKitCheckout(supabase, user.id, plan);

  return (
    <Section>
      <Container className="max-w-2xl">
        <nav className="text-sm text-[var(--color-muted)]">
          <Link href="/tarifs" className="hover:text-togo-green-700">
            Abonnements
          </Link>{" "}
          / <span className="text-ink">{plan.name}</span>
        </nav>
        <h1 className="mt-2 text-3xl font-extrabold">
          S&apos;abonner : {plan.name}
        </h1>
        <p className="mt-2 text-2xl font-extrabold text-togo-green-600">
          {formatXof(checkout.priceXof)}
          {checkout.discounted && (
            <span className="ml-2 text-base font-normal text-[var(--color-muted)] line-through">
              {formatXof(checkout.listPriceXof)}
            </span>
          )}
          <span className="text-sm font-normal text-[var(--color-muted)]">
            {" "}
            / {plan.cadence}
          </span>
        </p>
        {checkout.discounted && (
          <p className="mt-2 inline-block rounded-full bg-togo-green-50 px-3 py-1 text-sm font-semibold text-togo-green-700">
            🎉 50 % offerts : votre kit d&apos;examen inclus dans l&apos;offre
            abonné annuel plateforme.
          </p>
        )}
        {checkout.isKit && !checkout.discounted && (
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Astuce : avec un abonnement annuel plateforme, votre premier kit
            d&apos;examen est à moitié prix.
          </p>
        )}

        <Card className="mt-6">
          <SubscribeForm
            planSlug={plan.slug}
            scope={plan.scope}
            classes={classOpts}
            subjects={subjectOpts}
            defaultClass={profile?.class_slug ?? null}
            lockedClass={lockedClass}
            lockedClassLabel={kitClass?.name ?? "ce parcours"}
          />
        </Card>
      </Container>
    </Section>
  );
}
