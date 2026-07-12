import type { Metadata } from "next";
import { Badge, Button, Card, Container, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Togo Academy : la plateforme d'apprentissage en ligne du programme scolaire togolais, un département de Groupe BM.",
};

export default function AboutPage() {
  return (
    <>
      <Section className="bg-gradient-to-b from-togo-green-50 to-white">
        <Container className="max-w-3xl text-center">
          <Badge tone="yellow">À propos</Badge>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight">
            Qu&apos;est-ce que{" "}
            <span className="text-togo-green-600">Togo Academy</span> ?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--color-muted)]">
            Une plateforme d&apos;apprentissage en ligne dédiée au programme
            scolaire togolais, du CP1 à la Terminale, enseignement général et
            technique. Des leçons claires, beaucoup de pratique et un
            accompagnement personnalisé, où que tu sois au Togo.
          </p>
        </Container>
      </Section>

      <Section>
        <Container className="max-w-3xl">
          <h2 className="text-2xl font-bold">Pourquoi nous existons</h2>
          <p className="mt-3 text-[var(--color-muted)]">
            Au Togo, beaucoup d&apos;établissements manquent d&apos;enseignants
            qualifiés, en particulier en sciences. Trop d&apos;élèves abordent
            les mathématiques, la physique ou la SVT sans explications
            claires, et leurs chances aux examens s&apos;en ressentent. Togo
            Academy est née pour réduire cette inégalité : offrir à chaque
            élève, quel que soit son établissement ou sa ville, les mêmes
            leçons de qualité et le même accompagnement.
          </p>

          <h2 className="mt-10 text-2xl font-bold">Ce que tu trouves ici</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {(
              [
                [
                  "🎬 Des leçons complètes",
                  "Vidéos courtes (un concept à la fois), cours écrit, exemples résolus, exercices interactifs et fiches PDF téléchargeables.",
                ],
                [
                  "📝 Des épreuves comme en classe",
                  "Quiz pendant les vidéos, évaluations par sous-chapitre (70%) et examens de chapitre (80%) qui mènent au certificat de cours.",
                ],
                [
                  "🤖 Un tuteur IA",
                  "Dans chaque leçon : il explique autrement, donne des indices sans jamais révéler la réponse, et propose des exercices en plus.",
                ],
                [
                  "👨🏾‍🏫 Bientôt : le tutorat en direct",
                  "Des séances privées 1:1 avec de vrais enseignants togolais, payables à la séance, sans abonnement.",
                ],
                [
                  "👪 Un suivi pour les parents",
                  "Un compte parent relié à ses enfants : leçons terminées, scores aux quiz, progression vers les certificats.",
                ],
                [
                  "📶 Pensé pour le Togo",
                  "Site léger et rapide sur connexions lentes, paiements par Flooz et virement bancaire, contenu 100 % aligné sur le programme officiel.",
                ],
              ] as [string, string][]
            ).map(([title, desc]) => (
              <Card key={title}>
                <h3 className="font-bold">{title}</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{desc}</p>
              </Card>
            ))}
          </div>

          <h2 className="mt-10 text-2xl font-bold">Notre méthode</h2>
          <ul className="mt-3 space-y-2 text-[var(--color-muted)]">
            <li>
              ➗ <strong className="text-ink">Un concept à la fois</strong> :
              chaque vidéo explique une seule idée, simplement.
            </li>
            <li>
              ✍️ <strong className="text-ink">La pratique avant tout</strong> :
              comprendre ne suffit pas, on s&apos;entraîne jusqu&apos;à réussir.
            </li>
            <li>
              🎓 <strong className="text-ink">Des repères clairs</strong> :
              évaluations, examens et certificats de cours pour mesurer les
              progrès réels.
            </li>
            <li>
              🇹🇬 <strong className="text-ink">Le programme togolais</strong> :
              du CEPD au BEPC et au BAC, filières générale et technique.
            </li>
          </ul>

          <h2 className="mt-10 text-2xl font-bold">Qui sommes-nous</h2>
          <Card className="mt-4">
            <p className="text-[var(--color-muted)]">
              Togo Academy est le département « Académie en ligne » de{" "}
              <a
                href="https://groupebm.net"
                className="font-semibold text-togo-green-700 hover:underline"
              >
                Groupe BM
              </a>{" "}
              (« Bâtir et Moderniser »), qui connecte l&apos;Afrique
              francophone à l&apos;excellence mondiale : études à
              l&apos;étranger, services professionnels, recherche et
              ingénierie. Togo Academy est à la fois une entreprise éducative
              durable et un outil de démocratisation de l&apos;éducation de
              qualité au Togo : les abonnements financent la production de
              nouveaux cours et leur accessibilité au plus grand nombre.
            </p>
          </Card>

          <Card className="mt-8 bg-togo-green-600 text-center text-white">
            <h2 className="text-xl font-bold">Prêt à essayer ?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-togo-green-50">
              Des leçons d&apos;essai sont gratuites, sans carte bancaire.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Button
                href="/catalogue"
                className="bg-white !text-togo-green-700 hover:bg-togo-green-50"
              >
                Découvrir les leçons
              </Button>
              <Button
                href="/contact"
                variant="outline"
                className="!border-white !text-white hover:!bg-togo-green-700"
              >
                Nous contacter
              </Button>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}
