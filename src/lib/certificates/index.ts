// Certificats de cours : eligibilite (recalculee cote serveur, jamais confiee
// au client) + emission idempotente + rendu PDF (pdf-lib, sans dependance
// native, compatible Vercel serverless).

import "server-only";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import { getAssessmentsForChapter, getChapters, getClass, getSubject } from "@/lib/content";
import type { SubjectKey } from "@/lib/content/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/* Couleurs Togo (identiques aux tokens du site). */
const GREEN = rgb(0.043, 0.518, 0.341); // #0b8457
const GREEN_DARK = rgb(0.031, 0.439, 0.286); // #087049
const YELLOW = rgb(1, 0.808, 0); // #ffce00
const RED = rgb(0.824, 0.063, 0.204); // #d21034
const INK = rgb(0.102, 0.169, 0.149); // #1a2b26
const MUTED = rgb(0.361, 0.42, 0.4); // #5c6b66

export type EligibilityResult =
  | { eligible: true; courseLabel: string; total: number }
  | { eligible: false; reason: string };

/** Recalcule l'eligibilite au certificat pour l'utilisateur CONNECTE. */
export async function checkEligibility(
  classSlug: string,
  subjectKey: string,
): Promise<EligibilityResult> {
  const [schoolClass, subject] = await Promise.all([
    getClass(classSlug),
    getSubject(subjectKey),
  ]);
  if (!schoolClass || !subject) {
    return { eligible: false, reason: "Cours introuvable." };
  }
  const chapters = await getChapters(classSlug, subjectKey as SubjectKey);
  const assessments = (
    await Promise.all(chapters.map((c) => getAssessmentsForChapter(c.slug)))
  ).flat();
  if (assessments.length === 0) {
    return {
      eligible: false,
      reason: "Ce cours n'a pas encore d'épreuves certifiantes.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("assessment_id, score, total")
    .in(
      "assessment_id",
      assessments.map((a) => a.id),
    );
  const best = new Map<string, number>();
  for (const a of attempts ?? []) {
    if (!a.total || !a.assessment_id) continue;
    const p = Math.round((100 * a.score) / a.total);
    if (p > (best.get(a.assessment_id) ?? -1)) best.set(a.assessment_id, p);
  }
  const failed = assessments.filter(
    (a) => (best.get(a.id) ?? -1) < a.passPercent,
  );
  if (failed.length > 0) {
    return {
      eligible: false,
      reason: `Il reste ${failed.length} épreuve${failed.length > 1 ? "s" : ""} à valider (évaluations à 70 %, examens à 80 %).`,
    };
  }
  return {
    eligible: true,
    courseLabel: `${subject.name} · Classe de ${schoolClass.name}`,
    total: assessments.length,
  };
}

function makeCode() {
  const hex = () =>
    Math.floor(Math.random() * 0xffff)
      .toString(16)
      .toUpperCase()
      .padStart(4, "0");
  return `TA-${hex()}-${hex()}`;
}

/** Emet (ou retrouve) le certificat de l'utilisateur : idempotent. */
export async function issueCertificate(
  userId: string,
  studentName: string,
  classSlug: string,
  subjectKey: string,
  courseLabel: string,
) {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Service non configuré.");
  const { data: existing } = await admin
    .from("certificates")
    .select("code, issued_at")
    .eq("user_id", userId)
    .eq("class_slug", classSlug)
    .eq("subject_key", subjectKey)
    .maybeSingle();
  if (existing) return existing;
  const { data, error } = await admin
    .from("certificates")
    .insert({
      code: makeCode(),
      user_id: userId,
      class_slug: classSlug,
      subject_key: subjectKey,
      student_name: studentName,
      course_label: courseLabel,
    })
    .select("code, issued_at")
    .single();
  if (error || !data) throw new Error("Émission impossible.");
  return data;
}

function centered(
  page: PDFPage,
  text: string,
  y: number,
  font: PDFFont,
  size: number,
  color = INK,
) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (page.getWidth() - w) / 2, y, size, font, color });
}

/** Signature du fondateur depuis le stockage prive (jamais expose en URL
 *  publique). Null si indisponible : le certificat sort sans signature. */
export async function loadSignature(): Promise<Uint8Array | undefined> {
  const admin = createSupabaseAdminClient();
  if (!admin) return undefined;
  const { data } = await admin.storage
    .from("branding")
    .download("signature.png");
  if (!data) return undefined;
  return new Uint8Array(await data.arrayBuffer());
}

