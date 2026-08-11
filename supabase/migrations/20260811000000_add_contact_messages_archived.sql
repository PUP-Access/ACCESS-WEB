ALTER TABLE "ContactMessages"
  ADD COLUMN IF NOT EXISTS "is_archived" boolean DEFAULT false;
