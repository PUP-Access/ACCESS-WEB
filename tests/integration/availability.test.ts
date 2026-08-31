import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  checkAssetAvailability,
  checkItemsAvailability,
  isWithinOperatingHours,
  rangesOverlap,
} from "@/features/borrow/utils/asset-availability";
import { manilaWallTimeToUtcDate, getManilaHourMinute } from "@/lib/date-utils";
import { createTestSupabaseClient } from "../helpers/test-supabase-client";
import { TestDataTracker, TEST_PREFIX, sweepLeftoverTestData } from "../helpers/cleanup";

const supabase = createTestSupabaseClient();
const tracker = new TestDataTracker();

let assetId: string;

beforeAll(async () => {
  await sweepLeftoverTestData(supabase);

  const { data: asset, error } = await supabase
    .from("Assets")
    .insert({
      name: `${TEST_PREFIX}Availability Widget ${Date.now()}`,
      category: "TOOLS",
      quantity: 2,
    })
    .select()
    .single();

  if (error || !asset) throw error ?? new Error("Failed to create test asset");
  assetId = asset.id;
});

afterEach(async () => {
  await tracker.cleanup(supabase);
});

afterAll(async () => {
  await supabase.from("Assets").delete().eq("id", assetId);
});

type BorrowStatus = "Pending" | "Approved" | "Rejected" | "Active" | "Returned" | "Cancelled";

async function createBorrowRequest(status: BorrowStatus, start: Date, end: Date, quantity: number) {
  const { data: br, error } = await supabase
    .from("BorrowRequests")
    .insert({
      status,
      requested_start_date: start.toISOString(),
      requested_end_date: end.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error || !br) throw error ?? new Error("Failed to create test BorrowRequest");
  tracker.trackBorrowRequest(br.id);

  const { data: item, error: itemError } = await supabase
    .from("BorrowRequestItems")
    .insert({ borrow_request_id: br.id, asset_id: assetId, quantity })
    .select()
    .single();
  if (itemError || !item) throw itemError ?? new Error("Failed to create test BorrowRequestItem");
  tracker.trackBorrowRequestItem(item.id);

  return br;
}

const DAY1_START = manilaWallTimeToUtcDate(2026, 6, 10, 9, 0);
const DAY1_END = manilaWallTimeToUtcDate(2026, 6, 10, 17, 0);

describe("checkAssetAvailability / checkItemsAvailability", () => {
  it("Pending/Approved/Active overlapping requests reduce availability; Rejected/Returned/Cancelled do not", async () => {
    await createBorrowRequest("Pending", DAY1_START, DAY1_END, 1);

    let result = await checkAssetAvailability(supabase, {
      assetId,
      totalQuantity: 2,
      requestedStartDate: DAY1_START,
      requestedEndDate: DAY1_END,
      requestedQuantity: 2,
    });
    expect(result.available).toBe(false);
    expect(result.availableQuantity).toBe(1);

    await createBorrowRequest("Rejected", DAY1_START, DAY1_END, 5);
    await createBorrowRequest("Returned", DAY1_START, DAY1_END, 5);
    await createBorrowRequest("Cancelled", DAY1_START, DAY1_END, 5);

    // Terminal statuses shouldn't add to reserved quantity.
    result = await checkAssetAvailability(supabase, {
      assetId,
      totalQuantity: 2,
      requestedStartDate: DAY1_START,
      requestedEndDate: DAY1_END,
      requestedQuantity: 1,
    });
    expect(result.available).toBe(true);
    expect(result.availableQuantity).toBe(1);
  });

  it("treats exact-boundary touching ranges as overlapping (inclusive)", async () => {
    await createBorrowRequest("Approved", DAY1_START, DAY1_END, 2);

    const touchingStart = DAY1_END; // new range starts exactly when the existing one ends
    const touchingEnd = manilaWallTimeToUtcDate(2026, 6, 11, 12, 0);

    const result = await checkAssetAvailability(supabase, {
      assetId,
      totalQuantity: 2,
      requestedStartDate: touchingStart,
      requestedEndDate: touchingEnd,
      requestedQuantity: 1,
    });
    expect(result.available).toBe(false);
    expect(result.availableQuantity).toBe(0);
  });

  it("non-overlapping date ranges do not reduce availability", async () => {
    await createBorrowRequest("Active", DAY1_START, DAY1_END, 2);

    const laterStart = manilaWallTimeToUtcDate(2026, 6, 12, 9, 0);
    const laterEnd = manilaWallTimeToUtcDate(2026, 6, 12, 17, 0);

    const result = await checkAssetAvailability(supabase, {
      assetId,
      totalQuantity: 2,
      requestedStartDate: laterStart,
      requestedEndDate: laterEnd,
      requestedQuantity: 2,
    });
    expect(result.available).toBe(true);
  });

  it("checkItemsAvailability aggregates multiple items and reports per-item results", async () => {
    await createBorrowRequest("Approved", DAY1_START, DAY1_END, 2);

    const { ok, results } = await checkItemsAvailability(
      supabase,
      [{ assetId, quantity: 1 }],
      DAY1_START,
      DAY1_END
    );
    expect(ok).toBe(false);
    expect(results).toHaveLength(1);
    expect(results[0].available).toBe(false);
    expect(results[0].availableQuantity).toBe(0);
  });
});

describe("rangesOverlap", () => {
  it("detects overlap and non-overlap correctly", () => {
    const a1 = new Date("2026-06-01T00:00:00Z");
    const a2 = new Date("2026-06-05T00:00:00Z");
    const b1 = new Date("2026-06-04T00:00:00Z");
    const b2 = new Date("2026-06-10T00:00:00Z");
    const c1 = new Date("2026-06-06T00:00:00Z");
    const c2 = new Date("2026-06-08T00:00:00Z");

    expect(rangesOverlap(a1, a2, b1, b2)).toBe(true);
    expect(rangesOverlap(a1, a2, c1, c2)).toBe(false);
  });
});

describe("operating hours (Philippine Time)", () => {
  it("accepts the boundaries 8:00 AM and 6:45 PM", () => {
    expect(isWithinOperatingHours(manilaWallTimeToUtcDate(2026, 6, 10, 8, 0))).toBe(true);
    expect(isWithinOperatingHours(manilaWallTimeToUtcDate(2026, 6, 10, 18, 45))).toBe(true);
  });

  it("rejects times just outside the boundaries", () => {
    expect(isWithinOperatingHours(manilaWallTimeToUtcDate(2026, 6, 10, 7, 59))).toBe(false);
    expect(isWithinOperatingHours(manilaWallTimeToUtcDate(2026, 6, 10, 18, 46))).toBe(false);
  });

  it("manilaWallTimeToUtcDate/getManilaHourMinute round-trip regardless of host timezone", () => {
    const d = manilaWallTimeToUtcDate(2026, 3, 15, 8, 0);
    // 8:00 AM PHT (UTC+8) is midnight UTC.
    expect(d.toISOString()).toBe("2026-03-15T00:00:00.000Z");
    expect(getManilaHourMinute(d)).toEqual({ hour: 8, minute: 0 });
  });
});
