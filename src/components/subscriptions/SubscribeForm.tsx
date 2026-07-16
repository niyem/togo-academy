"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui";
import { PAYMENT_METHODS, type PaymentMethodId } from "@/lib/payments";
import { subscribe, type SubscribeState } from "@/lib/subscriptions/actions";

type Opt = { value: string; label: string };

// Perimetre + moyen de paiement -> instructions -> reference de paiement.
export function SubscribeForm({
  planSlug,
  scope,
  classes,
  subjects,
  defaultClass,
  lockedClass = null,
  lockedClassLabel,
}: {
  planSlug: string;
  scope: string; // "plateforme" | "classe" | "matiere"
  classes: Opt[];
  subjects: Opt[];
  defaultClass?: string | null;
  lockedClass?: string | null; // classe imposee (ex : formule TOEFL)
  lockedClassLabel?: string;
}) {
  const [method, setMethod] = useState<PaymentMethodId>("flooz");
  const [state, action, pending] = useActionState<SubscribeState, FormData>(
    subscribe,
    {},
  );

  const selected = PAYMENT_METHODS.find((m) => m.id === method)!;
  const sel =
    "w-full rounded-lg border border-[var(--color-line)] px-3 py-2 focus:border-togo-green-500";

  if (state.submitted) {
    return (
      <div className="rounded-xl border border-togo-green-100 bg-white p-5">
        <p className="font-bold text-togo-green-700">
          ✓ Demande enregistrée !
        </p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Notre équipe vérifie votre paiement et active votre abonnement,
          généralement sous 24 heures. Vous verrez le statut sur votre tableau
          de bord.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="plan" value={planSlug} />
      <input type="hidden" name="method" value={method} />

      {lockedClass ? (
        <>
          <input type="hidden" name="class" value={lockedClass} />
          <p className="rounded-lg bg-togo-green-50 px-3 py-2 text-sm font-medium text-togo-green-700">
            ✓ Accès complet à {lockedClassLabel ?? "ce parcours"} pendant un an.
          </p>
        </>
      ) : scope === "plateforme" ? (
        <p className="rounded-lg bg-togo-green-50 px-3 py-2 text-sm font-medium text-togo-green-700">
          ✓ Accès à toutes les classes et à toutes les matières.
        </p>
      ) : (
        <div>
          <p className="mb-2 text-sm font-semibold">
            {scope === "matiere"
              ? "Classe et matière concernées"
              : "Classe concernée"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              name="class"
              required
              defaultValue={defaultClass ?? ""}
              className={sel}
            >
              <option value="" disabled>
                Choisir la classe
              </option>
              {classes.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {scope === "matiere" && (
              <select name="subject" required defaultValue="" className={sel}>
                <option value="" disabled>
                  Choisir la matière
                </option>
                {subjects.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold">1. Choisissez votre moyen de paiement</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                method === m.id
                  ? "border-togo-green-500 bg-togo-green-50 font-semibold"
                  : "border-[var(--color-line)] hover:border-togo-green-500"
              }`}
            >
              <span className="block text-xs text-[var(--color-muted)]">
                {m.where}
              </span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-togo-yellow-400 bg-togo-yellow-100/40 p-4">
        <p className="text-sm font-semibold">2. Effectuez le paiement</p>
        <ul className="mt-2 space-y-1 text-sm">
          {selected.details.map((d) => (
            <li key={d} className="font-mono">{d}</li>
          ))}
        </ul>
      </div>

      <div>
        <label htmlFor="reference" className="mb-1 block text-sm font-semibold">
          3. Référence de votre paiement
        </label>
        <input
          id="reference"
          name="reference"
          required
          placeholder="N° de transaction, nom de l'expéditeur, date..."
          className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 focus:border-togo-green-500"
        />
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Notre équipe vérifie chaque paiement avant l&apos;activation.
        </p>
      </div>

      {state.error && (
        <p className="rounded-lg bg-togo-red-100 px-3 py-2 text-sm text-togo-red-700">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full">
        {pending ? "Envoi..." : "J'ai payé, activer mon abonnement"}
      </Button>
    </form>
  );
}
