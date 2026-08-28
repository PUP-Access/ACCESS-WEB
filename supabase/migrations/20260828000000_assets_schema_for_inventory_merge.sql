-- =============================================================================
-- Prepare Assets to absorb Equipments' bulk-inventory columns.
-- Assets currently has 0 rows, so these ALTERs are safe with no
-- data-loss/constraint-violation risk.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
ALTER TABLE "Assets" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "Assets" ADD COLUMN "quantity" integer NOT NULL DEFAULT 0;
ALTER TABLE "Assets" ADD COLUMN "unit" varchar;

ALTER TABLE "Assets" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "Assets" ALTER COLUMN "category" SET NOT NULL;

COMMENT ON COLUMN "Assets"."quantity" IS 'Shared bulk-inventory count, deducted at request submission, restocked on reject/return';
COMMENT ON COLUMN "Assets"."unit" IS 'Optional display unit, e.g. PCS, SET (from legacy Equipments)';
