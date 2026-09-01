import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { AppError } from "@/lib/errors";
import { Database } from "@/lib/supabase/database.types";
import { checkRole } from "@/utils/checkRole";
import { rolesForArea } from "@/utils/adminAccess";
import {
  CreateOfficerInput,
  ReorderOfficersInput,
  UpdateOfficerInput,
} from "../schemas";

type Officer = Database["public"]["Tables"]["Officers"]["Row"];

export type OfficersAdminFilter = {
  status?: "All" | "Active" | "Inactive";
  search?: string;
  page?: number;
  limit?: number;
};

export type OfficersPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function getOfficersForAdmin(
  { status = "All", search = "", page = 1, limit = 10 }: OfficersAdminFilter = {}
): Promise<{ data: Officer[]; meta: OfficersPaginationMeta }> {
  await checkRole({ roles: rolesForArea("officers") });
  const supabase = await createSupabaseServerClient();

  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  let query = supabase.from("Officers").select("*", { count: "exact" });

  if (status === "Active") {
    query = query.eq("is_active", true);
  } else if (status === "Inactive") {
    query = query.eq("is_active", false);
  }

  const normalizedSearch = search.trim();
  if (normalizedSearch) {
    const escaped = normalizedSearch.replace(/,/g, "\\,");
    query = query.or(
      `full_name.ilike.%${escaped}%,email.ilike.%${escaped}%,position_title.ilike.%${escaped}%,department.ilike.%${escaped}%`
    );
  }

  const { data, error, count } = await query
    .order("display_order", { ascending: true })
    .range(from, to);

  if (error) throw new AppError(error.message, 500);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return {
    data: data || [],
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
    },
  };
}

export async function getOfficerById(officerId: string): Promise<Officer> {
  await checkRole({ roles: rolesForArea("officers") });
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("Officers")
    .select("*")
    .eq("id", officerId)
    .single();

  if (error) throw new AppError(error.message, error.code === "PGRST116" ? 404 : 500);

  return data;
}

export async function createOfficer(input: CreateOfficerInput): Promise<Officer> {
  await checkRole({ roles: rolesForArea("officers") });
  const supabase = await createSupabaseServerClient();

  const { data: maxOrder } = await supabase
    .from("Officers")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .single();

  const nextDisplayOrder = (maxOrder?.display_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("Officers")
    .insert([
      {
        id: crypto.randomUUID(),
        full_name: input.full_name,
        email: input.email,
        position_title: input.position_title,
        department: input.department,
        academic_year: input.academic_year,
        image_url: input.image_url || null,
        is_active: input.is_active ?? true,
        display_order: input.display_order ?? nextDisplayOrder,
      },
    ])
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);

  return data;
}

export async function updateOfficer(
  officerId: string,
  input: UpdateOfficerInput
): Promise<Officer> {
  await checkRole({ roles: rolesForArea("officers") });
  const supabase = await createSupabaseServerClient();

  const updateData = {
    ...(input.full_name !== undefined && { full_name: input.full_name }),
    ...(input.email !== undefined && { email: input.email }),
    ...(input.position_title !== undefined && { position_title: input.position_title }),
    ...(input.department !== undefined && { department: input.department }),
    ...(input.academic_year !== undefined && { academic_year: input.academic_year }),
    ...(input.image_url !== undefined && { image_url: input.image_url || null }),
    ...(input.is_active !== undefined && { is_active: input.is_active }),
    ...(input.display_order !== undefined && { display_order: input.display_order }),
  };

  const { data, error } = await supabase
    .from("Officers")
    .update(updateData)
    .eq("id", officerId)
    .select()
    .single();

  if (error) throw new AppError(error.message, 404);

  return data;
}

export async function deactivateOfficer(officerId: string): Promise<Officer> {
  await checkRole({ roles: rolesForArea("officers") });
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("Officers")
    .update({ is_active: false })
    .eq("id", officerId)
    .select()
    .single();

  if (error) throw new AppError(error.message, 404);

  return data;
}

export async function reorderOfficers(input: ReorderOfficersInput): Promise<Officer[]> {
  await checkRole({ roles: rolesForArea("officers") });
  const supabase = await createSupabaseServerClient();

  const updatedOfficers: Officer[] = [];

  for (const { id, display_order } of input.officers) {
    const { data, error } = await supabase
      .from("Officers")
      .update({ display_order })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to reorder officer ${id}: ${error.message}`, 500);
    }

    updatedOfficers.push(data);
  }

  return updatedOfficers;
}
