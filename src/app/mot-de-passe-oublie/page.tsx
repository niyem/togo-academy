"use client";

// Demande de reinitialisation : l'utilisateur saisit son e-mail, on lui envoie
// un lien. Fonctionne pour tous les roles (eleve, parent, enseignant, admin).

import { useActionState } from "react";
import Link from "next/link";
import { Button, Container } from "@/components/ui";
import { requestPasswordReset, type ResetState } from "@/lib/auth/actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<ResetState, FormData>(
    requestPasswordReset,
    {},
  );

  return (
    <Container className="max-w-md pb-24 pt-16 sm:pt-20">
      <div className="rounded-2xl border border-togo-green-100 bg-togo-green-50 p-8 sm:p-10">
        <h1 className="font-display text-3xl tracking-tight text-ink">
          Mot de passe oublié
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Entrez l&apos;adresse e-mail de votre compte. Nous vous enverrons un
          lien pour choisir un nouveau mot de passe.
        </p>

        {state.sent ? (
          <div className="mt-7 rounded-lg bg-white px-4 py-4 text-sm text-ink">
            <p className="font-semibold text-togo-green-700">
              E-mail envoyé (si un compte existe).
            </p>
            <p className="mt-1 text-[var(--color-muted)]">
              Ouvrez le lien reçu pour définir votre nouveau mot de passe.
              Pensez à vérifier vos courriers indésirables. Le lien expire au
              bout d&apos;une heure.
            </p>
          </div>
        ) : (
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

            {state.error && (
              <p className="rounded-lg bg-togo-red-100 px-3 py-2 text-sm text-togo-red-700">
                {state.error}
              </p>
            )}

            <Button type="submit" className="w-full">
              {pending ? "Envoi..." : "Envoyer le lien"}
            </Button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-[var(--color-muted)]">
          <Link
            href="/connexion"
            className="font-semibold text-togo-green-700 hover:underline"
          >
            Retour à la connexion
          </Link>
        </p>
      </div>
    </Container>
  );
}
