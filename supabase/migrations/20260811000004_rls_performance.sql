-- =============================================================================
-- RLS Performance Optimization
--
-- Fixes two categories of performance advisories:
--
-- 1. auth_rls_initplan: auth.uid() was being re-evaluated per row. Fix by
--    wrapping with (select auth.uid()) so PostgreSQL evaluates it once as
--    an init plan and caches the result for the entire query.
--
-- 2. multiple_permissive_policies: Multiple PERMISSIVE policies for the same
--    role+action cause PostgreSQL to evaluate each policy independently per row.
--    Fix by merging them into a single policy with an explicit OR.
--
-- All policy replacements use DROP ... IF EXISTS before CREATE for idempotency.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Fix is_admin() and is_authorized() helper functions
--
-- These are called inside many RLS policies. Fixing (select auth.uid()) here
-- propagates the initplan optimization to every policy that uses them,
-- including Equipments, BorrowRequests, BorrowRequestItems, etc.
-- SECURITY DEFINER and REVOKE grants from _003 are preserved by CREATE OR REPLACE.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM "public"."Users"
    WHERE id = (select auth.uid()) AND role = 'Admin'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_authorized()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM "public"."Users"
    WHERE id = (select auth.uid())
    AND role IN ('Organization', 'Default')
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_authorized() TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- AuditLogs
--
-- Fix: auth_rls_initplan + merge two SELECT policies into one
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can select their own audit logs" ON "public"."AuditLogs";
DROP POLICY IF EXISTS "Admins can select all audit logs" ON "public"."AuditLogs";

CREATE POLICY "Users and admins can select audit logs"
    ON "public"."AuditLogs"
    FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id OR is_admin())
;


-- -----------------------------------------------------------------------------
-- BorrowRequests
--
-- Fix: auth_rls_initplan on INSERT + SELECT policies
-- Fix: merge two UPDATE policies into one
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Orgs can create borrow requests" ON "public"."BorrowRequests";
CREATE POLICY "Orgs can create borrow requests"
    ON "public"."BorrowRequests"
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (select auth.uid()) = user_id
        AND is_authorized()
    )
;

DROP POLICY IF EXISTS "Authorized user can view own requests, Admins can view all" ON "public"."BorrowRequests";
CREATE POLICY "Authorized user can view own requests, Admins can view all"
    ON "public"."BorrowRequests"
    FOR SELECT
    TO authenticated
    USING (
        ((select auth.uid()) = user_id AND is_authorized())
        OR is_admin()
    )
;

-- Merge UPDATE policies: "Authorized user can cancel own requests" + "Admins can review borrow requests"
DROP POLICY IF EXISTS "Authorized user can cancel own requests" ON "public"."BorrowRequests";
DROP POLICY IF EXISTS "Admins can review borrow requests" ON "public"."BorrowRequests";

CREATE POLICY "Users and admins can update borrow requests"
    ON "public"."BorrowRequests"
    FOR UPDATE
    TO authenticated
    USING (
        is_admin()
        OR ((select auth.uid()) = user_id AND is_authorized() AND status = 'Pending')
    )
    WITH CHECK (
        is_admin()
        OR ((select auth.uid()) = user_id AND is_authorized() AND status = 'Cancelled')
    )
;


-- -----------------------------------------------------------------------------
-- BorrowRequestItems
--
-- Fix: auth_rls_initplan + merge SELECT policies + merge INSERT policies
-- -----------------------------------------------------------------------------

-- Merge SELECT: "Users can select their own request items" + "Admins can select all request items"
DROP POLICY IF EXISTS "Users can select their own request items" ON "public"."BorrowRequestItems";
DROP POLICY IF EXISTS "Admins can select all request items" ON "public"."BorrowRequestItems";

CREATE POLICY "Users and admins can select request items"
    ON "public"."BorrowRequestItems"
    FOR SELECT
    TO authenticated
    USING (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM "public"."BorrowRequests" br
            WHERE br.id = borrow_request_id
            AND br.user_id = (select auth.uid())
        )
    )
;

-- Merge INSERT: "Users can insert items into their own pending requests" + "Admins can insert into any request"
DROP POLICY IF EXISTS "Users can insert items into their own pending requests" ON "public"."BorrowRequestItems";
DROP POLICY IF EXISTS "Admins can insert into any request" ON "public"."BorrowRequestItems";

