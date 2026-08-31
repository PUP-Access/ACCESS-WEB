-- =============================================================================
-- Seed the admin@gmail.com account (ACCESS OPS) so a fresh database always
-- has one working Admin login, matching the account that already exists on
-- the original dev project. Complements 20260719000001_fix_admin_role_sync.sql,
-- which only *promotes* an existing admin@gmail.com row to Admin -- it has
-- nothing to promote on a database where nobody has ever signed up with
-- that email (e.g. a newly provisioned prod project).
--
-- No-op if a user with this email already exists (dev keeps its real
-- account/password untouched; only the final role UPDATE below runs there,
-- which is itself a harmless idempotent no-op if already Admin).
--
-- Password: set to a random value that is never recorded anywhere (not even
-- in this migration) and is therefore unusable. Whoever owns admin@gmail.com
-- must use "Forgot Password" on first login to set a real password -- keeps
-- no working credential in git history.
-- =============================================================================

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@gmail.com') THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at,
      confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      raw_app_meta_data, raw_user_meta_data,
      is_sso_user, is_anonymous, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'admin@gmail.com',
      extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')),
      now(),
      '', '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('organization_name', 'ACCESS OPS', 'email_verified', true),
      false, false, now(), now()
    );

    INSERT INTO auth.identities (
      id, provider_id, user_id, identity_data, provider, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id::text,
      v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', 'admin@gmail.com',
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(), now()
    );
  END IF;
END $$;

-- Promote to Admin (fires handle_update_user_role(), syncing the role into
-- auth.users.raw_app_meta_data). Idempotent: no-op if already Admin.
UPDATE public."Users"
SET role = 'Admin', updated_at = now()
WHERE email = 'admin@gmail.com'
  AND role IS DISTINCT FROM 'Admin';
