import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminRole, type AdminRole } from "./adminAccess";

export type AdminSession = {
  userId: string;
  email: string | null;
  role: AdminRole;
};

/** General gate for the /admin shell: any role with SOME admin-dashboard access may enter. Specific per-page/area enforcement happens in proxy.ts and in each service's checkRole() call. */
export async function requireAdmin(): Promise<AdminSession> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/admin");
  }

  const { data: userRow, error } = await supabase
    .from("Users")
    .select("role, email")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !isAdminRole(userRow?.role)) {
    redirect("/404");
  }

  return {
    userId: user.id,
    email: userRow.email ?? user.email ?? null,
    role: userRow.role,
  };
}
