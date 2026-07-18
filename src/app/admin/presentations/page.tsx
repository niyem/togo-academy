import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container, Section } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DECKS } from "@/lib/presentations/decks";

export const metadata: Metadata = { title: "Présentations" };

export default async function PresentationsPage() {
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

  return (
    <Section>
      <Container>
        <Link href="/admin" className="text-sm text-togo-green-700 hover:underline">
          ← Administration
        </Link>
        <h1 className="mt-2 text-3xl font-extrabold">Présentations</h1>
        <p className="mt-1 max-w-2xl text-[var(--color-muted)]">
          Présentez directement depuis votre compte, plein écran, avec vos notes
          à lire. Le fichier PowerPoint reste téléchargeable si besoin.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {DECKS.map((d) => (
            <div
              key={d.slug}
              className="flex flex-col rounded-[var(--radius-card)] border border-togo-green-100 bg-togo-green-50 p-6"
            >
              <h2 className="font-display text-xl font-bold text-ink">{d.name}</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{d.audience}</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {d.slides.length} diapos
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/admin/presentations/${d.slug}`}
                  className="rounded-full bg-togo-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-togo-green-700"
                >
                  ▶ Présenter
                </Link>
                <a
                  href={`/presentations/${d.file}`}
                  download
                  className="rounded-full border border-[var(--color-line)] bg-white px-5 py-2 text-sm font-semibold hover:border-togo-green-500"
                >
                  ↓ .pptx
                </a>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
