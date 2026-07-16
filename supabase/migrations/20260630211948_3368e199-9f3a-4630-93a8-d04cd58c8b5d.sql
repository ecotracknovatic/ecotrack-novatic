
-- 1. Profiles: restrict SELECT to self only
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- 2. Notifications: remove permissive insert; only service_role inserts
DROP POLICY IF EXISTS "System inserts notifications" ON public.notifications;

-- 3. SECURITY DEFINER function permissions
-- Trigger functions: revoke from everyone (only invoked by triggers as owner)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_org() FROM PUBLIC, anon, authenticated;
-- RLS helper functions: revoke from anon and PUBLIC (still needed by authenticated for RLS checks)
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_org_admin(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_org_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO authenticated;

-- 4. Storage RLS policies
-- avatars: path layout `<user_id>/...`
CREATE POLICY "Avatars: users read own"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatars: users insert own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatars: users update own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatars: users delete own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- tree-photos: path layout `<organization_id>/...`
CREATE POLICY "Tree photos: members read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'tree-photos' AND public.is_org_member(((storage.foldername(name))[1])::uuid, auth.uid()));
CREATE POLICY "Tree photos: members insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tree-photos' AND public.is_org_member(((storage.foldername(name))[1])::uuid, auth.uid()) AND owner = auth.uid());
CREATE POLICY "Tree photos: uploader update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'tree-photos' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'tree-photos' AND owner = auth.uid());
CREATE POLICY "Tree photos: uploader or admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'tree-photos' AND (owner = auth.uid() OR public.is_org_admin(((storage.foldername(name))[1])::uuid, auth.uid())));

-- org-logos: path layout `<organization_id>/...`
CREATE POLICY "Org logos: members read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'org-logos' AND public.is_org_member(((storage.foldername(name))[1])::uuid, auth.uid()));
CREATE POLICY "Org logos: admins insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'org-logos' AND public.is_org_admin(((storage.foldername(name))[1])::uuid, auth.uid()));
CREATE POLICY "Org logos: admins update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'org-logos' AND public.is_org_admin(((storage.foldername(name))[1])::uuid, auth.uid()))
  WITH CHECK (bucket_id = 'org-logos' AND public.is_org_admin(((storage.foldername(name))[1])::uuid, auth.uid()));
CREATE POLICY "Org logos: admins delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'org-logos' AND public.is_org_admin(((storage.foldername(name))[1])::uuid, auth.uid()));
