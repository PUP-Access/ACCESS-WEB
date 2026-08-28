-- BorrowRequestItems.id had no DB default (same gap Assets.id had before the
-- Equipments->Assets migration) — the app now inserts rows without specifying
-- an id explicitly, matching the pattern used everywhere else in the schema.
ALTER TABLE "BorrowRequestItems" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
