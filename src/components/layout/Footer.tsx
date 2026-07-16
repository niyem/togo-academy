// Pied de page sombre sur fond vert foret (#154406, demande Niyem).

import Link from "next/link";
import { BrandMark, Container, FlagBar } from "@/components/ui";

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
          <BrandMark onDark />
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
          <a
            href="https://www.youtube.com/@TogoAcademy"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm text-white/80 hover:text-togo-yellow-400"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="#FF0000"
            >
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
            </svg>
            Chaîne YouTube
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
