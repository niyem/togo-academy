import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Container, Section } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DeckPresenter } from "@/components/admin/DeckPresenter";
import { getDeck } from "@/lib/presentations/decks";

export const metadata: Metadata = { title: "Mode présentateur" };

export default async function PresenterPage({
  params,
}: {
  params: Promise<{ deckSlug: string }>;
}) {
  const { deckSlug } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/tableau-de-bord");

  const deck = getDeck(deckSlug);
  if (!deck) notFound();

  return (
    <Section>
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/presentations"
            className="text-sm text-togo-green-700 hover:underline"
          >
            ← Présentations
          </Link>
          <a
            href={`/presentations/${deck.file}`}
            download
            className="text-sm font-semibold text-togo-green-700 hover:underline"
          >
            ↓ Télécharger le .pptx
          </a>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold">{deck.name}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Flèches ← → ou clic pour naviguer · touche F plein écran · touche N
          pour les notes.
        </p>
        <div className="mt-5">
          <DeckPresenter
            slug={deck.slug}
            notes={deck.slides.map((s) => s.notes)}
            deckName={deck.name}
          />
        </div>
      </Container>
    </Section>
  );
}
