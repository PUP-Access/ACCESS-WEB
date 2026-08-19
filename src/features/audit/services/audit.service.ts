import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { checkRole } from "@/utils/checkRole";
import { throwSupabaseError } from "@/lib/errors";
import type { Database, Json } from "@/lib/supabase/database.types";
import { randomUUID } from "crypto";

export type AuditLogRow = Database["public"]["Tables"]["AuditLogs"]["Row"];

export type GetAuditLogsOptions = {
  page?: number;
  limit?: number;
  action?: string;
};

export async function logAdminActivity(
  action: string,
  entityType: string,
  entityId: string,
  stateChanges?: Record<string, unknown>,
  actorUserId?: string | null
) {
  try {
    const supabase = createSupabaseAdminClient();
    let userId = actorUserId;

    if (!userId) {
      try {
        const { createSupabaseServerClient } = await import("@/lib/supabase/server-client");
        const serverClient = await createSupabaseServerClient();
        const { data: { user } } = await serverClient.auth.getUser();
        userId = user?.id ?? null;
      } catch {
        // Fallback if no user session
      }
    }

    const { error } = await supabase.from("AuditLogs").insert({
      id: randomUUID(),
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      state_changes: (stateChanges ?? null) as Json,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to insert audit log:", error);
    }
  } catch (err) {
    console.error("Audit log error:", err);
  }
}

export async function getAuditLogsForAdmin(options: GetAuditLogsOptions = {}) {
  await checkRole({ roles: "Admin" });
  const supabase = createSupabaseAdminClient();

  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(50, Math.max(1, options.limit ?? 10));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("AuditLogs")
    .select("*, Users(email, organization_name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (options.action && options.action !== "All") {
    query = query.eq("action", options.action);
  }

  query = query.range(from, to);

  const { data, error, count } = await query;
  throwSupabaseError(error);

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: (data ?? []) as (AuditLogRow & { Users?: { email: string | null; organization_name: string | null } | null })[],
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}
