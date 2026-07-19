import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Badge, Card, Container, Section } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SubmissionForm } from "@/components/collab/SubmissionForm";
import { VideoReviewForm } from "@/components/collab/VideoReviewForm";
import { ConfidentialNotice } from "@/lib/collab/notice";
import { STAGE_LABEL, STAGE_TONE, type Stage } from "@/lib/production/stages";
import { modulePrice } from "@/lib/production/bareme";

export const metadata: Metadata = { title: "Espace concepteur" };

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function ConcepteurSpace() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "concepteur") redirect("/tableau-de-bord");

  const { data: rows } = await supabase
    .from("content_production")
    .select("chapter_id, stage, cost_xof, video_url, chapters(title, slug, class_slug, subject_key, lessons(count))")
    .eq("concepteur_id", user.id)
    .order("updated_at", { ascending: false });

  const chapterIds = (rows ?? []).map((r: any) => r.chapter_id);
  const [{ data: subs }, { data: reviews }] = chapterIds.length
    ? await Promise.all([
        supabase
          .from("content_submissions")
          .select("chapter_id, version, file_path, file_name, note, created_at")
          .in("chapter_id", chapterIds)
          .order("version", { ascending: false }),
        supabase
          .from("content_reviews")
          .select("chapter_id, version, comment, decision, created_at")
          .in("chapter_id", chapterIds)
          .order("created_at", { ascending: false }),
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }];
  const revsByModule = new Map<string, any[]>();
  for (const r of reviews ?? []) {
    const arr = revsByModule.get(r.chapter_id) ?? [];
    arr.push(r);
    revsByModule.set(r.chapter_id, arr);
  }

  const admin = createSupabaseAdminClient();
  const urls = new Map<string, string>();
  if (admin) {
    for (const s of subs ?? []) {
      const { data } = await admin.storage
        .from("collab-docs")
        .createSignedUrl(s.file_path, 3600);
      if (data?.signedUrl) urls.set(s.file_path, data.signedUrl);
    }
  }
  const subsByModule = new Map<string, any[]>();
  for (const s of subs ?? []) {
    const arr = subsByModule.get(s.chapter_id) ?? [];
    arr.push(s);
    subsByModule.set(s.chapter_id, arr);
  }

  const totalPay = (rows ?? []).reduce(
    (sum: number, r: any) => sum + (r.cost_xof ?? modulePrice(r.chapters?.class_slug ?? "")),
    0,
  );

  return (
    <Section>
      <Container>
        <h1 className="text-3xl font-extrabold">Espace concepteur</h1>
        <p className="mt-1 text-[var(--color-muted)]">
          Bonjour {profile?.full_name ?? ""}. Voici les modules qui vous sont
          attribués. Déposez vos versions ; l&apos;inspecteur vous fera ses
          retours.
        </p>

        <ConfidentialNotice className="mt-5" />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="text-center">
            <div className="text-2xl font-extrabold text-togo-green-600">{rows?.length ?? 0}</div>
            <div className="text-xs text-[var(--color-muted)]">modules attribués</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-extrabold text-togo-green-600">
              {totalPay.toLocaleString("fr-FR")} FCFA
            </div>
            <div className="text-xs text-[var(--color-muted)]">
              votre rémunération prévue (tous modules attribués)
            </div>
          </Card>
        </div>

        <div className="mt-6 space-y-4">
          {(rows ?? []).map((r: any) => {
            const cls = r.chapters?.class_slug ?? "";
            const versions = subsByModule.get(r.chapter_id) ?? [];
            const myRevs = revsByModule.get(r.chapter_id) ?? [];
            const lessonCount = r.chapters?.lessons?.[0]?.count ?? 0;
            const pay = r.cost_xof ?? modulePrice(cls);
            return (
              <Card key={r.chapter_id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={STAGE_TONE[r.stage as Stage]}>
                        {STAGE_LABEL[r.stage as Stage]}
                      </Badge>
                      <span className="font-semibold">{r.chapters?.title}</span>
                    </div>
                    <div className="mt-1 text-xs text-[var(--color-muted)]">
                      [{cls}] {r.chapters?.subject_key} · {lessonCount} leçon(s) à développer
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-togo-green-700">
                      {pay.toLocaleString("fr-FR")} FCFA
                    </div>
                    <div className="text-[11px] text-[var(--color-muted)]">
                      🔒 fixé par l&apos;administration
                    </div>
                  </div>
                </div>

                {myRevs.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {myRevs.map((rv: any, i: number) => (
                      <div key={i} className="rounded-lg bg-togo-green-50 p-3 text-sm">
                        <Badge tone={rv.decision === "approved" ? "green" : "yellow"}>
                          v{rv.version} · {rv.decision === "approved" ? "Validé" : "Corrections demandées"}
                        </Badge>
                        <p className="mt-1 text-ink/90">{rv.comment}</p>
                      </div>
                    ))}
                  </div>
                )}

                {versions.length > 0 && (
                  <ul className="mt-3 divide-y divide-[var(--color-line)] text-sm">
                    {versions.map((v: any) => (
                      <li key={v.version} className="flex items-center justify-between gap-3 py-2">
                        <span>
                          <span className="font-medium">Version {v.version}</span>
                          {v.note && (
                            <span className="block text-xs text-[var(--color-muted)]">{v.note}</span>
                          )}
                        </span>
                        {urls.get(v.file_path) ? (
                          <a
                            href={urls.get(v.file_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-togo-green-700 hover:underline"
                          >
                            ↓ {v.file_name ?? "fichier"}
                          </a>
                        ) : (
                          <span className="text-xs text-[var(--color-muted)]">fichier</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {r.stage === "verification" && r.video_url ? (
                  <VideoReviewForm moduleId={r.chapter_id} videoUrl={r.video_url} />
                ) : (
                  <SubmissionForm moduleId={r.chapter_id} />
                )}
              </Card>
            );
          })}
          {(rows ?? []).length === 0 && (
            <Card>
              <p className="text-sm text-[var(--color-muted)]">
                Aucun module ne vous est encore attribué. L&apos;administration
                vous en confiera bientôt.
              </p>
            </Card>
          )}
        </div>
      </Container>
    </Section>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
