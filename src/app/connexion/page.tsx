"use client";

// Connexion : carte centree, ton editorial, branchee sur la vraie action.

import { useActionState } from "react";
import Link from "next/link";
import { Button, Container } from "@/components/ui";
import { signIn, type AuthState } from "@/lib/auth/actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signIn,
    {},
  );

  return (
    <Container className="max-w-md pb-24 pt-16 sm:pt-20">
      <div className="rounded-2xl border border-togo-green-100 bg-togo-green-50 p-8 sm:p-10">
        <h1 className="font-display text-3xl tracking-tight text-ink">
          Content de vous revoir.
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Connectez-vous pour reprendre vos leçons.
        </p>

        <form action={action} className="mt-7 grid gap-5">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Adresse e-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="vous@exemple.com"
              className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3.5 py-2.5 text-ink outline-none transition-colors focus:border-togo-green-500"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Votre mot de passe"
              className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3.5 py-2.5 text-ink outline-none transition-colors focus:border-togo-green-500"
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

        <p className="mt-5 text-center text-sm text-[var(--color-muted)]">
          Pas encore de compte ?{" "}
          <Link
            href="/inscription"
            className="font-semibold text-togo-green-700 hover:underline"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </Container>
  );
}
