import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { throwSupabaseError } from "@/lib/errors";
import { checkRole } from "@/utils/checkRole";
import { rolesForArea } from "@/utils/adminAccess";
import type { Tables } from "@/lib/supabase/database.types";

export type FAQItem = Tables<"FAQItems">;

export async function getActiveFAQs(): Promise<FAQItem[]> {
  noStore();

  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("FAQItems")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    throwSupabaseError(error);
    return data ?? [];
  } catch (error) {
    console.error("[FAQItems] Failed to read active FAQs:", error);
    return [];
  }
}

export async function getAllFAQsForAdmin(): Promise<FAQItem[]> {
  await checkRole({ roles: rolesForArea("faqs") });
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("FAQItems")
    .select("*")
    .order("display_order", { ascending: true });

  throwSupabaseError(error);
  return data ?? [];
}

export async function createFAQItem(input: {
  question: string;
  answer: string;
  display_order?: number;
  is_active?: boolean;
}) {
  await checkRole({ roles: rolesForArea("faqs") });
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("FAQItems")
    .insert({
      question: input.question,
      answer: input.answer,
      display_order: input.display_order ?? 0,
      is_active: input.is_active ?? true,
    })
    .select()
    .single();

  throwSupabaseError(error);
  return data;
}

export async function updateFAQItem(
  id: string,
  input: Partial<{
    question: string;
    answer: string;
    display_order: number;
    is_active: boolean;
  }>
) {
  await checkRole({ roles: rolesForArea("faqs") });
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("FAQItems")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  throwSupabaseError(error);
  return data;
}

export async function deleteFAQItem(id: string) {
  await checkRole({ roles: rolesForArea("faqs") });
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("FAQItems").delete().eq("id", id);
  throwSupabaseError(error);
}

export async function getFAQCount(): Promise<number> {
  await checkRole({ roles: rolesForArea("faqs") });
  const supabase = createSupabaseAdminClient();

  const { count, error } = await supabase
    .from("FAQItems")
    .select("*", { count: "exact", head: true });

  throwSupabaseError(error);
  return count ?? 0;
}
