
-- 1. Extend organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS city text;

-- 2. Invitations table
CREATE TYPE public.invitation_status AS ENUM ('pending','accepted','revoked','expired');

CREATE TABLE public.organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.org_member_role NOT NULL DEFAULT 'member',
  status public.invitation_status NOT NULL DEFAULT 'pending',
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE (organization_id, email, status)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_invitations TO authenticated;
GRANT ALL ON public.organization_invitations TO service_role;

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins manage invitations"
  ON public.organization_invitations
  FOR ALL
  TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "Invitee can view own invitations"
  ON public.organization_invitations
  FOR SELECT
  TO authenticated
  USING (lower(email) = lower(coalesce((auth.jwt() ->> 'email'),'')));

CREATE TRIGGER trg_invitations_updated
  BEFORE UPDATE ON public.organization_invitations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. get_org_members
CREATE OR REPLACE FUNCTION public.get_org_members(_org uuid)
RETURNS TABLE (
  member_id uuid,
  user_id uuid,
  role public.org_member_role,
  full_name text,
  email text,
  avatar_url text,
  joined_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id, m.user_id, m.role, p.full_name, p.email, p.avatar_url, m.created_at
  FROM public.organization_members m
  LEFT JOIN public.profiles p ON p.id = m.user_id
  WHERE m.organization_id = _org
    AND (public.is_org_member(_org, auth.uid()) OR public.has_role(auth.uid(),'super_admin'))
  ORDER BY m.created_at;
$$;

GRANT EXECUTE ON FUNCTION public.get_org_members(uuid) TO authenticated;

-- 4. invite_org_member
CREATE OR REPLACE FUNCTION public.invite_org_member(_org uuid, _email text, _role public.org_member_role DEFAULT 'member')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_invitation_id uuid;
BEGIN
  IF NOT (public.is_org_admin(_org, auth.uid()) OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT id INTO v_user FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1;

  IF v_user IS NOT NULL THEN
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (_org, v_user, _role)
    ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role;
    RETURN jsonb_build_object('added', true, 'user_id', v_user);
  END IF;

  INSERT INTO public.organization_invitations (organization_id, email, role, invited_by)
  VALUES (_org, lower(_email), _role, auth.uid())
  ON CONFLICT (organization_id, email, status) DO UPDATE SET role = EXCLUDED.role, updated_at = now()
  RETURNING id INTO v_invitation_id;

  RETURN jsonb_build_object('invited', true, 'invitation_id', v_invitation_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.invite_org_member(uuid, text, public.org_member_role) TO authenticated;

-- 5. accept_org_invitation
CREATE OR REPLACE FUNCTION public.accept_org_invitation(_token uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.organization_invitations%ROWTYPE;
  v_email text;
BEGIN
  SELECT auth.jwt() ->> 'email' INTO v_email;

  SELECT * INTO v_inv FROM public.organization_invitations
  WHERE token = _token AND status = 'pending';

  IF v_inv.id IS NULL THEN RAISE EXCEPTION 'Invitation not found or no longer valid'; END IF;
  IF lower(v_inv.email) <> lower(v_email) THEN RAISE EXCEPTION 'This invitation belongs to a different email'; END IF;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_inv.organization_id, auth.uid(), v_inv.role)
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  UPDATE public.organization_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = v_inv.id;

  RETURN v_inv.organization_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_org_invitation(uuid) TO authenticated;

-- 6. remove_org_member
CREATE OR REPLACE FUNCTION public.remove_org_member(_org uuid, _user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_org_admin(_org, auth.uid()) OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id=_org AND user_id=_user AND role='owner') THEN
    RAISE EXCEPTION 'Owners cannot be removed';
  END IF;
  DELETE FROM public.organization_members WHERE organization_id=_org AND user_id=_user;
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_org_member(uuid, uuid) TO authenticated;

-- 7. update_org_member_role
CREATE OR REPLACE FUNCTION public.update_org_member_role(_org uuid, _user uuid, _role public.org_member_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_org_admin(_org, auth.uid()) OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id=_org AND user_id=_user AND role='owner') THEN
    RAISE EXCEPTION 'Cannot change owner role';
  END IF;
  UPDATE public.organization_members SET role=_role WHERE organization_id=_org AND user_id=_user;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_org_member_role(uuid, uuid, public.org_member_role) TO authenticated;
