import Link from "next/link";
import { Button, Container, FlagBar } from "@/components/ui";

const navLinks = [
  { href: "/catalogue", label: "Catalogue" },
  { href: "/tutorat", label: "Tutorat" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/a-propos", label: "À propos" },
  { href: "/faq", label: "FAQ" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[var(--color-line)]">
      <FlagBar />
      <Container className="flex items-center justify-between gap-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-lg">
          <span aria-hidden className="text-togo-green-600">
            🎓
          </span>
          <span>
            Togo<span className="text-togo-green-600">Academy</span>
          </span>
        </Link>

        <nav
          aria-label="Navigation principale"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--color-muted)]"
        >
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-togo-green-700">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button href="/connexion" variant="ghost" className="hidden sm:inline-flex">
            Connexion
          </Button>
          <Button href="/inscription" variant="primary">
            S&apos;inscrire
          </Button>
        </div>
      </Container>
    </header>
  );
}
