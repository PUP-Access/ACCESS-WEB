import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { AppError } from "@/lib/errors";
import { Database } from "@/lib/supabase/database.types";
import { checkRole } from "@/utils/checkRole";
import { rolesForArea } from "@/utils/adminAccess";
import {
  CreateAssetInput,
  UpdateAssetInput,
  DeleteAssetInput,
} from "../schemas";

export type Asset = Database["public"]["Tables"]["Assets"]["Row"];

export type AssetsAdminFilter = {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
};

export type AssetsPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function getAssetsForAdmin(
  { search = "", category = "All", page = 1, limit = 50 }: AssetsAdminFilter = {}
): Promise<{ data: Asset[]; meta: AssetsPaginationMeta }> {
  await checkRole({ roles: rolesForArea("inventory") });
  const supabase = await createSupabaseServerClient();

  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safePage = Math.max(page, 1);
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  let query = supabase.from("Assets").select("*", { count: "exact" }).eq("is_deleted", false);

  if (category !== "All") {
    query = query.eq("category", category);
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  query = query.order("category", { ascending: true }).order("name", { ascending: true }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Supabase Error [getAssetsForAdmin]:", error);
    throw new AppError("Failed to fetch assets", 500);
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / safeLimit);

  return {
    data: data as Asset[],
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
    },
  };
}

async function mergeQuantityIntoExisting(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  existing: Asset,
  addedQuantity: number
): Promise<{ asset: Asset; merged: true }> {
  const { data, error } = await supabase
    .from("Assets")
    .update({ quantity: existing.quantity + addedQuantity })
    .eq("id", existing.id)
    .select()
    .single();

  if (error) {
    throw new AppError("Failed to update asset quantity", 500);
  }

  return { asset: data as Asset, merged: true };
}

export async function createAsset(
  input: CreateAssetInput
): Promise<{ asset: Asset; merged: boolean }> {
  await checkRole({ roles: rolesForArea("inventory") });
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("Assets")
    .select("*")
    .eq("is_deleted", false)
    .eq("name", input.name)
    .maybeSingle();

  if (existing) {
    return mergeQuantityIntoExisting(supabase, existing as Asset, input.quantity);
  }

  const { data, error } = await supabase
    .from("Assets")
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
    if (error.code === "23505") {
      // Lost the race to a concurrent create of the same name; merge instead.
      const { data: racedExisting } = await supabase
        .from("Assets")
        .select("*")
        .eq("is_deleted", false)
        .eq("name", input.name)
        .single();

      if (racedExisting) {
        return mergeQuantityIntoExisting(supabase, racedExisting as Asset, input.quantity);
      }
    }

    throw new AppError("Failed to create asset", 500);
  }

  return { asset: data as Asset, merged: false };
}

export async function updateAsset(input: UpdateAssetInput): Promise<Asset> {
  await checkRole({ roles: rolesForArea("inventory") });
  const supabase = await createSupabaseServerClient();

  const { id, ...updates } = input;

  const { data, error } = await supabase
    .from("Assets")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new AppError("An asset with this name already exists.", 409);
    }
    throw new AppError("Failed to update asset", 500);
  }

  return data as Asset;
}

export async function deleteAsset(input: DeleteAssetInput): Promise<void> {
  await checkRole({ roles: rolesForArea("inventory") });
  const supabase = await createSupabaseServerClient();

  // Soft delete
  const { error } = await supabase
    .from("Assets")
    .update({ is_deleted: true })
    .eq("id", input.id);

  if (error) {
    throw new AppError("Failed to delete asset", 500);
  }
}

export async function decrementAssetQuantity(input: DeleteAssetInput): Promise<Asset> {
  await checkRole({ roles: rolesForArea("inventory") });
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("Assets")
    .select("*")
    .eq("id", input.id)
    .eq("is_deleted", false)
    .single();

  if (fetchError || !existing) {
    throw new AppError("Asset not found", 404);
  }

  const newQuantity = Math.max(0, (existing as Asset).quantity - 1);

  const { data, error } = await supabase
    .from("Assets")
    .update({ quantity: newQuantity })
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    throw new AppError("Failed to update quantity", 500);
  }

  return data as Asset;
}

// Public reads (no role gate). Assets' SELECT RLS policies are `TO authenticated`
// only (unlike the old Equipments table, which had a `TO public` policy) — use
// the admin client here so anonymous landing-page visitors still see the catalog.
export async function getAllAssetsPublic(): Promise<Asset[]> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("Assets")
    .select("*")
    .eq("is_deleted", false)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new AppError("Failed to fetch assets", 500);
  }

  return data as Asset[];
}

export async function getAssetCategories() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("Assets")
    .select("category")
    .eq("is_deleted", false);

  if (error) {
    console.error("Supabase Error [getAssetCategories]:", error);
    return ["MATERIALS", "EQUIPMENTS", "TOOLS"]; // fallback
  }

  const unique = Array.from(new Set(data.map((d) => d.category)));
  // Ensure default categories always exist
  const base = new Set(["MATERIALS", "EQUIPMENTS", "TOOLS", ...unique]);
  return Array.from(base).sort();
}
