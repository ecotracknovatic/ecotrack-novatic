
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM (
  'super_admin',
  'org_admin',
  'project_manager',
  'field_officer',
  'member',
  'public_user'
);

CREATE TYPE public.project_status AS ENUM ('planning','active','on_hold','completed','archived');
CREATE TYPE public.tree_health AS ENUM ('healthy','at_risk','poor','dead');
CREATE TYPE public.verification_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.org_member_role AS ENUM ('owner','admin','manager','officer','member');

-- ============ updated_at helper ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============ Auto profile + default role on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ ORGANIZATIONS ============
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  country TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_orgs_updated BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ORG MEMBERS ============
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.org_member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Security-definer helpers (avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_org_member(_org UUID, _user UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id=_org AND user_id=_user)
$$;
CREATE OR REPLACE FUNCTION public.is_org_admin(_org UUID, _user UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id=_org AND user_id=_user AND role IN ('owner','admin'))
$$;

-- Org policies
CREATE POLICY "View orgs you belong to or all if super admin" ON public.organizations
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'super_admin') OR public.is_org_member(id, auth.uid()) OR created_by = auth.uid()
  );
CREATE POLICY "Authenticated users can create organizations" ON public.organizations
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Org admins can update org" ON public.organizations
  FOR UPDATE TO authenticated USING (public.is_org_admin(id, auth.uid()) OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Org owners can delete org" ON public.organizations
  FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(),'super_admin'));

-- Org-members policies
CREATE POLICY "Members view their org membership" ON public.organization_members
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_org_member(organization_id, auth.uid()));
CREATE POLICY "Org admins manage members" ON public.organization_members
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()) OR public.has_role(auth.uid(),'super_admin'));

-- Auto add creator as owner
CREATE OR REPLACE FUNCTION public.handle_new_org()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_new_org AFTER INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.handle_new_org();

-- ============ TREE SPECIES ============
CREATE TABLE public.tree_species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  common_name TEXT NOT NULL,
  scientific_name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tree_species TO authenticated, anon;
GRANT ALL ON public.tree_species TO service_role;
ALTER TABLE public.tree_species ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read species" ON public.tree_species FOR SELECT USING (true);
CREATE POLICY "Super admin manages species" ON public.tree_species FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

INSERT INTO public.tree_species (common_name, scientific_name) VALUES
  ('Mango','Mangifera indica'),
  ('Neem','Azadirachta indica'),
  ('Avocado','Persea americana'),
  ('Eucalyptus','Eucalyptus globulus'),
  ('Acacia','Acacia mearnsii'),
  ('Baobab','Adansonia digitata'),
  ('Oak','Quercus robur'),
  ('Pine','Pinus sylvestris'),
  ('Cedar','Cedrus deodara'),
  ('Bamboo','Bambusoideae');

-- ============ PROJECTS ============
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status public.project_status NOT NULL DEFAULT 'planning',
  location_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  target_trees INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  cover_image_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Org members view projects" ON public.projects FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Org members create projects" ON public.projects FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(organization_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Org admins/managers update projects" ON public.projects FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR created_by = auth.uid() OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Org admins delete projects" ON public.projects FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.has_role(auth.uid(),'super_admin'));

-- ============ TREES ============
CREATE TABLE public.trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  species_id UUID REFERENCES public.tree_species(id),
  tag_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  health public.tree_health NOT NULL DEFAULT 'healthy',
  height_cm INTEGER,
  diameter_cm INTEGER,
  planted_at DATE,
  notes TEXT,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  registered_by UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trees TO authenticated;
GRANT ALL ON public.trees TO service_role;
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_trees_updated BEFORE UPDATE ON public.trees FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Org members view trees" ON public.trees FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Org members register trees" ON public.trees FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(organization_id, auth.uid()) AND registered_by = auth.uid());
CREATE POLICY "Org members update trees" ON public.trees FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Org admins delete trees" ON public.trees FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()) OR public.has_role(auth.uid(),'super_admin'));

-- ============ TREE PHOTOS ============
CREATE TABLE public.tree_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.tree_photos TO authenticated;
GRANT ALL ON public.tree_photos TO service_role;
ALTER TABLE public.tree_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view tree photos" ON public.tree_photos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trees t WHERE t.id = tree_id AND (public.is_org_member(t.organization_id, auth.uid()) OR public.has_role(auth.uid(),'super_admin'))));
CREATE POLICY "Org members upload tree photos" ON public.tree_photos FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() AND EXISTS (SELECT 1 FROM public.trees t WHERE t.id = tree_id AND public.is_org_member(t.organization_id, auth.uid())));
CREATE POLICY "Uploader or org admin delete photo" ON public.tree_photos FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM public.trees t WHERE t.id = tree_id AND public.is_org_admin(t.organization_id, auth.uid())));

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System inserts notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
