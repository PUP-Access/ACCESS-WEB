-- =============================================================================
-- Assets are now managed as grouped catalog items with a quantity count
-- (see 20260828000000_assets_schema_for_inventory_merge.sql), not as unique
-- physical instances. The per-instance `status` (Available/Reserved/Borrowed/
-- Maintenance/Lost) and `condition` (Excellent/Good/Fair/Poor) columns were
-- never read or written by application code under that design and are no
-- longer meaningful under the grouped model — every unit of an Assets row is
-- assumed functional and borrowable. Dropping both columns and their enums.
-- =============================================================================
ALTER TABLE "public"."Assets" DROP COLUMN IF EXISTS "status";
ALTER TABLE "public"."Assets" DROP COLUMN IF EXISTS "condition";

DROP TYPE IF EXISTS "public"."asset_status";
DROP TYPE IF EXISTS "public"."asset_condition";
