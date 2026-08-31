-- =============================================================================
-- Reconciliation: the "Equipments" table (legacy predecessor of "Assets",
-- dropped in 20260828000002_drop_equipments.sql) was never captured by any
-- migration file — it predates this project's use of migrations and was
-- created directly against remote. Confirmed via read-only introspection of
-- a database that still retains it (a duplicate/cloned project provisioned
-- before the Equipments->Assets merge, whose schema was never itself
-- migration-tracked). This gap broke shadow-DB rebuilds:
-- 20260811000004_rls_performance.sql rewrites this table's RLS policies but
-- nothing had ever created the table.
--
-- Original RLS policies aren't reproduced here — 20260811000004 drops them
-- (IF EXISTS) and creates the real final policies immediately after, so
-- recreating transient originals here would be pure guesswork with no
-- effect on the end state.
-- =============================================================================

CREATE TABLE IF NOT EXISTS "public"."Equipments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar NOT NULL,
  "category" varchar NOT NULL,
  "quantity" integer NOT NULL DEFAULT 1,
  "unit" varchar,
  "image_url" varchar,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

ALTER TABLE "public"."Equipments" ENABLE ROW LEVEL SECURITY;
