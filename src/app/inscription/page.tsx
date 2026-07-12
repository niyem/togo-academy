"use client";

// Inscription : deux colonnes (formulaire + panneau sombre "inclus des
// l'inscription"), branchee sur la vraie action signUp. Le choix de role
// eleve/parent est conserve (absent de la maquette, requis par la plateforme).

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button, Container } from "@/components/ui";
import { signUp, type AuthState } from "@/lib/auth/actions";

type Role = "eleve" | "parent";

const CLASSES = [
  ["", "Choisir plus tard"], ["cp1", "CP1"], ["cp2", "CP2"], ["ce1", "CE1"],
  ["ce2", "CE2"], ["cm1", "CM1"], ["cm2", "CM2"], ["6eme", "6ème"],
  ["5eme", "5ème"], ["4eme", "4ème"], ["3eme", "3ème"],
  ["seconde", "Seconde"], ["premiere", "Première"], ["terminale", "Terminale"],
];

const PERKS = [
  "Accès immédiat aux leçons d'essai gratuites",
  "Quiz corrigés immédiatement et tuteur IA",
  "Reprise de la lecture là où vous vous arrêtez",
  "Aucune carte bancaire requise",
];

export default function RegisterPage() {
  const [role, setRole] = useState<Role>("eleve");
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signUp,
    {},
  );

  return (
    <Container className="pb-20 pt-12 sm:pt-14">
      <div className="grid items-stretch gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Formulaire */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-8 sm:p-10">
          <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
            Créez votre compte.
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Gratuit, sans carte bancaire. Accédez aux leçons gratuites en une
            minute.
          </p>

          <div className="mb-6 mt-6 grid grid-cols-2 gap-2 rounded-full bg-togo-green-50 p-1">
            {(["eleve", "parent"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-full py-2 text-sm font-semibold transition-colors ${
                  role === r
                    ? "bg-togo-green-600 text-white"
                    : "text-togo-green-700"
                }`}
              >
                {r === "eleve" ? "Je suis élève" : "Je suis parent"}
              </button>
            ))}
          </div>

          <form action={action} className="grid gap-5">
            <input
              type="hidden"
              name="role"
              value={role === "parent" ? "parent" : "student"}
            />
            <Input label="Nom complet" name="name" placeholder="Kossi Mensah" required />
            <Input
              label="Adresse e-mail"
              name="email"
              type="email"
              placeholder="vous@exemple.com"
              required
            />
            <Input
              label="Téléphone (optionnel)"
              name="phone"
              placeholder="+228 ..."
            />
            {role === "eleve" && (
              <div>
                <label
                  htmlFor="class_slug"
                  className="mb-1.5 block text-sm font-medium text-ink"
                >
                  Classe
                </label>
                <select
                  id="class_slug"
                  name="class_slug"
                  className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3.5 py-2.5 text-ink outline-none focus:border-togo-green-500"
                >
                  {CLASSES.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Input
              label="Mot de passe"
              name="password"
              type="password"
              placeholder="Au moins 8 caractères"
              required
            />

            {state.error && (
              <p className="rounded-lg bg-togo-red-100 px-3 py-2 text-sm text-togo-red-700">
                {state.error}
              </p>
            )}

            <Button type="submit" className="mt-1 w-full">
              {pending
                ? "Création..."
                : `Créer mon compte ${role === "parent" ? "parent" : "élève"}`}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-[var(--color-muted)]">
            Déjà inscrit ?{" "}
            <Link
              href="/connexion"
              className="font-semibold text-togo-green-700 hover:underline"
            >
              Connexion
            </Link>
          </p>
        </div>

        {/* Panneau sombre : inclus dès l'inscription */}
        <div className="flex flex-col justify-center rounded-2xl bg-ink p-8 text-[var(--color-on-dark)] sm:p-10">
          <div className="mb-6 text-xs font-semibold uppercase tracking-[0.15em] text-togo-yellow-400">
            Inclus dès l&apos;inscription
          </div>
          <div className="flex flex-col gap-5">
            {PERKS.map((p) => (
              <div key={p} className="flex items-start gap-3">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 flex-none text-togo-yellow-400"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span className="text-base">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}

function Input({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-sm font-medium text-ink"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3.5 py-2.5 text-ink outline-none transition-colors focus:border-togo-green-500"
      />
    </div>
  );
}
