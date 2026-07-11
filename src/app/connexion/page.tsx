import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card, Container, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <Section>
      <Container className="max-w-md">
        <h1 className="text-3xl font-extrabold">Connexion</h1>
        <p className="mt-2 text-[var(--color-muted)]">
          Accédez à vos cours et à votre progression.
        </p>

        <Card className="mt-6">
          {/* Phase 1: submit to a server action -> Supabase Auth. */}
          <form className="grid gap-4">
            <div>
              <label htmlFor="id" className="mb-1 block text-sm font-semibold">
                Téléphone ou email
              </label>
              <input
                id="id"
                name="id"
                className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 focus:border-togo-green-500"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-semibold"
              >
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 focus:border-togo-green-500"
              />
            </div>
            <Button type="submit" className="w-full">
              Se connecter
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-[var(--color-muted)]">
            Pas encore de compte ?{" "}
            <Link
              href="/inscription"
              className="font-semibold text-togo-green-700"
            >
              S&apos;inscrire
            </Link>
          </p>
        </Card>
      </Container>
    </Section>
  );
}
