import dotenv from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
import type { Database } from "@/lib/supabase/database.types";

/**
 * Standalone service-role client for test setup/teardown/assertions.
 * Deliberately does not import createSupabaseAdminClient from src/lib —
 * that file is fine to reuse, but keeping this standalone avoids any
 * accidental dependency on Next.js request context creeping into test code.
 */
export function createTestSupabaseClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — tests require .env.local to be present."
    );
  }

  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
