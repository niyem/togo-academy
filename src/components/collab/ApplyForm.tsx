"use client";

import { useActionState } from "react";
import { applyAsCollaborator, type CollabState } from "@/lib/collab/actions";
import { IP_TRANSFER_TERMS } from "@/lib/collab/notice";

const initial: CollabState = {};
const input =
  "w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:border-togo-green-500 focus:outline-none";

export function ApplyForm({ subjects }: { subjects: { key: string; name: string }[] }) {
  const [state, action, pending] = useActionState(applyAsCollaborator, initial);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-semibold">Je candidate comme</label>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="role" value="concepteur" defaultChecked /> Enseignant-concepteur (je conçois les cours)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="role" value="inspecteur" /> Inspecteur (je relis et valide)
          </label>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" required placeholder="Nom complet" className={input} />
        <input name="phone" placeholder="Téléphone" className={input} />
        <input type="email" name="email" required placeholder="E-mail" className={input} />
        <input type="password" name="password" required placeholder="Mot de passe (8 caractères min.)" className={input} />
      </div>
      <input name="headline" placeholder="Titre (ex. Professeur de physique, 12 ans d'expérience)" className={input} />

      <div>
        <label className="mb-1 block text-sm font-semibold">Matières</label>
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <label key={s.key} className="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-sm">
              <input type="checkbox" name="subjects" value={s.key} /> {s.name}
            </label>
          ))}
        </div>
      </div>

      <textarea name="message" rows={3} placeholder="Un mot sur votre expérience (facultatif)" className={input} />

      <div>
        <label className="mb-1 block text-sm font-semibold">CV (facultatif)</label>
        <input type="file" name="cv" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="text-sm" />
      </div>

      <label className="flex items-start gap-2 rounded-xl border border-togo-green-100 bg-togo-green-50 p-3 text-sm">
        <input type="checkbox" name="ip_accept" className="mt-1" required />
        <span>{IP_TRANSFER_TERMS}</span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-togo-green-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {pending ? "Envoi..." : "Envoyer ma candidature"}
        </button>
        {state.error && <span className="text-sm text-togo-red-700">{state.error}</span>}
      </div>
    </form>
  );
}
