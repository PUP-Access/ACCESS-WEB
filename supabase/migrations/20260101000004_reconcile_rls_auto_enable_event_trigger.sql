-- =============================================================================
-- Reconciliation: rls_auto_enable() and the "ensure_rls" event trigger that
-- calls it already exist on the live database (confirmed via read-only
-- introspection: pg_get_functiondef + pg_event_trigger) but were never
-- captured in any migration file — they were applied directly against
-- remote, similar to 20260828150351_add_rate_limit_counters.sql. This gap
-- broke `supabase db diff`/shadow-DB rebuilds, since
-- 20260811000002_fix_rls_and_security.sql revokes EXECUTE on this function
-- without anything ever having created it. This file reproduces both
-- objects exactly so local migration history can build a complete shadow
-- database matching remote.
--
-- Defense-in-depth safety net: automatically enables RLS on any new table
-- created in the public schema, so a forgotten `ALTER TABLE ... ENABLE ROW
-- LEVEL SECURITY` can't silently ship a table with no RLS protection.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

DROP EVENT TRIGGER IF EXISTS ensure_rls;
CREATE EVENT TRIGGER ensure_rls
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION public.rls_auto_enable();
