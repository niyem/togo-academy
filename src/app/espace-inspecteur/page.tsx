import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Badge, Card, Container, Section } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ReviewForm } from "@/components/collab/ReviewForm";
import { VideoReviewForm } from "@/components/collab/VideoReviewForm";
import { ConfidentialNotice } from "@/lib/collab/notice";
import { STAGE_LABEL, STAGE_TONE, type Stage } from "@/lib/production/stages";
import { inspectorPrice } from "@/lib/production/bareme";

export const metadata: Metadata = { title: "Espace inspecteur" };

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function InspecteurSpace() {
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
  if (profile?.role !== "inspecteur") redirect("/tableau-de-bord");

  const { data: assigns } = await supabase
    .from("module_inspectors")
    .select("chapter_id")
    .eq("inspector_id", user.id);
  const chapterIds = (assigns ?? []).map((a: any) => a.chapter_id);

  const [{ data: prod }, { data: subs }, { data: reviews }] = chapterIds.length
    ? await Promise.all([
        supabase
          .from("content_production")
          .select("chapter_id, stage, inspector_cost_xof, video_url, chapters(title, class_slug, subject_key)")
          .in("chapter_id", chapterIds),
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
    : [{ data: [] as any[] }, { data: [] as any[] }, { data: [] as any[] }];

  const admin = createSupabaseAdminClient();
  const urls = new Map<string, string>();
  if (admin) {
    for (const s of subs ?? []) {
      const { data } = await admin.storage.from("collab-docs").createSignedUrl(s.file_path, 3600);
      if (data?.signedUrl) urls.set(s.file_path, data.signedUrl);
    }
  }
  const subsBy = new Map<string, any[]>();
  for (const s of subs ?? []) {
    const arr = subsBy.get(s.chapter_id) ?? [];
    arr.push(s);
    subsBy.set(s.chapter_id, arr);
  }
  const revsBy = new Map<string, any[]>();
  for (const r of reviews ?? []) {
    const arr = revsBy.get(r.chapter_id) ?? [];
    arr.push(r);
    revsBy.set(r.chapter_id, arr);
  }

  const totalPay = (prod ?? []).reduce(
    (sum: number, p: any) =>
      sum + (p.inspector_cost_xof ?? inspectorPrice(p.chapters?.class_slug ?? "")),
    0,
  );

  return (
    <Section>
      <Container>
        <h1 className="text-3xl font-extrabold">Espace inspecteur</h1>
        <p className="mt-1 text-[var(--color-muted)]">
          Bonjour {profile?.full_name ?? ""}. Relisez les modules qui vous sont
          attribués, laissez vos observations et validez ou demandez des
          corrections.
        </p>

        <ConfidentialNotice className="mt-5" />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="text-center">
            <div className="text-2xl font-extrabold text-togo-green-600">{prod?.length ?? 0}</div>
            <div className="text-xs text-[var(--color-muted)]">modules à relire</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-extrabold text-togo-green-600">
              {totalPay.toLocaleString("fr-FR")} FCFA
            </div>
            <div className="text-xs text-[var(--color-muted)]">
              votre rémunération prévue (fixée par l&apos;administration)
            </div>
          </Card>
        </div>

        <div className="mt-6 space-y-4">
          {(prod ?? []).map((p: any) => {
            const cls = p.chapters?.class_slug ?? "";
            const versions = subsBy.get(p.chapter_id) ?? [];
            const myRevs = revsBy.get(p.chapter_id) ?? [];
            const latest = versions[0];
            const pay = p.inspector_cost_xof ?? inspectorPrice(cls);
            return (
              <Card key={p.chapter_id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={STAGE_TONE[p.stage as Stage]}>
                        {STAGE_LABEL[p.stage as Stage]}
                      </Badge>
                      <span className="font-semibold">{p.chapters?.title}</span>
                    </div>
                    <div className="mt-1 text-xs text-[var(--color-muted)]">
                      [{cls}] {p.chapters?.subject_key}
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

                {versions.length > 0 ? (
                  <ul className="mt-3 divide-y divide-[var(--color-line)] text-sm">
                    {versions.map((v: any) => (
                      <li key={v.version} className="flex items-center justify-between gap-3 py-2">
                        <span className="font-medium">Version {v.version}</span>
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
                ) : (
                  <p className="mt-3 text-sm text-[var(--color-muted)]">
                    Le concepteur n&apos;a pas encore soumis de version.
                  </p>
                )}

                {myRevs.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {myRevs.map((r: any, i: number) => (
                      <div key={i} className="rounded-lg bg-togo-green-50 p-3 text-sm">
                        <Badge tone={r.decision === "approved" ? "green" : "yellow"}>
                          v{r.version} · {r.decision === "approved" ? "Validé" : "Corrections demandées"}
                        </Badge>
                        <p className="mt-1 text-ink/90">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                )}

                {p.stage === "verification" && p.video_url ? (
                  <VideoReviewForm moduleId={p.chapter_id} videoUrl={p.video_url} />
                ) : (
                  latest && <ReviewForm moduleId={p.chapter_id} version={latest.version} />
                )}
              </Card>
            );
          })}
          {(prod ?? []).length === 0 && (
            <Card>
              <p className="text-sm text-[var(--color-muted)]">
                Aucun module ne vous est encore attribué pour relecture.
                L&apos;administration vous en confiera bientôt.
              </p>
            </Card>
          )}
        </div>
      </Container>
    </Section>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
