// Telechargement du certificat de cours en PDF.
// Auth obligatoire ; l'eligibilite est recalculee ici (jamais confiee au
// client) ; l'emission est idempotente (un seul code par cours et par eleve).

import { NextResponse } from "next/server";
import {
  checkEligibility,
  issueCertificate,
  renderCertificatePdf,
} from "@/lib/certificates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ classSlug: string; subjectKey: string }> },
) {
  const { classSlug, subjectKey } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/connexion", req.url));
  }

  const eligibility = await checkEligibility(classSlug, subjectKey);
  if (!eligibility.eligible) {
    return new NextResponse(eligibility.reason, {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const studentName = profile?.full_name?.trim() || "Élève Togo Academy";

  const cert = await issueCertificate(
    user.id,
    studentName,
    classSlug,
    subjectKey,
    eligibility.courseLabel,
  );

  // Sceau depuis les assets publics du deploiement courant.
  let sealPng: Uint8Array | undefined;
  try {
    const res = await fetch(new URL("/gbm-logo.png", req.url));
    if (res.ok) sealPng = new Uint8Array(await res.arrayBuffer());
  } catch {
    // certificat sans sceau en cas d'echec
  }

  const pdf = await renderCertificatePdf({
    studentName,
    courseLabel: eligibility.courseLabel,
    code: cert.code,
    issuedAt: new Date(cert.issued_at),
    epreuves: eligibility.total,
    sealPng,
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificat-${subjectKey}-${classSlug}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
