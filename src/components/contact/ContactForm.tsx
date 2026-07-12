"use client";

// Formulaire de contact branche sur sendContactMessage (Supabase).

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { sendContactMessage, type ContactState } from "@/lib/contact/actions";

const TOPICS: [string, string][] = [
  ["question", "Question générale"],
  ["abonnement", "Abonnement & paiement"],
  ["tuteur", "Devenir tuteur"],
  ["technique", "Problème technique"],
  ["partenariat", "Partenariat / établissement scolaire"],
  ["autre", "Autre"],
];

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(
    sendContactMessage,
    {},
  );

  if (state.ok) {
    return (
      <div className="rounded-xl bg-togo-green-50 p-6 text-center">
        <div className="text-lg font-semibold text-togo-green-700">
          ✓ Message envoyé
        </div>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Merci ! Notre équipe vous répond sous 24 h à l&apos;adresse indiquée.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-5">
      {/* Champ piege anti-robots, invisible pour les humains. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nom complet" name="name" placeholder="Kossi Mensah" required />
        <Field
          label="Adresse e-mail"
          name="email"
          type="email"
          placeholder="vous@exemple.com"
          required
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Téléphone (optionnel)" name="phone" placeholder="+228 ..." />
        <div>
          <label
            htmlFor="topic"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Sujet
          </label>
          <select
            id="topic"
            name="topic"
            className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3.5 py-2.5 text-ink outline-none focus:border-togo-green-500"
          >
            {TOPICS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label
          htmlFor="message"
          className="mb-1.5 block text-sm font-medium text-ink"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          minLength={10}
          placeholder="Expliquez-nous votre question ou votre besoin…"
          className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3.5 py-2.5 text-ink outline-none transition-colors focus:border-togo-green-500"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-togo-red-100 px-3 py-2 text-sm text-togo-red-700">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full sm:w-fit">
        {pending ? "Envoi..." : "Envoyer le message"}
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
