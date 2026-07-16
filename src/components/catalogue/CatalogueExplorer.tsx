"use client";

// Explorateur du catalogue : recherche + filtres par niveau (cote client,
// donnees deja chargees cote serveur). Structure editoriale du redesign,
// couleurs Togo inchangees.

import Link from "next/link";
import { useMemo, useState } from "react";
import { LevelDot } from "@/components/ui";

export interface ExplorerLevel {
  slug: string;
  name: string;
  description: string;
}

export interface ExplorerClass {
  slug: string;
  name: string;
  levelSlug: string;
  track: "general" | "technique";
  subjects: string[];
  hasContent: boolean;
}

const LEVEL_DOT: Record<string, string> = {
  primaire: "bg-togo-green-500",
  college: "bg-togo-yellow-400",
  lycee: "bg-togo-red-500",
};

const TRACK_LABEL: Record<string, string> = {
  general: "Enseignement général",
  technique: "Enseignement technique",
};

export function CatalogueExplorer({
  levels,
  classes,
}: {
  levels: ExplorerLevel[];
  classes: ExplorerClass[];
}) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<string>("tous");

  const q = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      classes.filter((c) => {
        if (level !== "tous" && c.levelSlug !== level) return false;
        if (!q) return true;
        const hay = (
          c.name +
          " " +
          c.levelSlug +
          " " +
          TRACK_LABEL[c.track] +
          " " +
          c.subjects.join(" ")
        ).toLowerCase();
        return hay.includes(q);
      }),
    [classes, level, q],
  );

  const tabs = [
    { key: "tous", label: "Tous les niveaux" },
    ...levels.map((l) => ({ key: l.slug, label: l.name })),
  ];

  return (
    <div>
      {/* Recherche */}
      <div className="relative mb-5">
        <span
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" />
          </svg>
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une classe ou une matière : ex. Terminale, SVT, 6ème…"
          className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-soft)] py-4 pl-12 pr-12 text-base text-ink outline-none transition-colors focus:border-togo-green-500 focus:bg-white"
        />
        {query.length > 0 && (
          <button
            type="button"
            aria-label="Effacer la recherche"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--color-line)] text-ink"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        )}
      </div>

      {/* Filtres niveau + compteur */}
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const active = level === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setLevel(t.key)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-togo-green-600 bg-togo-green-600 text-white"
                    : "border-[var(--color-line)] bg-transparent text-[var(--color-muted)] hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="text-sm text-[var(--color-muted)]">
          {filtered.length}{" "}
          {filtered.length > 1 ? "classes disponibles" : "classe disponible"}
        </div>
      </div>

      {/* Sections par niveau */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-14">
          {levels.map((lvl) => {
            const inLevel = filtered.filter((c) => c.levelSlug === lvl.slug);
            if (inLevel.length === 0) return null;
            const tracks = (["general", "technique"] as const).filter((t) =>
              inLevel.some((c) => c.track === t),
            );
            const showTrack = tracks.length > 1;
            return (
              <section key={lvl.slug} id={lvl.slug} className="scroll-mt-28">
                <div className="mb-1.5 flex items-baseline gap-3">
                  <LevelDot color={LEVEL_DOT[lvl.slug] ?? "bg-togo-green-500"} />
                  <h2 className="font-display text-3xl tracking-tight text-ink">
                    {lvl.name}
                  </h2>
                  <span className="text-sm text-[var(--color-muted)]">
                    {inLevel.length} classe{inLevel.length > 1 ? "s" : ""}
                  </span>
                </div>
                <p className="mb-6 pl-[22px] text-sm text-[var(--color-muted)]">
                  {lvl.description}
                </p>
                <div className="flex flex-col gap-7">
                  {tracks.map((track) => {
                    const trackClasses = inLevel.filter(
                      (c) => c.track === track,
                    );
                    // Lycee : hierarchie claire par palier (Secondes,
                    // Premieres, Terminales), chaque palier listant ses
                    // series (A, C, D...) et leurs matieres.
                    const degrees =
                      lvl.slug === "lycee" && track === "general"
                        ? [
                            { prefix: "Seconde", label: "Secondes" },
                            { prefix: "Première", label: "Premières" },
                            { prefix: "Terminale", label: "Terminales" },
                          ]
                            .map((d) => ({
                              ...d,
                              classes: trackClasses.filter((c) =>
                                c.name.startsWith(d.prefix),
                              ),
                            }))
                            .filter((d) => d.classes.length > 0)
                        : null;
                    return (
                      <div key={track}>
                        {showTrack && (
                          <div className="mb-3 pl-[22px] text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
                            {TRACK_LABEL[track]}
                          </div>
                        )}
                        {degrees ? (
                          <div className="grid gap-4 md:grid-cols-3">
                            {degrees.map((deg) => (
                              <div
                                key={deg.prefix}
                                className="rounded-2xl border border-togo-green-100 bg-togo-green-50 p-5"
                              >
                                <h3 className="text-lg font-semibold text-ink">
                                  {deg.label}
                                </h3>
                                <div className="mt-3 flex flex-col gap-2">
                                  {deg.classes.map((c) => (
                                    <Link
                                      key={c.slug}
                                      href={`/classes/${c.slug}`}
                                      className="group flex items-center justify-between gap-2 rounded-xl border border-togo-green-100 bg-white px-4 py-3 transition-all hover:border-togo-green-500 hover:shadow-sm"
                                    >
                                      <span className="min-w-0">
                                        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                                          {c.name}
                                          {!c.hasContent && (
                                            <span className="rounded-full bg-togo-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-togo-yellow-600">
                                              Bientôt
                                            </span>
                                          )}
                                        </span>
                                        <span className="mt-0.5 block truncate text-xs text-[var(--color-muted)]">
                                          {c.subjects.length > 0
                                            ? c.subjects.slice(0, 4).join(" · ")
                                            : "Contenu en préparation"}
                                        </span>
                                      </span>
                                      <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="flex-none text-togo-green-600 transition-transform group-hover:translate-x-0.5"
                                      >
                                        <path d="M5 12h14M13 6l6 6-6 6" />
                                      </svg>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          {trackClasses.map((c) => (
                            <Link
                              key={c.slug}
                              href={`/classes/${c.slug}`}
                              className="group flex flex-col gap-3 rounded-2xl border border-togo-green-100 bg-togo-green-50 p-5 transition-all hover:border-togo-green-500 hover:shadow-md"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-lg font-semibold text-ink">
                                  {c.name}
                                </span>
                                {c.hasContent ? (
                                  <span className="rounded-full border border-togo-green-100 bg-white px-2.5 py-0.5 text-xs font-semibold text-togo-green-700">
                                    Disponible
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-togo-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-togo-yellow-600">
                                    Bientôt
                                  </span>
                                )}
                              </div>
                              {c.subjects.length > 0 ? (
                                <>
                                  <div className="text-xs text-[var(--color-muted)]">
                                    {c.subjects.length}{" "}
                                    {c.subjects.length > 1
                                      ? "matières au programme"
                                      : "matière au programme"}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {c.subjects.slice(0, 3).map((s) => (
                                      <span
                                        key={s}
                                        className="rounded-md border border-togo-green-100 bg-white px-2 py-0.5 text-xs text-ink"
                                      >
                                        {s}
                                      </span>
                                    ))}
                                    {c.subjects.length > 3 && (
                                      <span className="px-1 py-0.5 text-xs text-[var(--color-muted)]">
                                        +{c.subjects.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div className="text-xs text-[var(--color-muted)]">
                                  Contenu en préparation
                                </div>
                              )}
                              <div className="mt-auto flex items-center gap-1.5 text-xs font-medium text-togo-green-600">
                                Voir les matières
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="transition-transform group-hover:translate-x-0.5"
                                >
                                  <path d="M5 12h14M13 6l6 6-6 6" />
                                </svg>
                              </div>
                            </Link>
                          ))}
                        </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-togo-green-100 bg-togo-green-50 px-6 py-16 text-center">
          <div className="text-lg font-semibold text-ink">
            Aucune classe trouvée
          </div>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-muted)]">
            Aucun résultat pour «&nbsp;{query}&nbsp;». Essayez un autre terme ou
            parcourez tous les niveaux.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setLevel("tous");
            }}
            className="mt-5 rounded-lg bg-togo-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-togo-green-700"
          >
            Réinitialiser
          </button>
        </div>
      )}

      {/* Note leçons gratuites */}
      <div className="mt-14 flex items-center gap-3 rounded-2xl border border-togo-green-100 bg-togo-green-50 px-5 py-4">
        <span aria-hidden className="flex-none text-togo-green-600">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8h.01M11 12h1v4h1" />
          </svg>
        </span>
        <p className="text-sm text-ink">
          Les leçons marquées{" "}
          <span className="font-semibold text-togo-green-700">Gratuit</span>{" "}
          sont accessibles sans abonnement, sans carte bancaire.
        </p>
      </div>
    </div>
  );
}
