import type { Metadata } from "next";
import { Button, Card, Container, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Contact & support" };

export default function ContactPage() {
  return (
    <Section>
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-extrabold">Contact & support</h1>
        <p className="mt-2 text-[var(--color-muted)]">
          Une question ? Écrivez-nous, nous répondons rapidement.
        </p>

        <Card className="mt-8">
          {/* Phase 1: wire to a server action + email (Resend). */}
          <form className="grid gap-4">
            <Field label="Nom complet" name="name" />
            <Field label="Email ou téléphone" name="contact" />
            <div>
              <label
                htmlFor="message"
                className="mb-1 block text-sm font-semibold"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 focus:border-togo-green-500"
              />
            </div>
            <Button type="submit" className="w-fit">
              Envoyer
            </Button>
          </form>
        </Card>
      </Container>
    </Section>
  );
}

function Field({ label, name }: { label: string; name: string }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={name}
        name={name}
        className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 focus:border-togo-green-500"
      />
    </div>
  );
}
