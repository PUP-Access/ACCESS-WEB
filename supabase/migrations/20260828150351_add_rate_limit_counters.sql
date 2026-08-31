-- =============================================================================
-- Reconciliation: this migration was applied directly against the remote
-- database (2026-08-28 15:03:51) without a corresponding local file. This
-- file reproduces that change exactly (verified via read-only introspection
-- of the live schema) so local migration history matches remote going
-- forward. Adds a generic fixed-window rate limiter used to throttle
-- rate-limited server actions/routes.
--
-- The rate_limit_counters table is RLS-enabled with no policies attached —
-- the only access path is the increment_rate_limit() SECURITY DEFINER RPC,
-- which is callable by anon (needed to rate-limit unauthenticated actions
-- like public form submissions) as well as authenticated/service_role, via
-- this project's default schema privileges (same pattern already used by
-- the pre-existing get_server_time() function — no explicit GRANT needed).
-- =============================================================================

CREATE TABLE "public"."rate_limit_counters" (
    "key" text NOT NULL,
    "window_start" timestamptz NOT NULL,
    "count" integer NOT NULL DEFAULT 1,
    PRIMARY KEY ("key", "window_start")
);

CREATE INDEX "idx_rate_limit_counters_window_start"
    ON "public"."rate_limit_counters" USING btree ("window_start");

ALTER TABLE "public"."rate_limit_counters" ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.increment_rate_limit(p_key text, p_window_seconds integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limit_counters (key, window_start, count)
  values (p_key, v_window_start, 1)
  on conflict (key, window_start)
  do update set count = rate_limit_counters.count + 1
  returning count into v_count;

  -- opportunistic cleanup, ~1% of calls, avoids needing pg_cron
  if random() < 0.01 then
    delete from public.rate_limit_counters
    where window_start < now() - interval '2 hours';
  end if;

  return v_count;
end;
$function$;
