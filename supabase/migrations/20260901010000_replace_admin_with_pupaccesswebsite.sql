-- =============================================================================
-- Correction: 20260901000000_seed_admin_account.sql seeded the wrong email.
-- The real admin account for this org is pupaccesswebsite@gmail.com, not
-- admin@gmail.com. Never edit an already-applied migration -- this
-- supersedes it instead.
--
-- admin@gmail.com is handled safely rather than always hard-deleted: on a
-- database where it was only just created by the previous migration (no
-- real usage anywhere), it's removed outright. On a database where it's a
-- real, long-used account (e.g. dev: 100+ AuditLogs entries, borrow-request
-- reviews, SiteContent edits all attributed to it), deleting it would either
-- be blocked by foreign keys or destroy that attribution history -- so it's
-- demoted to Default instead, preserving every historical record's "who did
-- this" while removing its admin access. Determined automatically per
-- database by checking for any real references, not hardcoded per
-- environment.
--
-- pupaccesswebsite@gmail.com is seeded the same safe way as before: random,
-- unrecoverable password (never recorded, not even here) -- the account
-- owner must use "Forgot Password" on first login. No-op wherever it
-- already exists.
-- =============================================================================

DO $$
DECLARE
  v_admin_id uuid;
  v_has_refs boolean;
BEGIN
  SELECT id INTO v_admin_id FROM public."Users" WHERE email = 'admin@gmail.com';

  IF v_admin_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public."Events" WHERE created_by = v_admin_id
      UNION ALL SELECT 1 FROM public."Officers" WHERE user_id = v_admin_id
      UNION ALL SELECT 1 FROM public."BorrowRequests" WHERE user_id = v_admin_id OR reviewed_by = v_admin_id
      UNION ALL SELECT 1 FROM public."AuditLogs" WHERE user_id = v_admin_id
      UNION ALL SELECT 1 FROM public."SiteContent" WHERE updated_by = v_admin_id
    ) INTO v_has_refs;

    IF v_has_refs THEN
      UPDATE public."Users" SET role = 'Default', updated_at = now() WHERE id = v_admin_id;
    ELSE
      DELETE FROM public."Users" WHERE id = v_admin_id;
      DELETE FROM auth.users WHERE id = v_admin_id; -- cascades to auth.identities
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'pupaccesswebsite@gmail.com') THEN
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
      'pupaccesswebsite@gmail.com',
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
        'email', 'pupaccesswebsite@gmail.com',
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(), now()
    );
  END IF;
END $$;

UPDATE public."Users"
SET role = 'Admin', updated_at = now()
WHERE email = 'pupaccesswebsite@gmail.com'
  AND role IS DISTINCT FROM 'Admin';
