-- 0023 : un tuteur peut lire le profil (nom, telephone) des eleves qui lui ont
-- demande une seance, pour pouvoir les recontacter. Policy SELECT additionnelle
-- (les policies permissives s'additionnent en OR).

create policy "tutor reads session students" on profiles for select
  using (
    exists (
      select 1 from tutor_sessions s
      where s.tutor_id = auth.uid() and s.student_id = profiles.id
    )
  );
