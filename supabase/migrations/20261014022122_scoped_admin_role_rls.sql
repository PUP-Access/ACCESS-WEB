-- =============================================================================
-- Scoped admin roles (Tech, SponsorsPartners, Govs) at the RLS layer.
--
-- 20260901141921_update_user_role_enum.sql added these roles and the app layer
-- (src/utils/adminAccess.ts ROLE_AREAS, proxy.ts, checkRole) lets them into
-- their admin areas, but every RLS policy still gated on is_admin(), which is
-- true for 'Admin' only. Services that query through the user-scoped server
-- client therefore saw zero rows / had writes rejected, e.g. Tech got an empty
-- /admin/borrow-requests and could not approve anything.
--
-- is_admin() is deliberately left unchanged: it also guards Users UPDATE,
-- SiteContent, FAQItems, etc. Widening it would let any scoped role rewrite
-- other users' roles. Instead, each affected policy gets an extra branch for
-- exactly the roles that own that area. Keep these in sync with ROLE_AREAS.
--
--   Tech  -> borrow-requests, inventory      (BorrowRequests, BorrowRequestItems,
--                                              Assets, request letters, borrow
--                                              AuditLogs)
--   Govs  -> events, officers                (Events, Officers, events/ and
--                                              officers/ images in storage)
--   All scoped roles -> notifications for the areas they can open.
--
-- Areas whose services use the service-role client (contact messages, FAQs,
-- site content, sponsors/partners, officer hierarchy) need no policy change.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1) Helpers
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.has_role_in(allowed_roles public.user_role[])
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM "public"."Users"
    WHERE id = (select auth.uid()) AND role = ANY (allowed_roles)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Admin + Tech: borrow-requests and inventory areas.
CREATE OR REPLACE FUNCTION public.can_manage_borrowing()
RETURNS boolean AS $$
  SELECT public.has_role_in(ARRAY['Admin', 'Tech']::public.user_role[]);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Admin + Govs: events and officers areas.
