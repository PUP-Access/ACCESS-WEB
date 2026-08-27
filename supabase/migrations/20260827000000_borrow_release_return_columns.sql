-- Add release/check-in timestamps to BorrowRequests for display + audit trail.
-- Business-logic gating continues to use `status`; these are informational only.

ALTER TABLE "public"."BorrowRequests"
  ADD COLUMN IF NOT EXISTS "released_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "returned_at" timestamptz;

COMMENT ON COLUMN "public"."BorrowRequests"."released_at" IS 'Set when an Approved request is handed off to the borrower (status -> Active).';
COMMENT ON COLUMN "public"."BorrowRequests"."returned_at" IS 'Set when an Active request is checked back in (status -> Returned).';
