-- Run once in the Supabase SQL Editor of project bahavtlgfgpqmqmpedzc.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read own profile" ON public.profiles;
CREATE POLICY "Read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.create_owner_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(id, username)
  VALUES (NEW.id, lower(split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS create_owner_profile ON auth.users;
CREATE TRIGGER create_owner_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_owner_profile();

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read own roles" ON public.user_roles;
CREATE POLICY "Read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.grant_airiix_owner_role() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.username = 'air305' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS grant_airiix_owner_role ON public.profiles;
CREATE TRIGGER grant_airiix_owner_role AFTER INSERT OR UPDATE OF username ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.grant_airiix_owner_role();

GRANT SELECT ON public.commissions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.commissions TO authenticated;
GRANT ALL ON public.commissions TO service_role;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners manage their queue" ON public.commissions;
DROP POLICY IF EXISTS "Public queue read" ON public.commissions;
DROP POLICY IF EXISTS "Admin queue insert" ON public.commissions;
DROP POLICY IF EXISTS "Admin queue update" ON public.commissions;
DROP POLICY IF EXISTS "Admin queue delete" ON public.commissions;
CREATE POLICY "Public queue read" ON public.commissions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin queue insert" ON public.commissions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') AND user_id = auth.uid());
CREATE POLICY "Admin queue update" ON public.commissions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin queue delete" ON public.commissions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
