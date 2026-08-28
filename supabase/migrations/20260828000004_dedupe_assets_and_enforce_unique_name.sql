-- =============================================================================
-- Dedupe Assets by name and enforce uniqueness going forward.
-- The admin inventory UI previously allowed creating a new Asset row for a
-- name that already existed (no dedup check, no DB constraint), and the
-- Equipments -> Assets backfill (20260828000001) carried over legacy rows
-- id-for-id without name-based dedup either. Both paths could produce
-- multiple active rows with the same name.
--
-- 1) Normalize existing names to trimmed-uppercase (matches what the app's
--    Zod schema now enforces on write) so case variants are treated as the
--    same item.
-- 2) For every group of non-deleted rows sharing a name, pick the oldest row
--    (by created_at, then id) as canonical, sum the group's quantity into it,
--    and repoint BorrowRequestItems.asset_id from the losers to the
--    canonical row so borrow history isn't orphaned. Combined into one
--    statement since it writes to two different tables (Postgres disallows
--    two data-modifying clauses against the *same* table in one statement).
-- 3) Soft-delete the non-canonical rows (is_deleted = true) in a separate
--    statement, after quantity/FK migration has read them, consistent with
--    this table's existing soft-delete convention (no hard delete).
-- 4) Add a partial unique index on UPPER(name) for non-deleted rows so
--    duplicates can't recur.
-- =============================================================================

-- --- Step 1: normalize existing names ----------------------------------------
UPDATE "Assets" SET name = UPPER(BTRIM(name)) WHERE name <> UPPER(BTRIM(name));

-- --- Step 2: sum quantity into canonical row + repoint BorrowRequestItems ----
WITH ranked AS (
  SELECT
    id,
    name AS norm_name,
    row_number() OVER (PARTITION BY name ORDER BY created_at ASC NULLS LAST, id ASC) AS rn
  FROM "Assets"
  WHERE is_deleted = false
),
canonical AS (
  SELECT norm_name, id AS canonical_id FROM ranked WHERE rn = 1
),
dupe_sums AS (
  SELECT r.norm_name, SUM(a.quantity) AS total_qty
  FROM ranked r
  JOIN "Assets" a ON a.id = r.id
  GROUP BY r.norm_name
),
repoint AS (
  UPDATE "BorrowRequestItems" bri
  SET asset_id = c.canonical_id
  FROM ranked r
  JOIN canonical c ON c.norm_name = r.norm_name
  WHERE bri.asset_id = r.id
    AND r.rn > 1
  RETURNING bri.id
)
UPDATE "Assets" a
SET quantity = ds.total_qty
FROM canonical c
JOIN dupe_sums ds ON ds.norm_name = c.norm_name
WHERE a.id = c.canonical_id;

-- --- Step 3: soft-delete the non-canonical duplicate rows --------------------
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (PARTITION BY name ORDER BY created_at ASC NULLS LAST, id ASC) AS rn
  FROM "Assets"
  WHERE is_deleted = false
)
UPDATE "Assets" a
SET is_deleted = true
FROM ranked r
WHERE a.id = r.id
  AND r.rn > 1;

-- --- Step 4: enforce uniqueness going forward --------------------------------
CREATE UNIQUE INDEX assets_active_name_unique_idx ON "Assets" (UPPER(name)) WHERE is_deleted = false;
