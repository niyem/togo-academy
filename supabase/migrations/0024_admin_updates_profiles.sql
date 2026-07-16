-- 0024 : l'admin peut mettre a jour n'importe quel profil (ex : accorder le
-- role 'tutor' a l'approbation d'une candidature). Jusqu'ici la policy UPDATE
-- se limitait a "id = auth.uid()", empechant l'admin d'agir sur autrui.
-- Le trigger profiles_role_guard autorise deja le changement de role si
-- is_admin() ; il faut donc que l'ecriture vienne d'une session admin
-- authentifiee (pas de la cle service, ou auth.uid() est nul).

alter policy "update own profile" on public.profiles
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
