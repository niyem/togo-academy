import type { Metadata } from "next";
import { Container, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Questions fréquentes" };

const faqs = [
  {
    q: "Puis-je essayer avant de payer ?",
    a: "Oui. Certaines leçons sont gratuites, avec vidéo, exercices et quiz, pour découvrir la plateforme sans abonnement.",
  },
  {
    q: "Comment payer l'abonnement ?",
    a: "Par Flooz, TMoney ou virement bancaire. Le virement est disponible dès le lancement ; le paiement mobile arrive prochainement.",
  },
  {
    q: "La plateforme fonctionne-t-elle avec une connexion lente ?",
    a: "Oui. Le site est léger et les vidéos s'adaptent à votre débit. Les fiches PDF permettent aussi de réviser hors ligne.",
  },
  {
    q: "Les parents peuvent-ils suivre leur enfant ?",
    a: "Oui. Un compte parent permet de relier un ou plusieurs élèves et de suivre leurs progrès et résultats.",
  },
  {
    q: "Le contenu suit-il le programme togolais ?",
    a: "Oui. Les leçons sont organisées par niveau et classe (du CP1 à la Terminale) et alignées sur le programme officiel.",
  },
];

export default function FaqPage() {
  return (
    <Section>
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-extrabold">Questions fréquentes</h1>
        <div className="mt-8 divide-y divide-[var(--color-line)]">
          {faqs.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="cursor-pointer list-none font-semibold marker:hidden">
                <span className="text-togo-green-600">▸ </span>
                {f.q}
              </summary>
              <p className="mt-2 pl-4 text-[var(--color-muted)]">{f.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  );
}
