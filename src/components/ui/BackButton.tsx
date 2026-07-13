"use client";

// Bouton « Retour » : revient a la page precedente de l'historique du
// navigateur ; si la page a ete ouverte directement (pas d'historique),
// bascule vers une destination de repli.

import { useRouter } from "next/navigation";

export function BackButton({ fallback = "/catalogue" }: { fallback?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-4 py-1.5 text-sm font-medium text-[var(--color-muted)] transition-colors hover:border-togo-green-500 hover:text-togo-green-700"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M19 12H5M11 6l-6 6 6 6" />
      </svg>
      Retour
    </button>
  );
}
