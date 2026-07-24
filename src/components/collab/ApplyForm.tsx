"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  applyAsCollaborator,
  createCollabCvUploadUrl,
} from "@/lib/collab/actions";
import { IP_TRANSFER_TERMS } from "@/lib/collab/notice";

const input =
  "w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:border-togo-green-500 focus:outline-none";
const CV_MAX = 25 * 1024 * 1024; // 25 Mo (limite du bucket Supabase)

export function ApplyForm({ subjects }: { subjects: { key: string; name: string }[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cvName, setCvName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);

    const file = fd.get("cv");
    const cv = file && typeof file === "object" && "size" in file ? (file as File) : null;
    if (cv && cv.size > CV_MAX) {
      setError("CV trop lourd (25 Mo maximum). Réduisez le fichier et réessayez.");
      return;
    }

    setPending(true);
    try {
      // 1) Le CV part DIRECTEMENT vers Supabase (pas via Vercel) : on ne touche
      //    donc jamais la limite de 4,5 Mo des fonctions serverless.
      if (cv && cv.size > 0) {
        const ext = cv.name.split(".").pop() || "bin";
        const signed = await createCollabCvUploadUrl(ext);
        if (signed.error || !signed.path || !signed.signedUrl) {
          setError(signed.error ?? "Téléversement du CV impossible. Réessayez.");
          setPending(false);
          return;
        }
        // Upload direct navigateur -> Supabase (PUT sur l'URL signee).
        const up = await fetch(signed.signedUrl, {
          method: "PUT",
          headers: {
            "content-type": cv.type || "application/octet-stream",
            "x-upsert": "true",
          },
          body: cv,
        });
        if (!up.ok) {
          setError("Échec du téléversement du CV. Vérifiez votre connexion et réessayez.");
          setPending(false);
          return;
        }
        fd.set("cv_path", signed.path);
      }
      // 2) On n'envoie a la Server Action que des champs texte (corps minuscule).
      fd.delete("cv");

      const res = await applyAsCollaborator({}, fd);
      if (res?.error) {
        setError(res.error);
        setPending(false);
        return;
      }
      router.push("/rejoindre-production/merci");
    } catch {
      setError("Une erreur est survenue. Réessayez dans un instant.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      {/* CV : bouton bien visible + nom du fichier choisi */}
      <div>
        <label className="mb-1 block text-sm font-semibold">CV (facultatif)</label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-togo-green-600 bg-togo-green-50 px-4 py-2.5 text-sm font-semibold text-togo-green-700 hover:bg-togo-green-100"
          >
            <span aria-hidden>📎</span> {cvName ? "Changer le fichier" : "Choisir mon CV (PDF ou image)"}
          </button>
          <span className="text-sm text-[var(--color-muted)]">
            {cvName ?? "Aucun fichier choisi"}
          </span>
          <input
            ref={fileRef}
            type="file"
            name="cv"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            className="sr-only"
            onChange={(e) => setCvName(e.target.files?.[0]?.name ?? null)}
          />
        </div>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          PDF ou photo de votre CV, 25 Mo maximum.
        </p>
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
        {error && <span className="text-sm text-togo-red-700">{error}</span>}
      </div>
    </form>
  );
}
