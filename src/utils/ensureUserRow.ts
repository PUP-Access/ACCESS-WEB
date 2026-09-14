import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import type { UserRole } from "./adminAccess";

/**
 * Mirrors an authenticated Supabase Auth user into public.Users when the
 * on_auth_user_created trigger's insert never happened for this account
 * (e.g. it was created directly in the Supabase dashboard rather than
 * through the app's signup flow). Without this, such an account can still
 * authenticate -- and, via proxy.ts's app_metadata fallback, potentially
 * reach role-gated pages -- while staying permanently invisible in
 * /admin/users, since nothing else ever backfills the row.
 *
 * Uses upsert with ignoreDuplicates so concurrent requests racing on the
 * same missing row don't error on the id conflict.
 */
export async function ensureUserRow(user: User): Promise<UserRole | undefined> {
  try {
    const supabaseAdmin = createSupabaseAdminClient();

    const { data, error } = await supabaseAdmin
      .from("Users")
      .upsert(
        {
          id: user.id,
          email: user.email,
          organization_name:
            (user.user_metadata?.organization_name as string | undefined) ?? null,
          role: "Pending",
          created_at: user.created_at,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id", ignoreDuplicates: true }
      )
      .select("role")
      .maybeSingle();

    if (error) {
      console.error("ensureUserRow: failed to backfill Users row:", error);
      return undefined;
    }

    return data?.role as UserRole | undefined;
  } catch (err) {
    console.error("ensureUserRow: unexpected error:", err);
    return undefined;
  }
}
