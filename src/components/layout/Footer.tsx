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
      { href: "/a-propos", label: "Notre mission" },
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
    <footer className="mt-16 border-t border-[var(--color-line)] bg-togo-green-50/40">
      <FlagBar />
      <Container className="grid gap-8 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-extrabold text-lg">
            <span aria-hidden>🎓</span> TogoAcademy
          </div>
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            L&apos;éducation de qualité, accessible partout au Togo.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-bold text-ink">{col.title}</h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-togo-green-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <Container className="border-t border-[var(--color-line)] py-6 text-xs text-[var(--color-muted)]">
        © {new Date().getFullYear()} Togo Academy. Tous droits réservés.
      </Container>
    </footer>
  );
}
