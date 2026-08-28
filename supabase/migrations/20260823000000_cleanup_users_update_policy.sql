-- =============================================================================
-- Cleanup Merged Users Update Policy
--
-- Migration 20260821000001_fix_users_pending_update_rls.sql re-separated the
-- Users table UPDATE policies into "Users can update their own row" and
-- "Admins can UPDATE ALL user data", but missed dropping the merged policy
-- "Users and admins can update user data" created in 20260811000004_rls_performance.sql.
--
-- This migration cleans up the leftover merged policy.
-- =============================================================================

DROP POLICY IF EXISTS "Users and admins can update user data" ON "public"."Users";
