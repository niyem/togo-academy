"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { applyAsParent, type ParentApplyState } from "@/lib/parent/actions";

// Demande de compte parent : le parent saisit ses coordonnees + l'identifiant
// unique de son enfant (TG-XXXXXX). Le compte est cree "en attente" ; il sera
// activable seulement apres approbation de l'administration.
export function ParentApplyForm() {
  const [state, action, pending] = useActionState<ParentApplyState, FormData>(
    applyAsParent,
    {},
  );

  return (
    <form action={action} className="grid gap-5">
      <Field label="Nom complet" name="name" placeholder="Ama Koffi" required />
      <Field
        label="Adresse e-mail"
        name="email"
        type="email"
        placeholder="vous@exemple.com"
        required
      />
      <Field label="Téléphone (optionnel)" name="phone" placeholder="+228 ..." />
      <div>
        <label htmlFor="child_code" className="mb-1.5 block text-sm font-medium text-ink">
          Identifiant unique de l&apos;enfant
        </label>
        <input
          id="child_code"
          name="child_code"
          placeholder="TG-XXXXXX"
          required
          className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3.5 py-2.5 font-mono uppercase text-ink outline-none focus:border-togo-green-500"
        />
        <p className="mt-1.5 text-xs text-[var(--color-muted)]">
          Ce code s&apos;affiche sur le tableau de bord de votre enfant, dans
          l&apos;encadré « Code de liaison parent ».
        </p>
      </div>
      <Field
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
        {pending ? "Envoi..." : "Envoyer ma demande"}
      </Button>
    </form>
  );
}

function Field({
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
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3.5 py-2.5 text-ink outline-none focus:border-togo-green-500"
      />
    </div>
  );
}
