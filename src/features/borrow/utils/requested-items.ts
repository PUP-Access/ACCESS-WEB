import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { AppError } from "@/lib/errors";

export type ParsedRequestedItem = { name: string; quantity: number; category: string };

const ITEM_PATTERN = /(.+?) x(\d+) \((.+?)\)/;

/** Parses "Multimeter x2 (EQUIPMENTS), Screwdriver x1 (TOOLS)" into structured rows. */
export function parseRequestedItems(requestedItem: string | null): ParsedRequestedItem[] {
  if (!requestedItem) return [];

  return requestedItem
    .split(", ")
    .map((itemStr) => {
      const match = itemStr.match(ITEM_PATTERN);
      if (!match) return null;
      return {
        name: match[1],
        quantity: parseInt(match[2], 10),
        category: match[3],
      };
    })
    .filter((item): item is ParsedRequestedItem => item !== null);
}

/**
 * Deducts or restocks Equipments.quantity for each item encoded in a request's
 * `requested_item` string. Accepts either the admin (service-role) client or a
 * session-bound server client, since it's called from both the public submission
 * flow and the admin approve/reject/release/return flow.
 */
export async function adjustEquipmentQuantities(
  supabase: SupabaseClient<Database>,
  requestedItem: string | null,
  direction: "deduct" | "restock"
): Promise<void> {
  const items = parseRequestedItems(requestedItem);

  for (const { name, quantity, category } of items) {
    const { data: equipment, error: fetchError } = await supabase
      .from("Equipments")
      .select("*")
      .eq("name", name)
      .eq("category", category)
      .single();

    if (fetchError || !equipment) {
      if (direction === "deduct") {
        throw new AppError(`Equipment not found: ${name}`, 404);
      }
      continue;
    }

    let newQuantity = equipment.quantity;
    if (direction === "deduct") {
      newQuantity -= quantity;
      if (newQuantity < 0) {
        throw new AppError(
          `Not enough inventory for ${name}. Available: ${equipment.quantity}, Requested: ${quantity}`,
          409
        );
      }
    } else {
      newQuantity += quantity;
    }

    const { error: updateError } = await supabase
      .from("Equipments")
      .update({ quantity: newQuantity })
      .eq("id", equipment.id);

    if (updateError) throw updateError;
  }
}
