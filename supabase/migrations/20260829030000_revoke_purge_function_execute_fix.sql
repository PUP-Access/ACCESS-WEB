-- =============================================================================
-- Fix: revoking EXECUTE from PUBLIC alone (20260829020000) was insufficient —
-- this project's default schema privileges grant anon/authenticated their own
-- separate explicit EXECUTE grants on new functions (confirmed: they still
-- had access after the PUBLIC-only revoke). Revoke from them directly too,
-- matching the belt-and-suspenders approach already used in
-- 20260811000003_revoke_function_execute.sql for other SECURITY DEFINER
-- functions. service_role/postgres are untouched — that's what pg_cron and
-- admin tooling actually need.
-- =============================================================================

REVOKE EXECUTE ON FUNCTION public.purge_old_borrow_requests() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.purge_old_audit_logs() FROM anon, authenticated;
