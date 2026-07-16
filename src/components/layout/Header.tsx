"use client";

// En-tete editorial sur fond vert foret (#154406, demande Niyem) :
// barre drapeau, logo serif, navigation centrale, menu hamburger sur mobile.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark, Button, Container, FlagBar } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const navLinks = [
  { href: "/catalogue", label: "Catalogue" },
  { href: "/tutorat", label: "Tutorat" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/a-propos", label: "À propos" },
  { href: "/faq", label: "Questions fréquentes" },
  { href: "/contact", label: "Contact" },
];

/** Etat de session cote client (l'en-tete reste statique cote serveur pour
 *  ne pas rendre tout le site dynamique via cookies()). */
function useSessionRole() {
  const [state, setState] = useState<{
    authed: boolean;
    role: string | null;
  }>({ authed: false, role: null });
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setState({ authed: false, role: null });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (!cancelled) setState({ authed: true, role: profile?.role ?? null });
    })();
    return () => {
      cancelled = true;
    };
    // Reevalue apres chaque navigation (connexion/deconnexion incluses).
  }, [pathname]);

  return state;
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { authed, role } = useSessionRole();

  // L'admin gere aussi le contenu : on lui donne les deux acces (le tableau
  // d'administration et la bibliotheque de lecons /enseignant).
  const roleLinks =
    role === "admin"
      ? [
          { href: "/admin", label: "Administration" },
          { href: "/enseignant", label: "Contenu" },
        ]
      : role === "teacher"
        ? [{ href: "/enseignant", label: "Espace enseignant" }]
        : role === "tutor"
          ? [{ href: "/tuteur", label: "Espace tuteur" }]
          : [];

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
          {authed ? (
            <>
              {roleLinks.map((rl) => (
                <Link
                  key={rl.href}
                  href={rl.href}
                  className="text-sm font-semibold text-togo-yellow-400 hover:text-white"
                >
                  {rl.label}
                </Link>
              ))}
              <Button
                href="/tableau-de-bord"
                className="bg-white !text-forest hover:bg-togo-yellow-400"
              >
                Tableau de bord
              </Button>
            </>
          ) : (
            <>
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
            </>
          )}
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
            {authed ? (
              <>
                {roleLinks.map((rl) => (
                  <Link
                    key={rl.href}
                    href={rl.href}
                    onClick={() => setOpen(false)}
                    className="border-b border-white/10 py-3 text-base font-semibold text-togo-yellow-400"
                  >
                    {rl.label}
                  </Link>
                ))}
                <div className="mt-3">
                  <Button
                    href="/tableau-de-bord"
                    className="w-full bg-white !text-forest hover:bg-togo-yellow-400"
                  >
                    Tableau de bord
                  </Button>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </Container>
        </div>
      )}
    </header>
  );
}
