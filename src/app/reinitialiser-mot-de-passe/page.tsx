"use client";

// Nouveau mot de passe. L'utilisateur arrive ici depuis le lien e-mail, apres
// que /auth/callback a ouvert sa session de recuperation.

import { useActionState } from "react";
import Link from "next/link";
import { Button, Container } from "@/components/ui";
import { updatePassword, type UpdatePwState } from "@/lib/auth/actions";

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState<UpdatePwState, FormData>(
    updatePassword,
    {},
  );

  return (
    <Container className="max-w-md pb-24 pt-16 sm:pt-20">
      <div className="rounded-2xl border border-togo-green-100 bg-togo-green-50 p-8 sm:p-10">
        <h1 className="font-display text-3xl tracking-tight text-ink">
          Nouveau mot de passe
        </h1>

        {state.done ? (
          <div className="mt-7 rounded-lg bg-white px-4 py-4 text-sm">
            <p className="font-semibold text-togo-green-700">
              Mot de passe mis à jour.
            </p>
            <p className="mt-1 text-[var(--color-muted)]">
              Vous pouvez maintenant vous connecter avec votre nouveau mot de
              passe.
            </p>
            <Button href="/connexion" className="mt-4 w-full">
              Se connecter
            </Button>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Choisissez un mot de passe d&apos;au moins 8 caractères.
            </p>
            <form action={action} className="mt-7 grid gap-5">
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-ink"
                >
                  Nouveau mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Au moins 8 caractères"
                  className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3.5 py-2.5 text-ink outline-none transition-colors focus:border-togo-green-500"
                />
              </div>
              <div>
                <label
                  htmlFor="confirm"
                  className="mb-1.5 block text-sm font-medium text-ink"
                >
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Retapez le mot de passe"
                  className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3.5 py-2.5 text-ink outline-none transition-colors focus:border-togo-green-500"
                />
              </div>

              {state.error && (
                <p className="rounded-lg bg-togo-red-100 px-3 py-2 text-sm text-togo-red-700">
                  {state.error}
                </p>
              )}

              <Button type="submit" className="w-full">
                {pending ? "Enregistrement..." : "Enregistrer le mot de passe"}
              </Button>
            </form>
            <p className="mt-5 text-center text-sm text-[var(--color-muted)]">
              <Link
                href="/mot-de-passe-oublie"
                className="font-semibold text-togo-green-700 hover:underline"
              >
                Renvoyer un lien
              </Link>
            </p>
          </>
        )}
      </div>
    </Container>
  );
}
