-- =============================================================================
-- Fix and Consolidate Storage RLS Policies for access_web_assets
--
-- Subfolders in access_web_assets:
--   - events/         -> Public read, Admin write (insert, update, delete)
--   - officers/       -> Public read, Admin write (insert, update, delete)
--   - site-content/   -> Public read, Admin write (insert, update, delete)
--   - borrow-letters/ -> Private: Admin read/write, user read/insert own folder (borrow-letters/<user_id>/...)
--
-- Fixes:
--   1. Fix foldername index bug: borrow letters path is borrow-letters/<user_id>/<file>,
--      so the user ID is index 2 of storage.foldername(name), not index 1.
--   2. Consolidate multiple permissive policies on storage.objects to avoid performance warnings.
--   3. Use (select auth.uid()) for initplan optimization.
--   4. Ensure full CRUD permissions for admins across all public asset folders.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Drop existing legacy and fragmented storage policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete event images" ON storage.objects;

DROP POLICY IF EXISTS "Public can view site content images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload site content images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update site content images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete site content images" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can upload borrow letters" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own borrow letters" ON storage.objects;

DROP POLICY IF EXISTS "Public can view public storage assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all storage assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload storage assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update storage assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete storage assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload own borrow letters" ON storage.objects;
DROP POLICY IF EXISTS "Users and admins can view own borrow letters" ON storage.objects;

-- -----------------------------------------------------------------------------
-- 2. Public Read Policy for Public Assets (events, officers, site-content)
-- -----------------------------------------------------------------------------
CREATE POLICY "Public can view public storage assets"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'access_web_assets'
  AND (
    name LIKE 'events/%'
    OR name LIKE 'officers/%'
    OR name LIKE 'site-content/%'
  )
);

-- -----------------------------------------------------------------------------
-- 3. Borrow Letters Policies (Private & Scoped to Owner / Admin)
-- Path format: borrow-letters/<user_id>/<file>
-- -----------------------------------------------------------------------------
CREATE POLICY "Users and admins can view own borrow letters"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'access_web_assets'
  AND name LIKE 'borrow-letters/%'
  AND (
    is_admin()
    OR (storage.foldername(name))[2] = (select auth.uid())::text
    OR name LIKE 'borrow-letters/' || (select auth.uid())::text || '/%'
  )
);

CREATE POLICY "Authenticated users can upload own borrow letters"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'access_web_assets'
  AND name LIKE 'borrow-letters/%'
  AND (
    is_admin()
    OR (
      is_authorized()
      AND (
        (storage.foldername(name))[2] = (select auth.uid())::text
        OR name LIKE 'borrow-letters/' || (select auth.uid())::text || '/%'
      )
    )
  )
);

-- -----------------------------------------------------------------------------
-- 4. Admin CRUD Policies for all assets in access_web_assets
-- -----------------------------------------------------------------------------
CREATE POLICY "Admins can upload storage assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'access_web_assets'
  AND is_admin()
);

CREATE POLICY "Admins can update storage assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'access_web_assets'
  AND is_admin()
)
WITH CHECK (
  bucket_id = 'access_web_assets'
  AND is_admin()
);

CREATE POLICY "Admins can delete storage assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'access_web_assets'
  AND is_admin()
);
