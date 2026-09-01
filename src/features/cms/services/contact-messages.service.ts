import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { throwSupabaseError } from "@/lib/errors";
import { checkRole } from "@/utils/checkRole";
import { rolesForArea } from "@/utils/adminAccess";
import type { Tables } from "@/lib/supabase/database.types";

export type ContactMessage = Tables<"ContactMessages">;

export async function submitContactMessage(input: {
  full_name: string;
  email: string;
  course_year_section: string;
  contact_number: string;
  organization: string;
  purpose: string;
  concern: string;
}) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("ContactMessages")
    .insert(input)
    .select()
    .single();

  throwSupabaseError(error);
  return data;
}

export async function getContactMessagesForAdmin(options?: {
  unreadOnly?: boolean;
  limit?: number;
}) {
  await checkRole({ roles: rolesForArea("contact-messages") });
  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("ContactMessages")
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.unreadOnly) {
    query = query.eq("is_read", false);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  throwSupabaseError(error);
  return data ?? [];
}

export async function markContactMessageRead(id: string) {
  await checkRole({ roles: rolesForArea("contact-messages") });
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("ContactMessages")
    .update({ is_read: true })
    .eq("id", id)
    .select()
    .single();

  throwSupabaseError(error);
  return data;
}

export async function markContactMessageUnread(id: string) {
  await checkRole({ roles: rolesForArea("contact-messages") });
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("ContactMessages")
    .update({ is_read: false })
    .eq("id", id)
    .select()
    .single();

  throwSupabaseError(error);
  return data;
}

export async function deleteContactMessage(id: string) {
  await checkRole({ roles: rolesForArea("contact-messages") });
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("ContactMessages")
    .delete()
    .eq("id", id);

  throwSupabaseError(error);
}

export async function archiveContactMessage(id: string, isArchived: boolean = true) {
  await checkRole({ roles: rolesForArea("contact-messages") });
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("ContactMessages")
    .update({ is_archived: isArchived })
    .eq("id", id)
    .select()
    .single();

  throwSupabaseError(error);
  return data;
}

export async function getUnreadContactMessageCount(): Promise<number> {
  await checkRole({ roles: rolesForArea("contact-messages") });
  const supabase = createSupabaseAdminClient();

  const { count, error } = await supabase
    .from("ContactMessages")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false);

  throwSupabaseError(error);
  return count ?? 0;
}

