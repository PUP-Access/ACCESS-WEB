-- =============================================================================
-- Cleanup: 20260901010000_replace_admin_with_pupaccesswebsite.sql's final
-- UPDATE ... WHERE email = 'pupaccesswebsite@gmail.com' incidentally
-- promoted an orphaned public.Users row (id 5e87f503-..., created
-- 2026-08-22, no matching auth.users row at all -- pre-existing dead data
-- unrelated to that migration, discovered only because it happened to share
-- the same email as the real account that migration just created) to Admin,
-- since the UPDATE matched on email, not id.
--
-- An orphaned Users row has no auth.users row backing it, so it can never
-- actually log in -- it's inert regardless of its role. This removes any
-- such row that has zero references elsewhere (verified for the row above:
-- zero rows in Events/Officers/BorrowRequests/AuditLogs/SiteContent/
-- Notifications). An orphan that *does* have references is left alone
-- rather than guessed at.
-- =============================================================================

DO $$
DECLARE
  r record;
  v_has_refs boolean;
BEGIN
  FOR r IN
    SELECT u.id FROM public."Users" u
    WHERE NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = u.id)
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public."Events" WHERE created_by = r.id
      UNION ALL SELECT 1 FROM public."Officers" WHERE user_id = r.id
      UNION ALL SELECT 1 FROM public."BorrowRequests" WHERE user_id = r.id OR reviewed_by = r.id
      UNION ALL SELECT 1 FROM public."AuditLogs" WHERE user_id = r.id
      UNION ALL SELECT 1 FROM public."SiteContent" WHERE updated_by = r.id
      UNION ALL SELECT 1 FROM public."Notifications" WHERE user_id = r.id
    ) INTO v_has_refs;

    IF NOT v_has_refs THEN
      DELETE FROM public."Users" WHERE id = r.id;
    END IF;
  END LOOP;
END $$;
