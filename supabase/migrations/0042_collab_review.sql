-- 0042 : Phase 2 de l'espace collaboratif.
-- Attribution d'un module a un/des inspecteurs, observations/decisions de
-- relecture, et prix inspecteur negociable par l'admin.

-- Attribution module -> inspecteur (plusieurs possibles)
create table module_inspectors (
  chapter_id  uuid not null references chapters (id) on delete cascade,
  inspector_id uuid not null references profiles (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (chapter_id, inspector_id)
);
alter table module_inspectors enable row level security;
create policy "admin manages module_inspectors" on module_inspectors
  for all using (public.is_admin()) with check (public.is_admin());
create policy "inspector reads own assignments" on module_inspectors
  for select using (inspector_id = auth.uid());

-- Observations / decisions de relecture, rattachees a une version soumise
create table content_reviews (
  id          uuid primary key default gen_random_uuid(),
  chapter_id  uuid not null references chapters (id) on delete cascade,
  version     int not null,
  inspector_id uuid references profiles (id) on delete set null,
  comment     text not null,
  decision    text not null check (decision in ('changes_requested', 'approved')),
  created_at  timestamptz not null default now()
);
create index content_reviews_chapter_idx on content_reviews (chapter_id, version);

alter table content_reviews enable row level security;
create policy "admin manages reviews" on content_reviews
  for all using (public.is_admin()) with check (public.is_admin());
-- L'inspecteur attribue depose et voit ses relectures
create policy "assigned inspector writes reviews" on content_reviews
  for insert with check (
    inspector_id = auth.uid()
    and exists (
      select 1 from module_inspectors mi
      where mi.chapter_id = content_reviews.chapter_id
        and mi.inspector_id = auth.uid()
    )
  );
create policy "inspector reads own reviews" on content_reviews
  for select using (inspector_id = auth.uid());
-- Le concepteur du module lit les relectures de son module
create policy "concepteur reads module reviews" on content_reviews
  for select using (
    exists (
      select 1 from content_production cp
      where cp.chapter_id = content_reviews.chapter_id
        and cp.concepteur_id = auth.uid()
    )
  );

-- Prix inspecteur negociable par l'admin (sinon: bareme)
alter table content_production
  add column if not exists inspector_cost_xof int;

-- L'inspecteur attribue peut lire le suivi et les soumissions de ses modules
create policy "assigned inspector reads production" on content_production
  for select using (
    exists (
      select 1 from module_inspectors mi
      where mi.chapter_id = content_production.chapter_id
        and mi.inspector_id = auth.uid()
    )
  );
create policy "assigned inspector reads submissions" on content_submissions
  for select using (
    exists (
      select 1 from module_inspectors mi
      where mi.chapter_id = content_submissions.chapter_id
        and mi.inspector_id = auth.uid()
    )
  );
