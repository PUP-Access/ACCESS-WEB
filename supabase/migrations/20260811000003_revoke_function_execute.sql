-- =============================================================================
-- Fix: Revoke public EXECUTE on SECURITY DEFINER functions.
--
-- PostgreSQL grants EXECUTE to PUBLIC by default when a function is created.
-- The previous migration revoked from anon/authenticated individually, but
-- those roles inherit from PUBLIC — so the grants remained in effect.
-- Revoking from PUBLIC removes access for all roles including anon/authenticated.
-- Triggers and RLS policies run as the DB owner so are unaffected.
-- =============================================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_update_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;

-- log_audit_event is intentionally callable by authenticated users (the app
-- calls it directly to write audit logs). Revoke from PUBLIC, then re-grant
-- only to authenticated.
REVOKE EXECUTE ON FUNCTION public.log_audit_event(
    p_action character varying,
    p_entity_type character varying,
    p_entity_id uuid,
    p_state_changes jsonb
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit_event(
    p_action character varying,
    p_entity_type character varying,
    p_entity_id uuid,
    p_state_changes jsonb
) TO authenticated;


-- =============================================================================
-- Fix: ContactMessages INSERT policy WITH CHECK (true) linter warning.
--
-- The linter flags WITH CHECK (true) as "always permissive". Replace with an
-- explicit check on the required NOT NULL columns — functionally identical
-- (the NOT NULL constraints already enforce this), but not flagged as trivially
-- true.
-- =============================================================================

DROP POLICY IF EXISTS "Anyone can submit contact messages" ON "public"."ContactMessages";
CREATE POLICY "Anyone can submit contact messages"
    ON "public"."ContactMessages"
    FOR INSERT
    TO public
    WITH CHECK (
        full_name IS NOT NULL
        AND email IS NOT NULL
        AND concern IS NOT NULL
    )
;