CREATE OR REPLACE FUNCTION public.can_manage_events_officers()
RETURNS boolean AS $$
  SELECT public.has_role_in(ARRAY['Admin', 'Govs']::public.user_role[]);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.has_role_in(public.user_role[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_manage_borrowing() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_manage_events_officers() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role_in(public.user_role[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_borrowing() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_events_officers() TO anon, authenticated;


-- -----------------------------------------------------------------------------
-- 2) Borrowing (Admin + Tech)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authorized user can view own requests, Admins can view all" ON "public"."BorrowRequests";
CREATE POLICY "Authorized user can view own requests, Admins can view all"
    ON "public"."BorrowRequests"
    FOR SELECT
    TO authenticated
    USING (
        ((select auth.uid()) = user_id AND is_authorized())
        OR can_manage_borrowing()
    )
;

DROP POLICY IF EXISTS "Users and admins can update borrow requests" ON "public"."BorrowRequests";
CREATE POLICY "Users and admins can update borrow requests"
    ON "public"."BorrowRequests"
    FOR UPDATE
    TO authenticated
    USING (
        can_manage_borrowing()
        OR ((select auth.uid()) = user_id AND is_authorized() AND status = 'Pending')
    )
    WITH CHECK (
        can_manage_borrowing()
        OR ((select auth.uid()) = user_id AND is_authorized() AND status = 'Cancelled')
    )
;

DROP POLICY IF EXISTS "Users and admins can select request items" ON "public"."BorrowRequestItems";
CREATE POLICY "Users and admins can select request items"
    ON "public"."BorrowRequestItems"
    FOR SELECT
    TO authenticated
    USING (
        can_manage_borrowing()
        OR EXISTS (
            SELECT 1 FROM "public"."BorrowRequests" br
            WHERE br.id = borrow_request_id
            AND br.user_id = (select auth.uid())
        )
    )
;

DROP POLICY IF EXISTS "Users and admins can insert request items" ON "public"."BorrowRequestItems";
CREATE POLICY "Users and admins can insert request items"
    ON "public"."BorrowRequestItems"
    FOR INSERT
    TO authenticated
    WITH CHECK (
        can_manage_borrowing()
        OR EXISTS (
            SELECT 1 FROM "public"."BorrowRequests" br
            WHERE br.id = borrow_request_id
            AND br.user_id = (select auth.uid())
            AND br.status = 'Pending'
        )
    )
;

DROP POLICY IF EXISTS "Hide soft deleted assets for non-admin users" ON "public"."Assets";
CREATE POLICY "Hide soft deleted assets for non-admin users"
    ON "public"."Assets"
    AS RESTRICTIVE
    FOR SELECT
    TO authenticated
    USING (is_deleted = false OR can_manage_borrowing())
;

DROP POLICY IF EXISTS "Only admins can create assets" ON "public"."Assets";
CREATE POLICY "Only admins can create assets"
    ON "public"."Assets"
    FOR INSERT
    TO authenticated
    WITH CHECK (can_manage_borrowing() AND is_deleted = false)
;

DROP POLICY IF EXISTS "Only admins can update assets" ON "public"."Assets";
CREATE POLICY "Only admins can update assets"
    ON "public"."Assets"
    FOR UPDATE
    TO authenticated
    USING (can_manage_borrowing())
    WITH CHECK (can_manage_borrowing())
;

-- Tech reads only borrow-request audit entries (overdue-detection dedup in
-- detectAndLogOverdueBorrowRequests); the full audit log stays Admin-only.
DROP POLICY IF EXISTS "Users and admins can select audit logs" ON "public"."AuditLogs";
CREATE POLICY "Users and admins can select audit logs"
    ON "public"."AuditLogs"
    FOR SELECT
    TO authenticated
    USING (
        (select auth.uid()) = user_id
        OR is_admin()
        OR (entity_type = 'BorrowRequest' AND can_manage_borrowing())
    )
;

-- Request letters (private bucket)
DROP POLICY IF EXISTS "Owner can upload own request letters" ON storage.objects;
CREATE POLICY "Owner can upload own request letters"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'request-letters'
  AND (
    can_manage_borrowing()
    OR (
      is_authorized()
      AND (storage.foldername(name))[1] = (select auth.uid())::text
    )
  )
);

DROP POLICY IF EXISTS "Owner and admin can view request letters" ON storage.objects;
CREATE POLICY "Owner and admin can view request letters"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'request-letters'
  AND (
    can_manage_borrowing()
    OR (storage.foldername(name))[1] = (select auth.uid())::text
  )
);

DROP POLICY IF EXISTS "Admin can update request letters" ON storage.objects;
CREATE POLICY "Admin can update request letters"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'request-letters' AND can_manage_borrowing())
WITH CHECK (bucket_id = 'request-letters' AND can_manage_borrowing());

DROP POLICY IF EXISTS "Admin can delete request letters" ON storage.objects;
CREATE POLICY "Admin can delete request letters"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'request-letters' AND can_manage_borrowing());

-- Legacy borrow letters stored in access_web_assets/borrow-letters/
DROP POLICY IF EXISTS "Users and admins can view own borrow letters" ON storage.objects;
CREATE POLICY "Users and admins can view own borrow letters"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'access_web_assets'
  AND name LIKE 'borrow-letters/%'
  AND (
    can_manage_borrowing()
    OR (storage.foldername(name))[2] = (select auth.uid())::text
    OR name LIKE 'borrow-letters/' || (select auth.uid())::text || '/%'
  )
);


-- -----------------------------------------------------------------------------
-- 3) Events & officers (Admin + Govs)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users and admins can select events" ON "public"."Events";
CREATE POLICY "Authenticated users and admins can select events"
    ON "public"."Events"
    FOR SELECT
    TO authenticated
    USING (can_manage_events_officers() OR status = 'Published')
;

DROP POLICY IF EXISTS "Admins can insert events" ON "public"."Events";
CREATE POLICY "Admins can insert events"
    ON "public"."Events"
    FOR INSERT
    TO authenticated
    WITH CHECK (can_manage_events_officers())
