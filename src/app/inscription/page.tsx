"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Container, Section } from "@/components/ui";

type Role = "eleve" | "parent";

export default function RegisterPage() {
  const [role, setRole] = useState<Role>("eleve");

  return (
    <Section>
      <Container className="max-w-md">
        <h1 className="text-3xl font-extrabold">Créer un compte</h1>
        <p className="mt-2 text-[var(--color-muted)]">
          Gratuit. Commence par une leçon d&apos;essai.
        </p>

        <Card className="mt-6">
          {/* Role selector */}
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

          {/* Phase 1: submit to a server action -> Supabase Auth (email + phone OTP). */}
          <form className="grid gap-4">
            <Input label="Nom complet" name="name" />
            <Input label="Téléphone" name="phone" placeholder="+228 ..." />
            <Input label="Email (optionnel)" name="email" type="email" />
            {role === "eleve" && (
              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Classe
                </label>
                <select className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2">
                  <option>3ème</option>
                  <option>Terminale</option>
                  <option>Autre…</option>
                </select>
              </div>
            )}
            <Input label="Mot de passe" name="password" type="password" />
            <Button type="submit" className="w-full">
              Créer mon compte {role === "parent" ? "parent" : "élève"}
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
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
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
        className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 focus:border-togo-green-500"
      />
    </div>
  );
}
