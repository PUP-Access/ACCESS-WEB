-- 1. Redefine is_admin() and is_authorized() as SECURITY DEFINER PL/pgSQL functions to ensure they bypass RLS internally
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "public"."Users"
    WHERE id = auth.uid() AND role = 'Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_authorized()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "public"."Users"
    WHERE id = auth.uid() 
    AND role IN ('Organization', 'Default')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop existing update policies on Users
DROP POLICY IF EXISTS "Users can update their own row" ON "public"."Users";
DROP POLICY IF EXISTS "Admins can UPDATE ALL user data" ON "public"."Users";

-- 3. Create non-recursive policy allowing authenticated users to update their own profile row
CREATE POLICY "Users can update their own row"
    ON "public"."Users"
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Create admin update policy for user management
CREATE POLICY "Admins can UPDATE ALL user data"
    ON "public"."Users"
    FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
