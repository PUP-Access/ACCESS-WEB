ALTER TABLE "BorrowRequests"
  ALTER COLUMN "created_at" SET DEFAULT now(),
  ALTER COLUMN "updated_at" SET DEFAULT now();

-- Backfill any existing records that had NULL created_at
UPDATE "BorrowRequests"
SET "created_at" = now()
WHERE "created_at" IS NULL;
