import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { AppError } from "@/lib/errors";
import { Database } from "@/lib/supabase/database.types";
import { checkRole } from "@/utils/checkRole";
import {
  CreateEquipmentInput,
  UpdateEquipmentInput,
  DeleteEquipmentInput,
} from "../schemas";

export type Equipment = Database["public"]["Tables"]["Equipments"]["Row"];

export type EquipmentsAdminFilter = {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
};

export type EquipmentsPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function getEquipmentsForAdmin(
  { search = "", category = "All", page = 1, limit = 50 }: EquipmentsAdminFilter = {}
): Promise<{ data: Equipment[]; meta: EquipmentsPaginationMeta }> {
  await checkRole({ roles: "Admin" });
  const supabase = await createSupabaseServerClient();

  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safePage = Math.max(page, 1);
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  let query = supabase.from("Equipments").select("*", { count: "exact" }).eq("is_deleted", false);

  if (category !== "All") {
    query = query.eq("category", category);
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  query = query.order("category", { ascending: true }).order("name", { ascending: true }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Supabase Error [getEquipmentsForAdmin]:", error);
    throw new AppError("Failed to fetch equipments", 500);
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / safeLimit);

  return {
    data: data as Equipment[],
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
    },
  };
}

export async function createEquipment(input: CreateEquipmentInput): Promise<Equipment> {
  await checkRole({ roles: "Admin" });
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("Equipments")
    .insert({
      name: input.name,
      category: input.category,
      quantity: input.quantity,
      unit: input.unit || null,
      image_url: input.image_url || null,
    })
    .select()
    .single();

  if (error) {
    throw new AppError("Failed to create equipment", 500);
  }

  return data as Equipment;
}

export async function updateEquipment(input: UpdateEquipmentInput): Promise<Equipment> {
  await checkRole({ roles: "Admin" });
  const supabase = await createSupabaseServerClient();

  const { id, ...updates } = input;

  const { data, error } = await supabase
    .from("Equipments")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new AppError("Failed to update equipment", 500);
  }

  return data as Equipment;
}

export async function deleteEquipment(input: DeleteEquipmentInput): Promise<void> {
  await checkRole({ roles: "Admin" });
  const supabase = await createSupabaseServerClient();

  // Soft delete
  const { error } = await supabase
    .from("Equipments")
    .update({ is_deleted: true })
    .eq("id", input.id);

  if (error) {
    throw new AppError("Failed to delete equipment", 500);
  }
}

export async function getAllEquipmentsPublic(): Promise<Equipment[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("Equipments")
    .select("*")
    .eq("is_deleted", false)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new AppError("Failed to fetch equipments", 500);
  }

  return data as Equipment[];
}

export async function getEquipmentCategories() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("Equipments")
    .select("category")
    .eq("is_deleted", false);

  if (error) {
    console.error("Supabase Error [getEquipmentCategories]:", error);
    return ["MATERIALS", "EQUIPMENTS", "TOOLS"]; // fallback
  }

  const unique = Array.from(new Set(data.map((d: any) => d.category)));
  // Ensure default categories always exist
  const base = new Set(["MATERIALS", "EQUIPMENTS", "TOOLS", ...unique]);
  return Array.from(base).sort();
}
