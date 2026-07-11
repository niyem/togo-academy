import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, Container, Section } from "@/components/ui";
import { SubscribeForm } from "@/components/subscriptions/SubscribeForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPlans } from "@/lib/content";
import { formatXof } from "@/lib/payments";

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
          {formatXof(plan.priceXof)}
          <span className="text-sm font-normal text-[var(--color-muted)]">
            {" "}
            / {plan.cadence}
          </span>
        </p>

        <Card className="mt-6">
          <SubscribeForm planSlug={plan.slug} />
        </Card>
      </Container>
    </Section>
  );
}
