-- =============================================================================
-- Add indexes for all unindexed foreign key columns
--
-- Foreign key columns without indexes cause sequential scans on the referenced
-- table during JOIN operations and ON DELETE/UPDATE cascades. Each index name
-- follows the convention: idx_<table>_<column>.
-- All indexes use IF NOT EXISTS for idempotency.
-- =============================================================================

-- AuditLogs.user_id → Users.id
-- High: grows over time; RLS policy filters on this column per query
CREATE INDEX IF NOT EXISTS idx_auditlogs_user_id
    ON "public"."AuditLogs" (user_id);

-- BorrowRequestItems.borrow_request_id → BorrowRequests.id
-- High: core join path when loading the items of a request
CREATE INDEX IF NOT EXISTS idx_borrowrequestitems_borrow_request_id
    ON "public"."BorrowRequestItems" (borrow_request_id);

-- BorrowRequestItems.asset_id → Assets.id
-- High: queried when checking if an asset is currently borrowed
CREATE INDEX IF NOT EXISTS idx_borrowrequestitems_asset_id
    ON "public"."BorrowRequestItems" (asset_id);

-- BorrowRequests.user_id → Users.id
-- High: main filter for every user viewing their own requests; also used in RLS
CREATE INDEX IF NOT EXISTS idx_borrowrequests_user_id
    ON "public"."BorrowRequests" (user_id);

-- BorrowRequests.reviewed_by → Users.id
-- Medium: admin-facing filter; also needed for FK cascade operations
CREATE INDEX IF NOT EXISTS idx_borrowrequests_reviewed_by
    ON "public"."BorrowRequests" (reviewed_by);

-- Events.created_by → Users.id
CREATE INDEX IF NOT EXISTS idx_events_created_by
    ON "public"."Events" (created_by);

-- Officers.user_id → Users.id
CREATE INDEX IF NOT EXISTS idx_officers_user_id
    ON "public"."Officers" (user_id);

-- SiteContent.updated_by → Users.id
CREATE INDEX IF NOT EXISTS idx_sitecontent_updated_by
    ON "public"."SiteContent" (updated_by);
