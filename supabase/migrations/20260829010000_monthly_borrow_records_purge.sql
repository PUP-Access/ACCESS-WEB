-- =============================================================================
-- Monthly retention: permanently purge terminal borrow requests (Returned,
-- Rejected, Cancelled) once their updated_at falls in a prior month, and
-- separately purge all AuditLogs entries older than the current month
-- (project-wide, all entity types — a deliberate reversal of the "permanent
-- audit trail" framing in docs/backend/BEST_PRACTICES.md, per product
-- decision). pg_cron cannot call the Storage HTTP API directly, so letter
-- files are queued into storage_cleanup_queue for the app to drain via its
-- already-authenticated Supabase client.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE TABLE "public"."storage_cleanup_queue" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "bucket" text NOT NULL,
    "path" text NOT NULL,
    "queued_at" timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE "public"."storage_cleanup_queue" ENABLE ROW LEVEL SECURITY;
-- No policies attached — same pattern as rate_limit_counters: only the
-- service-role admin client can read/write this table.

CREATE OR REPLACE FUNCTION public.purge_old_borrow_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cutoff timestamptz := date_trunc('month', now());
BEGIN
  INSERT INTO public.storage_cleanup_queue (bucket, path)
  SELECT 'request-letters', letter_file_url
  FROM public."BorrowRequests"
  WHERE status IN ('Returned', 'Rejected', 'Cancelled')
    AND updated_at < v_cutoff
    AND letter_file_url IS NOT NULL
    AND letter_file_url NOT LIKE 'http%'; -- skip legacy public-URL rows (not Storage paths)

  DELETE FROM public."BorrowRequestItems"
  WHERE borrow_request_id IN (
    SELECT id FROM public."BorrowRequests"
    WHERE status IN ('Returned', 'Rejected', 'Cancelled') AND updated_at < v_cutoff
  );

  DELETE FROM public."BorrowRequests"
  WHERE status IN ('Returned', 'Rejected', 'Cancelled') AND updated_at < v_cutoff;
END;
$function$;

CREATE OR REPLACE FUNCTION public.purge_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public."AuditLogs"
  WHERE created_at < date_trunc('month', now());
END;
$function$;

SELECT cron.schedule(
  'monthly-borrow-requests-purge',
  '0 0 1 * *',
  $$SELECT public.purge_old_borrow_requests();$$
);

SELECT cron.schedule(
  'monthly-audit-logs-purge',
  '5 0 1 * *',
  $$SELECT public.purge_old_audit_logs();$$
);
