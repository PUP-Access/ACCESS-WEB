-- =============================================================================
-- 1) Copy existing Equipments rows into Assets, reusing the same id.
-- 2) Add BorrowRequestItems.quantity.
-- 3) Backfill BorrowRequestItems from BorrowRequests.requested_item text,
--    matching newly-copied Assets by name+category.
-- Safe to re-run: every INSERT below is idempotent (ON CONFLICT / NOT EXISTS).
-- =============================================================================

-- --- Step 1: copy Equipments -> Assets, id-preserving ------------------------
INSERT INTO "Assets" (id, name, category, quantity, unit, image_url, is_deleted, created_at, updated_at)
SELECT id, name, category, quantity, unit, image_url, is_deleted, created_at, updated_at
FROM "Equipments"
ON CONFLICT (id) DO NOTHING;

-- --- Step 2: add BorrowRequestItems.quantity ---------------------------------
-- Guard: this table is confirmed empty (never written to by any app code).
-- If that has changed since this migration was written, abort rather than
-- silently adding a NOT NULL column with no way to populate the missing values.
DO $$
DECLARE
  existing_count integer;
BEGIN
  SELECT count(*) INTO existing_count FROM "BorrowRequestItems";
  IF existing_count > 0 THEN
    RAISE EXCEPTION
      'BorrowRequestItems has % existing row(s); this migration assumes the table is empty pre-backfill. Investigate before proceeding.',
      existing_count;
  END IF;
END $$;

ALTER TABLE "BorrowRequestItems" ADD COLUMN "quantity" integer NOT NULL DEFAULT 1;
ALTER TABLE "BorrowRequestItems" ALTER COLUMN "quantity" DROP DEFAULT;

-- --- Step 3: backfill from requested_item strings ----------------------------
-- Mirrors the app's existing parser (parseRequestedItems in requested-items.ts):
--   1. split on ", " into individual item segments
--   2. match each segment against /(.+?) x(\d+) \((.+?)\)/
-- Format example: "Multimeter x2 (EQUIPMENTS), Screwdriver x1 (TOOLS)"
WITH split_items AS (
  SELECT
    br.id AS borrow_request_id,
    btrim(part) AS item_str
  FROM "BorrowRequests" br
  CROSS JOIN LATERAL regexp_split_to_table(br.requested_item, ',\s*') AS part
  WHERE br.requested_item IS NOT NULL AND btrim(br.requested_item) <> ''
),
parsed AS (
  SELECT
    borrow_request_id,
    (regexp_match(item_str, '^(.+?) x(\d+) \((.+?)\)$'))[1] AS asset_name,
    ((regexp_match(item_str, '^(.+?) x(\d+) \((.+?)\)$'))[2])::integer AS item_quantity,
    (regexp_match(item_str, '^(.+?) x(\d+) \((.+?)\)$'))[3] AS asset_category
  FROM split_items
)
INSERT INTO "BorrowRequestItems" (id, borrow_request_id, asset_id, quantity)
SELECT
  gen_random_uuid(),
  p.borrow_request_id,
  a.id,
  p.item_quantity
FROM parsed p
JOIN "Assets" a
  ON a.name = p.asset_name
  AND a.category = p.asset_category
WHERE p.asset_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "BorrowRequestItems" existing
    WHERE existing.borrow_request_id = p.borrow_request_id
      AND existing.asset_id = a.id
  );
