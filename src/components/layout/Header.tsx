"use client";

// En-tete editorial : barre drapeau, logo serif, navigation centrale,
// menu hamburger fonctionnel sur mobile. Couleurs Togo inchangees.

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
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-white/90 backdrop-blur">
      <FlagBar />
      <Container className="flex items-center justify-between gap-4 py-3">
        <Link href="/" aria-label="Accueil TogoAcademy" onClick={() => setOpen(false)}>
          <BrandMark />
        </Link>

        <nav
          aria-label="Navigation principale"
          className="hidden items-center gap-7 md:flex"
        >
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors hover:text-ink ${
                isActive(l.href) ? "text-ink" : "text-[var(--color-muted)]"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/connexion"
            className="text-sm font-medium text-ink hover:text-togo-green-700"
          >
            Connexion
          </Link>
          <Button href="/inscription" variant="primary">
            S&apos;inscrire
          </Button>
        </div>

        {/* Bouton menu mobile */}
        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-line)] bg-white text-ink md:hidden"
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
        <div className="border-t border-[var(--color-line)] bg-white md:hidden">
          <Container className="flex flex-col pb-5 pt-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`border-b border-[var(--color-line)]/60 py-3 text-base font-medium ${
                  isActive(l.href) ? "text-togo-green-700" : "text-ink"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/connexion"
              onClick={() => setOpen(false)}
              className="py-3 text-base font-medium text-ink"
            >
              Connexion
            </Link>
            <div className="mt-3">
              <Button
                href="/inscription"
                variant="primary"
                className="w-full"
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
