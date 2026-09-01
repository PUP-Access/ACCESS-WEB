-- =============================================================================
-- Admin dashboard RBAC: remove the unused 'Default' role, add three scoped
-- admin sub-roles (Tech, SponsorsPartners, Govs) that each get access to a
-- subset of /admin/* pages rather than the all-or-nothing Admin gate.
--
-- Postgres has no ALTER TYPE ... DROP VALUE, so this swaps in a new enum
-- type: reassign any existing 'Default' rows first (none expected in normal
-- use -- it was never assigned by any signup path -- but handled safely for
-- any environment where it was set manually), then recreate the column
-- against a type built from scratch, then drop+rename.
-- =============================================================================

-- 1) Reassign any existing 'Default' rows before the type swap (Pending is
--    the closest equivalent: no elevated access, awaiting real assignment).
UPDATE public."Users" SET role = 'Pending' WHERE role = 'Default';

-- 2) Build the replacement type and swap the column onto it. The
--    on_auth_user_role_update trigger is declared "AFTER UPDATE OF role",
--    which Postgres treats as a dependency on the column's type -- drop and
--    recreate it around the ALTER (same definition, unchanged).
CREATE TYPE "user_role_new" AS ENUM (
  'Admin',
  'Organization',
  'Pending',
  'Tech',
  'SponsorsPartners',
  'Govs'
);

DROP TRIGGER IF EXISTS on_auth_user_role_update ON public."Users";

-- The three Notifications policies (20260831222400_notifications_schema.sql)
-- check "role = 'Admin'" inline rather than via is_admin()/is_authorized(),
-- which makes Postgres treat them as depending on the column's type. Drop
-- and recreate them verbatim around the ALTER.
DROP POLICY IF EXISTS "Admins can select notifications" ON public."Notifications";
DROP POLICY IF EXISTS "Admins can update notifications" ON public."Notifications";
DROP POLICY IF EXISTS "Admins can delete notifications" ON public."Notifications";

ALTER TABLE "Users"
  ALTER COLUMN "role" TYPE "user_role_new"
  USING (role::text::"user_role_new");

DROP TYPE "user_role";
ALTER TYPE "user_role_new" RENAME TO "user_role";

CREATE TRIGGER on_auth_user_role_update
  AFTER UPDATE OF role ON public."Users"
  FOR EACH ROW EXECUTE PROCEDURE public.handle_update_user_role();

CREATE POLICY "Admins can select notifications"
  ON public."Notifications"
  FOR SELECT
  USING (
    exists (
      SELECT 1 FROM public."Users"
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Admins can update notifications"
  ON public."Notifications"
  FOR UPDATE
  USING (
    exists (
      SELECT 1 FROM public."Users"
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Admins can delete notifications"
  ON public."Notifications"
  FOR DELETE
  USING (
    exists (
      SELECT 1 FROM public."Users"
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- 3) is_authorized() gated borrow-request eligibility on ('Organization',
--    'Default'); drop the now-nonexistent 'Default' branch. Tech/
--    SponsorsPartners/Govs are internal admin-dashboard roles, not borrowing
--    orgs, so they are intentionally not added here.
CREATE OR REPLACE FUNCTION is_authorized()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "public"."Users"
    WHERE id = auth.uid()
    AND role = 'Organization'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
