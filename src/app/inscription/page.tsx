"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button, Card, Container, Section } from "@/components/ui";
import { signUp, type AuthState } from "@/lib/auth/actions";

type Role = "eleve" | "parent";

const CLASSES = [
  ["", "Choisir plus tard"], ["cp1", "CP1"], ["cp2", "CP2"], ["ce1", "CE1"],
  ["ce2", "CE2"], ["cm1", "CM1"], ["cm2", "CM2"], ["6eme", "6ème"],
  ["5eme", "5ème"], ["4eme", "4ème"], ["3eme", "3ème"],
  ["seconde", "Seconde"], ["premiere", "Première"], ["terminale", "Terminale"],
];

export default function RegisterPage() {
  const [role, setRole] = useState<Role>("eleve");
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signUp,
    {},
  );

  return (
    <Section>
      <Container className="max-w-md">
        <h1 className="text-3xl font-extrabold">Créer un compte</h1>
        <p className="mt-2 text-[var(--color-muted)]">
          Gratuit. Commence par une leçon d&apos;essai.
        </p>

        <Card className="mt-6">
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-full bg-togo-green-50 p-1">
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

          <form action={action} className="grid gap-4">
            <input
              type="hidden"
              name="role"
              value={role === "parent" ? "parent" : "student"}
            />
            <Input label="Nom complet" name="name" required />
            <Input label="Email" name="email" type="email" required />
            <Input label="Téléphone (optionnel)" name="phone" placeholder="+228 ..." />
            {role === "eleve" && (
              <div>
                <label htmlFor="class_slug" className="mb-1 block text-sm font-semibold">
                  Classe
                </label>
                <select
                  id="class_slug"
                  name="class_slug"
                  className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2"
                >
                  {CLASSES.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Input label="Mot de passe (8 caractères min.)" name="password" type="password" required />

            {state.error && (
              <p className="rounded-lg bg-togo-red-100 px-3 py-2 text-sm text-togo-red-700">
                {state.error}
              </p>
            )}

            <Button type="submit" className="w-full">
              {pending
                ? "Création..."
                : `Créer mon compte ${role === "parent" ? "parent" : "élève"}`}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-[var(--color-muted)]">
            Déjà inscrit ?{" "}
            <Link href="/connexion" className="font-semibold text-togo-green-700">
              Se connecter
            </Link>
          </p>
        </Card>
      </Container>
    </Section>
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
      <label htmlFor={name} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 focus:border-togo-green-500"
      />
    </div>
  );
}
