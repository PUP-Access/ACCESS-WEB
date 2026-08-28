import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { AppError } from "@/lib/errors";

export type AssetQuantityItem = { assetId: string; quantity: number };
export type ResolvedRequestedItem = AssetQuantityItem & { name: string; category: string };

/** Pure builder for the denormalized `requested_item` display string, e.g. "Multimeter x2 (EQUIPMENTS), Screwdriver x1 (TOOLS)". */
export function buildRequestedItemDisplayString(
  items: { name: string; category: string; quantity: number }[]
): string {
  return items.map((i) => `${i.name} x${i.quantity} (${i.category})`).join(", ");
}

/**
 * Deducts or restocks Assets.quantity for each {assetId, quantity} pair, by
 * real FK lookup — no name/category matching. Accepts either the admin
 * (service-role) client or a session-bound server client, since it's called
 * from both the public submission flow and the admin reject/return flow.
 */
export async function adjustAssetQuantities(
  supabase: SupabaseClient<Database>,
  items: AssetQuantityItem[],
  direction: "deduct" | "restock"
): Promise<void> {
  for (const { assetId, quantity } of items) {
    const { data: asset, error: fetchError } = await supabase
      .from("Assets")
      .select("id, name, quantity")
      .eq("id", assetId)
      .single();

    if (fetchError || !asset) {
      if (direction === "deduct") {
        throw new AppError(`Asset not found: ${assetId}`, 404);
      }
      continue;
    }

    let newQuantity = asset.quantity;
    if (direction === "deduct") {
      newQuantity -= quantity;
      if (newQuantity < 0) {
        throw new AppError(
          `Not enough inventory for ${asset.name}. Available: ${asset.quantity}, Requested: ${quantity}`,
          409
        );
      }
    } else {
      newQuantity += quantity;
    }

    const { error: updateError } = await supabase
      .from("Assets")
      .update({ quantity: newQuantity })
      .eq("id", asset.id);

    if (updateError) throw updateError;
  }
}

/**
 * Joins BorrowRequestItems -> Assets for a given request. Used by the admin
 * reject/return flow to know what to restock without ever touching the
 * `requested_item` display string.
 */
export async function getBorrowRequestItemsWithAssets(
  supabase: SupabaseClient<Database>,
  borrowRequestId: string
): Promise<ResolvedRequestedItem[]> {
  const { data, error } = await supabase
    .from("BorrowRequestItems")
    .select("asset_id, quantity, Assets(name, category)")
    .eq("borrow_request_id", borrowRequestId);

  if (error) throw error;

  return (data ?? [])
    .filter((row): row is typeof row & { asset_id: string } => row.asset_id !== null)
    .map((row) => ({
      assetId: row.asset_id,
      quantity: row.quantity,
      name: row.Assets?.name ?? "Unknown",
      category: row.Assets?.category ?? "Unknown",
    }));
}
