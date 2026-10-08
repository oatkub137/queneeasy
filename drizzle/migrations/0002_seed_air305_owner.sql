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

DO $$
DECLARE
  owner_id uuid;
  password_hash text;
BEGIN
  BEGIN
    password_hash := extensions.crypt('080808', extensions.gen_salt('bf', 10));
  EXCEPTION WHEN undefined_function THEN
    password_hash := crypt('080808', gen_salt('bf', 10));
  END;

  SELECT id INTO owner_id FROM auth.users WHERE email = 'air305@owner.airiix.local';

  IF owner_id IS NULL THEN
    owner_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change,
      email_change_token_new
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      owner_id,
      'authenticated',
      'authenticated',
      'air305@owner.airiix.local',
      password_hash,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  ELSE
    UPDATE auth.users
    SET encrypted_password = password_hash,
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = owner_id;
  END IF;

  BEGIN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    SELECT
      gen_random_uuid(),
      owner_id,
      jsonb_build_object('sub', owner_id::text, 'email', 'air305@owner.airiix.local'),
      'email',
      owner_id::text,
      now(),
      now(),
      now()
    WHERE NOT EXISTS (
      SELECT 1 FROM auth.identities WHERE user_id = owner_id AND provider = 'email'
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'owner identity already present or skipped: %', SQLERRM;
  END;

  INSERT INTO public.profiles (id, username)
  VALUES (owner_id, 'air305')
  ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (owner_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
