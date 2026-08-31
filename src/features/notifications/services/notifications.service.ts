import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { checkRole } from "@/utils/checkRole";
import { throwSupabaseError } from "@/lib/errors";
import type { Database } from "@/lib/supabase/database.types";

export type NotificationRow = Database["public"]["Tables"]["Notifications"]["Row"];

export async function getRecentNotifications(limit = 10): Promise<NotificationRow[]> {
  await checkRole({ roles: "Admin" });
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("Notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  throwSupabaseError(error);
  return data ?? [];
}

export async function markNotificationAsRead(id: string): Promise<NotificationRow> {
  await checkRole({ roles: "Admin" });
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("Notifications")
    .update({ is_read: true })
    .eq("id", id)
    .select()
    .single();

  throwSupabaseError(error);
  return data;
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await checkRole({ roles: "Admin" });
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("Notifications")
    .update({ is_read: true })
    .eq("is_read", false);

  throwSupabaseError(error);
}

export async function clearAllNotifications(): Promise<void> {
  await checkRole({ roles: "Admin" });
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("Notifications")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // deletes all rows

  throwSupabaseError(error);
}
