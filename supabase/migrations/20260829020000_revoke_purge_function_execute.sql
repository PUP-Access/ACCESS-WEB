-- =============================================================================
-- Fix: purge_old_borrow_requests() and purge_old_audit_logs() were created
-- without any explicit grant/revoke, so they inherited this project's default
-- schema privileges (EXECUTE granted to PUBLIC, which anon/authenticated
-- inherit — same default observed on increment_rate_limit/get_server_time).
-- That meant any signed-in (or possibly anonymous) client could call
-- supabase.rpc('purge_old_borrow_requests') directly and trigger a real
-- destructive purge on demand, bypassing the intended "pg_cron only, once a
-- month" design. Revoking from PUBLIC removes it for anon/authenticated too
-- (they inherit from PUBLIC) while leaving postgres/service_role able to
-- call it — which is all pg_cron and admin tooling actually need.
-- =============================================================================

REVOKE EXECUTE ON FUNCTION public.purge_old_borrow_requests() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purge_old_audit_logs() FROM PUBLIC;
