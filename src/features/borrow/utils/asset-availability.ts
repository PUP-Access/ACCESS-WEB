import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { parseUtcDate, getManilaHourMinute } from "@/lib/date-utils";

const OPERATING_START_MINUTES = 8 * 60; // 8:00 AM
const OPERATING_END_MINUTES = 18 * 60 + 45; // 6:45 PM
export const OPERATING_HOURS_LABEL = "8:00 AM and 6:45 PM";

const BLOCKING_STATUSES = ["Pending", "Approved", "Active"] as const;

/** Whether an instant falls within daily operating hours, in Philippine Time. */
export function isWithinOperatingHours(date: Date): boolean {
  const { hour, minute } = getManilaHourMinute(date);
  const minutes = hour * 60 + minute;
  return minutes >= OPERATING_START_MINUTES && minutes <= OPERATING_END_MINUTES;
}

/** Whether an instant falls on a Sunday, in Philippine Time. */
export function isSunday(date: Date): boolean {
  const manilaShifted = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return manilaShifted.getUTCDay() === 0;
}

export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

export type UnavailablePeriod = { startDate: Date; endDate: Date; quantity: number };

/**
 * Loads the date ranges + quantities reserved for an asset by any borrow
 * request that is Pending, Approved, or Active (Rejected/Returned/Cancelled don't reserve stock).
 */
export async function getUnavailablePeriods(
  supabase: SupabaseClient<Database>,
  assetId: string
): Promise<UnavailablePeriod[]> {
  const { data, error } = await supabase
    .from("BorrowRequestItems")
    .select("quantity, BorrowRequests(requested_start_date, requested_end_date, status)")
    .eq("asset_id", assetId);

  if (error) throw error;

  const periods: UnavailablePeriod[] = [];
  for (const row of data ?? []) {
    const br = row.BorrowRequests;
    if (!br || !BLOCKING_STATUSES.includes(br.status as (typeof BLOCKING_STATUSES)[number])) continue;
    const startDate = parseUtcDate(br.requested_start_date);
    const endDate = parseUtcDate(br.requested_end_date);
    if (!startDate || !endDate) continue;
    periods.push({ startDate, endDate, quantity: row.quantity });
  }
  return periods;
}

export type AvailabilityResult = {
  available: boolean;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
};

/**
 * Checks whether `requestedQuantity` units of an asset are available for the
 * requested date range, accounting for other blocking requests that overlap it.
 */
export async function checkAssetAvailability(
  supabase: SupabaseClient<Database>,
  params: {
    assetId: string;
    totalQuantity: number;
    requestedStartDate: Date;
    requestedEndDate: Date;
    requestedQuantity: number;
  }
): Promise<AvailabilityResult> {
  const periods = await getUnavailablePeriods(supabase, params.assetId);

  const reservedQuantity = periods
    .filter((p) => rangesOverlap(params.requestedStartDate, params.requestedEndDate, p.startDate, p.endDate))
    .reduce((sum, p) => sum + p.quantity, 0);

  const availableQuantity = params.totalQuantity - reservedQuantity;

  return {
    available: availableQuantity >= params.requestedQuantity,
    totalQuantity: params.totalQuantity,
    reservedQuantity,
    availableQuantity,
  };
}

export type ItemAvailabilityResult = {
  assetId: string;
  name: string;
  category: string;
  available: boolean;
  availableQuantity: number;
  requestedQuantity: number;
};

/**
 * Batch version of checkAssetAvailability for a cart of {assetId, quantity}
 * items sharing one date range. Single source of truth for both the
 * pre-submit form check and the final server-side submission gate.
 */
export async function checkItemsAvailability(
  supabase: SupabaseClient<Database>,
  items: { assetId: string; quantity: number }[],
  requestedStartDate: Date,
  requestedEndDate: Date
): Promise<{ ok: boolean; results: ItemAvailabilityResult[] }> {
  const assetIds = items.map((i) => i.assetId);
  const { data: assets, error } = await supabase
    .from("Assets")
    .select("id, name, category, quantity, is_deleted")
    .in("id", assetIds);

  if (error) throw error;

  const assetById = new Map((assets ?? []).map((a) => [a.id, a]));
  const results: ItemAvailabilityResult[] = [];

  for (const item of items) {
    const asset = assetById.get(item.assetId);
    if (!asset || asset.is_deleted) {
      results.push({
        assetId: item.assetId,
        name: "Unknown item",
        category: "",
        available: false,
        availableQuantity: 0,
        requestedQuantity: item.quantity,
      });
      continue;
    }

    const availability = await checkAssetAvailability(supabase, {
      assetId: item.assetId,
      totalQuantity: asset.quantity,
      requestedStartDate,
      requestedEndDate,
      requestedQuantity: item.quantity,
    });

    results.push({
      assetId: item.assetId,
      name: asset.name,
      category: asset.category,
      available: availability.available,
      availableQuantity: availability.availableQuantity,
      requestedQuantity: item.quantity,
    });
  }

  return { ok: results.every((r) => r.available), results };
}
