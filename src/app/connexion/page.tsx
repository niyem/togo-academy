"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Card, Container, Section } from "@/components/ui";
import { signIn, type AuthState } from "@/lib/auth/actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signIn,
    {},
  );

  return (
    <Section>
      <Container className="max-w-md">
        <h1 className="text-3xl font-extrabold">Connexion</h1>
        <p className="mt-2 text-[var(--color-muted)]">
          Accédez à vos cours et à votre progression.
        </p>

        <Card className="mt-6">
          <form action={action} className="grid gap-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-semibold">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 focus:border-togo-green-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-semibold">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 focus:border-togo-green-500"
              />
            </div>

            {state.error && (
              <p className="rounded-lg bg-togo-red-100 px-3 py-2 text-sm text-togo-red-700">
                {state.error}
              </p>
            )}

            <Button type="submit" className="w-full">
              {pending ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-[var(--color-muted)]">
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="font-semibold text-togo-green-700">
              S&apos;inscrire
            </Link>
          </p>
        </Card>
      </Container>
    </Section>
  );
}
