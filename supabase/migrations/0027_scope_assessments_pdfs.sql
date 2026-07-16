-- 0027 : appliquer le perimetre d'abonnement aussi aux epreuves et aux fiches
-- PDF (jusqu'ici sur le check large has_active_subscription).

-- Acces a une epreuve : on resout sa (classe, matiere) puis on delegue a
-- has_lesson_access. Une epreuve est rattachee soit a son chapitre (examen),
-- soit a son sous-chapitre -> chapitre (evaluation), soit directement a une
-- classe+matiere (examen final de cours, cf. 0015).
create or replace function public.has_assessment_access(
  uid uuid, p_assessment uuid
)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_lesson_access(uid, t.class_slug, t.subject_key)
  from (
    select
      coalesce(a.class_slug, cc.class_slug, csc.class_slug)   as class_slug,
      coalesce(a.subject_key, cc.subject_key, csc.subject_key) as subject_key
    from assessments a
    left join chapters cc     on cc.id = a.chapter_id
    left join subchapters s   on s.id = a.subchapter_id
    left join chapters csc    on csc.id = s.chapter_id
    where a.id = p_assessment
  ) t;
$$;

-- Fiches PDF : lecture reservee a un abonne dont le perimetre couvre la lecon
-- proprietaire de la fiche (rattachee par pdf_path = nom de l'objet storage).
drop policy if exists "subscribers read lesson pdfs" on storage.objects;
create policy "subscribers read lesson pdfs" on storage.objects
  for select using (
    bucket_id = 'lesson-pdfs'
    and exists (
      select 1
      from public.lessons l
      join public.chapters c on c.id = l.chapter_id
      where l.pdf_path = storage.objects.name
        and public.has_lesson_access(auth.uid(), c.class_slug, c.subject_key)
    )
  );