/** Rendu du certificat en PDF A4 paysage. */
export async function renderCertificatePdf(opts: {
  studentName: string;
  courseLabel: string;
  code: string;
  issuedAt: Date;
  epreuves: number;
  sealPng?: Uint8Array;
  signaturePng?: Uint8Array;
}) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]); // A4 paysage
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await doc.embedFont(StandardFonts.Helvetica);

  const W = page.getWidth();
  const H = page.getHeight();

  // Cadre vert + barre drapeau en tete
  page.drawRectangle({
    x: 24,
    y: 24,
    width: W - 48,
    height: H - 48,
    borderColor: GREEN_DARK,
    borderWidth: 2,
  });
  const bandW = (W - 60) / 3;
  page.drawRectangle({ x: 30, y: H - 36, width: bandW, height: 6, color: GREEN });
  page.drawRectangle({ x: 30 + bandW, y: H - 36, width: bandW, height: 6, color: YELLOW });
  page.drawRectangle({ x: 30 + 2 * bandW, y: H - 36, width: bandW, height: 6, color: RED });

  centered(page, "TOGO ACADEMY", H - 88, sans, 15, GREEN_DARK);
  centered(page, "Académie en ligne de Groupe BM", H - 106, sans, 9, MUTED);

  centered(page, "Certificat de réussite", H - 168, serifBold, 42);

  centered(page, "est décerné à", H - 214, serifItalic, 14, MUTED);
  centered(page, opts.studentName, H - 258, serifBold, 30, GREEN_DARK);

  centered(
    page,
    "pour avoir validé l'intégralité des évaluations et des examens du cours",
    H - 296,
    serif,
    13,
    MUTED,
  );
  centered(page, opts.courseLabel, H - 330, serifBold, 22);
  centered(
    page,
    `${opts.epreuves} épreuve${opts.epreuves > 1 ? "s" : ""} validée${opts.epreuves > 1 ? "s" : ""} · évaluations réussies à 70 % minimum · examens à 80 % minimum`,
    H - 356,
    sans,
    9,
    MUTED,
  );

  const dateStr = opts.issuedAt.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Bloc du bas : date a gauche, sceau au centre, signature a droite.
  const leftX = 215;
  const rightX = W - 215;
  const lineY = 143;
  const lineHalf = 90;

  // Date (gauche)
  {
    const t = `Fait le ${dateStr}`;
    const w = serif.widthOfTextAtSize(t, 12);
    page.drawText(t, { x: leftX - w / 2, y: lineY + 8, size: 12, font: serif, color: INK });
    page.drawLine({
      start: { x: leftX - lineHalf, y: lineY },
      end: { x: leftX + lineHalf, y: lineY },
      thickness: 0.8,
      color: MUTED,
    });
    const l = "Date d'émission";
    const lw = sans.widthOfTextAtSize(l, 8);
    page.drawText(l, { x: leftX - lw / 2, y: lineY - 14, size: 8, font: sans, color: MUTED });
  }

  // Sceau Groupe BM (centre)
  if (opts.sealPng) {
    try {
      const seal = await doc.embedPng(opts.sealPng);
      const s = 74;
      page.drawImage(seal, { x: (W - s) / 2, y: 100, width: s, height: s });
    } catch {
      // sans sceau si l'image est indisponible
    }
  }

  // Signature du fondateur (droite)
  {
    if (opts.signaturePng) {
      try {
        const sig = await doc.embedPng(opts.signaturePng);
        const sw = 110;
        const sh = (sw * sig.height) / sig.width;
        page.drawImage(sig, {
          x: rightX - sw / 2,
          y: lineY + 4,
          width: sw,
          height: sh,
        });
      } catch {
        // sans image de signature si indisponible
      }
    }
    page.drawLine({
      start: { x: rightX - lineHalf, y: lineY },
      end: { x: rightX + lineHalf, y: lineY },
      thickness: 0.8,
      color: MUTED,
    });
    const name = "Niyem M. Bawana, Ph.D.";
    const nw = serifBold.widthOfTextAtSize(name, 11);
    page.drawText(name, { x: rightX - nw / 2, y: lineY - 15, size: 11, font: serifBold, color: INK });
    const role = "Fondateur, Groupe BM";
    const rw = sans.widthOfTextAtSize(role, 8);
    page.drawText(role, { x: rightX - rw / 2, y: lineY - 28, size: 8, font: sans, color: MUTED });
  }

  centered(
    page,
    `Code de vérification : ${opts.code}`,
    58,
    sans,
    9,
    MUTED,
  );
  centered(
    page,
    `Authenticité vérifiable sur academie.groupebm.net/certificat/${opts.code}`,
    44,
    sans,
    8,
    MUTED,
  );

  return doc.save();
}