;

DROP POLICY IF EXISTS "Admins can update events" ON "public"."Events";
CREATE POLICY "Admins can update events"
    ON "public"."Events"
    FOR UPDATE
    TO authenticated
    USING (can_manage_events_officers())
    WITH CHECK (can_manage_events_officers())
;

DROP POLICY IF EXISTS "Admins can delete events" ON "public"."Events";
CREATE POLICY "Admins can delete events"
    ON "public"."Events"
    FOR DELETE
    TO authenticated
    USING (can_manage_events_officers())
;

DROP POLICY IF EXISTS "Only admins can add new officers" ON "public"."Officers";
CREATE POLICY "Only admins can add new officers"
    ON "public"."Officers"
    FOR INSERT
    TO authenticated
    WITH CHECK (can_manage_events_officers())
;

DROP POLICY IF EXISTS "Only admins can update officers" ON "public"."Officers";
CREATE POLICY "Only admins can update officers"
    ON "public"."Officers"
    FOR UPDATE
    TO authenticated
    USING (can_manage_events_officers())
    WITH CHECK (can_manage_events_officers())
;

-- access_web_assets: Admin keeps full CRUD; Govs only under events/ and officers/.
DROP POLICY IF EXISTS "Admins can upload storage assets" ON storage.objects;
CREATE POLICY "Admins can upload storage assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'access_web_assets'
  AND (
    is_admin()
    OR (can_manage_events_officers() AND (name LIKE 'events/%' OR name LIKE 'officers/%'))
  )
);

DROP POLICY IF EXISTS "Admins can update storage assets" ON storage.objects;
CREATE POLICY "Admins can update storage assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'access_web_assets'
  AND (
    is_admin()
    OR (can_manage_events_officers() AND (name LIKE 'events/%' OR name LIKE 'officers/%'))
  )
)
WITH CHECK (
  bucket_id = 'access_web_assets'
  AND (
    is_admin()
    OR (can_manage_events_officers() AND (name LIKE 'events/%' OR name LIKE 'officers/%'))
  )
);

DROP POLICY IF EXISTS "Admins can delete storage assets" ON storage.objects;
CREATE POLICY "Admins can delete storage assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'access_web_assets'
  AND (
    is_admin()
    OR (can_manage_events_officers() AND (name LIKE 'events/%' OR name LIKE 'officers/%'))
  )
);


-- -----------------------------------------------------------------------------
-- 4) Notifications: each role sees only the types for areas it can open.
--    borrow_request    -> Admin, Tech        (borrow-requests)
--    contact_message   -> all admin roles    (contact-messages)
--    user_registration -> Admin              (users)
--    anything else     -> Admin
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_see_notification(notification_type text)
RETURNS boolean AS $$
  SELECT CASE notification_type
    WHEN 'borrow_request' THEN public.can_manage_borrowing()
    WHEN 'contact_message' THEN public.has_role_in(
      ARRAY['Admin', 'Tech', 'SponsorsPartners', 'Govs']::public.user_role[]
    )
    ELSE public.is_admin()
  END;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.can_see_notification(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_see_notification(text) TO authenticated;

DROP POLICY IF EXISTS "Admins can select notifications" ON public."Notifications";
CREATE POLICY "Admins can select notifications"
  ON public."Notifications"
  FOR SELECT
  TO authenticated
  USING (can_see_notification(type));

DROP POLICY IF EXISTS "Admins can update notifications" ON public."Notifications";
CREATE POLICY "Admins can update notifications"
  ON public."Notifications"
  FOR UPDATE
  TO authenticated
  USING (can_see_notification(type))
  WITH CHECK (can_see_notification(type));

DROP POLICY IF EXISTS "Admins can delete notifications" ON public."Notifications";
CREATE POLICY "Admins can delete notifications"
  ON public."Notifications"
  FOR DELETE
  TO authenticated
  USING (can_see_notification(type));
