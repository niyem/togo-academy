// Pied de page sombre sur fond vert foret (#154406, demande Niyem).

import Link from "next/link";
import { Container, FlagBar } from "@/components/ui";

const columns = [
  {
    title: "Apprendre",
    links: [
      { href: "/catalogue", label: "Catalogue" },
      { href: "/tarifs", label: "Abonnements" },
      { href: "/connexion", label: "Espace élève" },
    ],
  },
  {
    title: "La plateforme",
    links: [
      { href: "/tutorat", label: "Tutorat en direct" },
      { href: "/a-propos", label: "À propos" },
      { href: "/faq", label: "Questions fréquentes" },
      { href: "/contact", label: "Contact & support" },
    ],
  },
  {
    title: "Légal",
    links: [
      { href: "/conditions", label: "Conditions d'utilisation" },
      { href: "/confidentialite", label: "Confidentialité" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 bg-forest text-white/90">
      <FlagBar />
      <Container className="grid gap-10 py-14 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2 md:col-span-1">
          <span className="inline-flex items-center gap-2.5">
            <span
              aria-hidden
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-forest"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 8.5 L12 4 L22 8.5 L12 13 Z" />
                <path d="M6 10.6 V15.2 C6 15.2 8.4 17.2 12 17.2 C15.6 17.2 18 15.2 18 15.2 V10.6" />
              </svg>
            </span>
            <span className="font-display text-xl tracking-tight text-white">
              Togo<span className="text-togo-yellow-400">Academy</span>
            </span>
          </span>
          <p className="mt-4 max-w-xs text-sm text-white/65">
            L&apos;éducation de qualité, accessible partout au Togo.
          </p>
          <a
            href="https://groupebm.net"
            className="mt-5 inline-flex items-center gap-2.5 text-sm text-white/80 hover:text-togo-yellow-400"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/gbm-logo.png"
              alt="Sceau officiel de Groupe BM"
              width={34}
              height={34}
              loading="lazy"
            />
            Un département de Groupe BM
          </a>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/60">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-white hover:text-togo-yellow-400"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <div className="border-t border-white/15 py-5 text-center text-xs text-white/65">
        © {new Date().getFullYear()} Togo Academy · Un département de{" "}
        <a
          href="https://groupebm.net"
          className="hover:text-togo-yellow-400"
        >
          Groupe BM
        </a>
        . Tous droits réservés.
      </div>
    </footer>
  );
}
