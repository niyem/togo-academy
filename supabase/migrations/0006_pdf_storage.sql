-- 0006 : bucket prive pour les fiches PDF, lecture reservee aux abonnes.
-- L'ecriture passe par la cle service (administration) uniquement.

insert into storage.buckets (id, name, public)
values ('lesson-pdfs', 'lesson-pdfs', false)
on conflict (id) do nothing;

drop policy if exists "subscribers read lesson pdfs" on storage.objects;
create policy "subscribers read lesson pdfs" on storage.objects
  for select using (
    bucket_id = 'lesson-pdfs'
    and public.has_active_subscription(auth.uid())
  );
