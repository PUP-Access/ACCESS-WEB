-- New private bucket dedicated to borrow-request formal letters.
-- Kept separate from access_web_assets (shared/public bucket) so that bucket's
-- public read policies for events/officers/site-content are never at risk.
--
-- Path convention: {userId}/{uuid}.{ext}

INSERT INTO storage.buckets (id, name, public)
VALUES ('request-letters', 'request-letters', false)
ON CONFLICT (id) DO NOTHING;

-- Owner can upload into their own folder (organization/default borrowers submitting requests).
CREATE POLICY "Owner can upload own request letters"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'request-letters'
  AND (
    is_admin()
    OR (
      is_authorized()
      AND (storage.foldername(name))[1] = (select auth.uid())::text
    )
  )
);

-- Owner can read their own letter object; admin can read any letter in the bucket.
CREATE POLICY "Owner and admin can view request letters"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'request-letters'
  AND (
    is_admin()
    OR (storage.foldername(name))[1] = (select auth.uid())::text
  )
);

-- Admin-only update/delete for cleanup/moderation.
CREATE POLICY "Admin can update request letters"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'request-letters' AND is_admin())
WITH CHECK (bucket_id = 'request-letters' AND is_admin());

CREATE POLICY "Admin can delete request letters"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'request-letters' AND is_admin());
