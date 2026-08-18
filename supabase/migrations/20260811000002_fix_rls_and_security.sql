-- =============================================================================
-- Fix: Apply missing RLS policies that were written to rls/ subdirectory
-- but never executed by the Supabase CLI (which only reads flat migration files).
-- Also revokes public EXECUTE on SECURITY DEFINER helper/trigger functions.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- ContactMessages
-- (policies from rls/ContactMessages_table.sql were never applied)
-- -----------------------------------------------------------------------------

ALTER TABLE "public"."ContactMessages" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit contact messages" ON "public"."ContactMessages";
CREATE POLICY "Anyone can submit contact messages"
    ON "public"."ContactMessages"
    FOR INSERT
    TO public
    WITH CHECK (true)
;

DROP POLICY IF EXISTS "Admins can read contact messages" ON "public"."ContactMessages";
CREATE POLICY "Admins can read contact messages"
    ON "public"."ContactMessages"
    FOR SELECT
    TO authenticated
    USING (is_admin())
;

DROP POLICY IF EXISTS "Admins can update contact messages" ON "public"."ContactMessages";
CREATE POLICY "Admins can update contact messages"
    ON "public"."ContactMessages"
    FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin())
;


-- -----------------------------------------------------------------------------
-- FAQItems
-- (policies from rls/FAQItems_table.sql were never applied)
-- -----------------------------------------------------------------------------

ALTER TABLE "public"."FAQItems" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active faqs" ON "public"."FAQItems";
CREATE POLICY "Public can read active faqs"
    ON "public"."FAQItems"
    FOR SELECT
    TO public
    USING (is_active = true)
;

DROP POLICY IF EXISTS "Admins can read all faqs" ON "public"."FAQItems";
CREATE POLICY "Admins can read all faqs"
    ON "public"."FAQItems"
    FOR SELECT
    TO authenticated
    USING (is_admin())
;

DROP POLICY IF EXISTS "Admins can insert faqs" ON "public"."FAQItems";
CREATE POLICY "Admins can insert faqs"
    ON "public"."FAQItems"
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin())
;

DROP POLICY IF EXISTS "Admins can update faqs" ON "public"."FAQItems";
CREATE POLICY "Admins can update faqs"
    ON "public"."FAQItems"
    FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin())
;

DROP POLICY IF EXISTS "Admins can delete faqs" ON "public"."FAQItems";
CREATE POLICY "Admins can delete faqs"
    ON "public"."FAQItems"
    FOR DELETE
    TO authenticated
    USING (is_admin())
;


-- -----------------------------------------------------------------------------
-- SiteContent
-- (policies from rls/SiteContent_table.sql were never applied)
-- -----------------------------------------------------------------------------

ALTER TABLE "public"."SiteContent" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read site content" ON "public"."SiteContent";
CREATE POLICY "Public can read site content"
    ON "public"."SiteContent"
    FOR SELECT
    TO public
    USING (true)
;

DROP POLICY IF EXISTS "Admins can insert site content" ON "public"."SiteContent";
CREATE POLICY "Admins can insert site content"
    ON "public"."SiteContent"
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin())
;

DROP POLICY IF EXISTS "Admins can update site content" ON "public"."SiteContent";
CREATE POLICY "Admins can update site content"
    ON "public"."SiteContent"
    FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin())
;


-- -----------------------------------------------------------------------------
-- Storage policies are already applied via 20260719000003_fix_storage_rls.sql.
-- Skipped here to avoid conflicts.
-- -----------------------------------------------------------------------------


-- handle_new_user() and handle_update_user_role(): trigger-only functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_update_user_role() FROM anon, authenticated;

-- log_audit_event(): keep GRANT to authenticated (app calls this explicitly),
-- but revoke from anon
REVOKE EXECUTE ON FUNCTION public.log_audit_event(
    p_action character varying,
    p_entity_type character varying,
    p_entity_id uuid,
    p_state_changes jsonb
) FROM anon;

-- rls_auto_enable(): utility/DDL function, not a user-facing RPC
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