CREATE POLICY "Users and admins can insert request items"
    ON "public"."BorrowRequestItems"
    FOR INSERT
    TO authenticated
    WITH CHECK (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM "public"."BorrowRequests" br
            WHERE br.id = borrow_request_id
            AND br.user_id = (select auth.uid())
            AND br.status = 'Pending'
        )
    )
;


-- -----------------------------------------------------------------------------
-- Users
--
-- Fix: auth_rls_initplan + merge SELECT policies + merge UPDATE policies
-- -----------------------------------------------------------------------------

-- Merge SELECT: "Users can select their own row" + "Admins can select ALL user data"
DROP POLICY IF EXISTS "Users can select their own row" ON "public"."Users";
DROP POLICY IF EXISTS "Admins can select ALL user data" ON "public"."Users";

CREATE POLICY "Users and admins can select user data"
    ON "public"."Users"
    FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = id OR is_admin())
;

-- Merge UPDATE: "Users can update their own row" + "Admins can UPDATE ALL user data"
DROP POLICY IF EXISTS "Users can update their own row" ON "public"."Users";
DROP POLICY IF EXISTS "Admins can UPDATE ALL user data" ON "public"."Users";

CREATE POLICY "Users and admins can update user data"
    ON "public"."Users"
    FOR UPDATE
    TO authenticated
    USING (
        is_admin()
        OR ((select auth.uid()) = id AND role != 'Pending')
    )
    WITH CHECK (
        (
            -- Admin: can update anyone, but cannot self-demote
            is_admin()
            AND (
                ((select auth.uid()) = id AND role = 'Admin')
                OR (select auth.uid()) != id
            )
        )
        OR (
            -- User: can update own row but cannot change their role
            (select auth.uid()) = id
            AND role = (SELECT role FROM "public"."Users" WHERE id = (select auth.uid()))
        )
    )
;


-- -----------------------------------------------------------------------------
-- Events
--
-- Fix: merge two SELECT policies for authenticated into one
-- (anon policy "Public can select published events" is untouched — no overlap)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can select published events" ON "public"."Events";
DROP POLICY IF EXISTS "Admins can select all events" ON "public"."Events";

CREATE POLICY "Authenticated users and admins can select events"
    ON "public"."Events"
    FOR SELECT
    TO authenticated
    USING (is_admin() OR status = 'Published')
;


-- -----------------------------------------------------------------------------
-- FAQItems
--
-- Fix: multiple permissive SELECT policies for authenticated role.
-- "Public can read active faqs" targets TO public (applies to anon + authenticated).
-- "Admins can read all faqs" targets TO authenticated.
-- Both fire for authenticated on SELECT → multiple permissive policies.
--
-- Fix: scope the public policy to anon only, create one unified authenticated policy.
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public can read active faqs" ON "public"."FAQItems";
DROP POLICY IF EXISTS "Admins can read all faqs" ON "public"."FAQItems";

CREATE POLICY "Anon can read active faqs"
    ON "public"."FAQItems"
    FOR SELECT
    TO anon
    USING (is_active = true)
;

CREATE POLICY "Authenticated users and admins can read faqs"
    ON "public"."FAQItems"
    FOR SELECT
    TO authenticated
    USING (is_admin() OR is_active = true)
;


-- -----------------------------------------------------------------------------
-- Equipments
--
-- Fix: auth_rls_initplan (inline auth.uid() subquery) + merge SELECT policies.
--
-- Original policies (both TO public):
--   "Enable all for admins"      — ALL,    USING (auth.uid() IN (SELECT id FROM Users WHERE role='Admin'))
--   "Enable read access for all" — SELECT, USING (is_deleted = false)
-- These overlap on SELECT for every role that inherits from public.
--
-- Fix: replace with non-overlapping operation-specific policies.
--   SELECT — single merged policy: non-deleted rows for everyone, all rows for admins
--   INSERT/UPDATE/DELETE — admins only (replaces the ALL policy for write ops)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Enable all for admins" ON "public"."Equipments";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."Equipments";

CREATE POLICY "Enable read access for all users"
    ON "public"."Equipments"
    FOR SELECT
    TO public
    USING (is_deleted = false OR is_admin())
;

CREATE POLICY "Admins can insert equipments"
    ON "public"."Equipments"
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin())
;

CREATE POLICY "Admins can update equipments"
    ON "public"."Equipments"
    FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin())
;

CREATE POLICY "Admins can delete equipments"
    ON "public"."Equipments"
    FOR DELETE
    TO authenticated
    USING (is_admin())
;

