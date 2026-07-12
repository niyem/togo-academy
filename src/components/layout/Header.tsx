"use client";

// En-tete editorial sur fond vert foret (#154406, demande Niyem) :
// barre drapeau, logo serif, navigation centrale, menu hamburger sur mobile.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark, Button, Container, FlagBar } from "@/components/ui";

const navLinks = [
  { href: "/catalogue", label: "Catalogue" },
  { href: "/tutorat", label: "Tutorat" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/a-propos", label: "À propos" },
  { href: "/faq", label: "Questions fréquentes" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-forest/95 backdrop-blur">
      <FlagBar />
      <Container className="flex items-center justify-between gap-4 py-3">
        <Link
          href="/"
          aria-label="Accueil TogoAcademy"
          onClick={() => setOpen(false)}
        >
          <BrandMark onDark />
        </Link>

        <nav
          aria-label="Navigation principale"
          className="hidden items-center gap-7 md:flex"
        >
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors hover:text-white ${
                isActive(l.href) ? "text-white" : "text-white/70"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/connexion"
            className="text-sm font-medium text-white hover:text-togo-yellow-400"
          >
            Connexion
          </Link>
          <Button
            href="/inscription"
            className="bg-white !text-forest hover:bg-togo-yellow-400"
          >
            S&apos;inscrire
          </Button>
        </div>

        {/* Bouton menu mobile */}
        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/25 text-white md:hidden"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </Container>

      {/* Panneau mobile */}
      {open && (
        <div className="border-t border-white/10 bg-forest md:hidden">
          <Container className="flex flex-col pb-5 pt-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`border-b border-white/10 py-3 text-base font-medium ${
                  isActive(l.href) ? "text-togo-yellow-400" : "text-white"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/connexion"
              onClick={() => setOpen(false)}
              className="py-3 text-base font-medium text-white"
            >
              Connexion
            </Link>
            <div className="mt-3">
              <Button
                href="/inscription"
                className="w-full bg-white !text-forest hover:bg-togo-yellow-400"
              >
                S&apos;inscrire
              </Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
