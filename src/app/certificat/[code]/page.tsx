// Verification publique d'un certificat par son code (imprime sur le PDF).
// Lecture seule via la cle service-role : recherche par code unique,
// aucune liste ni enumeration possible.

import type { Metadata } from "next";
import Link from "next/link";
import { Button, Container, Eyebrow } from "@/components/ui";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Vérification de certificat",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalized = decodeURIComponent(code).trim().toUpperCase();

  const admin = createSupabaseAdminClient();
  const { data: cert } = admin
    ? await admin
        .from("certificates")
        .select("code, student_name, course_label, issued_at")
        .eq("code", normalized)
        .maybeSingle()
    : { data: null };

  return (
    <Container className="max-w-xl pb-24 pt-16 sm:pt-20">
      <Eyebrow>Vérification de certificat</Eyebrow>
      {cert ? (
        <div className="mt-5 rounded-2xl border border-togo-green-100 bg-togo-green-50 p-8">
          <div className="text-lg font-semibold text-togo-green-700">
            ✓ Certificat authentique
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <Row label="Titulaire" value={cert.student_name} />
            <Row label="Cours" value={cert.course_label} />
            <Row
              label="Délivré le"
              value={new Date(cert.issued_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
            <Row label="Code" value={cert.code} mono />
          </dl>
          <p className="mt-5 text-xs text-[var(--color-muted)]">
            Ce certificat a été délivré par Togo Academy (département « Académie
            en ligne » de Groupe BM) après validation de toutes les évaluations
            (70 % minimum) et de tous les examens de chapitre (80 % minimum) du
            cours.
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-togo-red-500/40 bg-togo-red-100/40 p-8">
          <div className="text-lg font-semibold text-togo-red-700">
            Certificat introuvable
          </div>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Aucun certificat ne correspond au code «&nbsp;{normalized}&nbsp;».
            Vérifiez le code imprimé en bas du document (format TA-XXXX-XXXX).
          </p>
        </div>
      )}
      <div className="mt-8">
        <Button href="/" variant="secondary">
          Retour à l&apos;accueil
        </Button>
      </div>
      <p className="mt-6 text-xs text-[var(--color-muted)]">
        Une question sur un certificat ?{" "}
        <Link href="/contact" className="font-medium text-togo-green-700 hover:underline">
          Contactez-nous
        </Link>
        .
      </p>
    </Container>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-togo-green-100 pb-2">
      <dt className="text-[var(--color-muted)]">{label}</dt>
      <dd className={`font-semibold text-ink ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
