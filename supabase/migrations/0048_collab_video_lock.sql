-- 0048 : Phase 3 de l'espace collaboratif.
-- - Video produite attachee au module + controle qualite final (concepteur +
--   inspecteurs valident ou signalent des erreurs).
-- - Cloture/verrouillage : l'admin retire les droits ; le module verrouille
--   disparait des espaces concepteur/inspecteur. Reouverture = nouveau cycle.

alter table content_production
  add column if not exists video_url  text,
  add column if not exists locked_at  timestamptz,
  add column if not exists locked_by  uuid references profiles (id) on delete set null;

-- Une relecture peut porter sur le CONTENU (defaut) ou sur la VIDEO produite.
alter table content_reviews
  add column if not exists on_video boolean not null default false;

-- RLS : un module VERROUILLE n'est plus visible par le concepteur ni l'inspecteur.
drop policy if exists "assigned concepteur reads production" on content_production;
create policy "assigned concepteur reads production" on content_production
  for select using (concepteur_id = auth.uid() and locked_at is null);

drop policy if exists "assigned inspector reads production" on content_production;
create policy "assigned inspector reads production" on content_production
  for select using (
    locked_at is null and exists (
      select 1 from module_inspectors mi
      where mi.chapter_id = content_production.chapter_id
        and mi.inspector_id = auth.uid()
    )
  );

-- Le concepteur attribue peut aussi deposer une relecture VIDEO (controle final).
create policy "assigned concepteur writes video reviews" on content_reviews
  for insert with check (
    on_video = true
    and inspector_id = auth.uid()
    and exists (
      select 1 from content_production cp
      where cp.chapter_id = content_reviews.chapter_id
        and cp.concepteur_id = auth.uid()
        and cp.locked_at is null
    )
  );
