import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export const TEST_PREFIX = "TEST_QA_";

/**
 * Tracks IDs created during a test so they can be torn down afterward,
 * in FK-safe order (BorrowRequestItems before BorrowRequests, since that
 * FK has no ON DELETE CASCADE — see purge_old_borrow_requests()).
 */
export class TestDataTracker {
  private assetIds: string[] = [];
  private borrowRequestIds: string[] = [];
  private borrowRequestItemIds: string[] = [];
  private auditLogIds: string[] = [];
  private storagePaths: { bucket: string; path: string }[] = [];

  trackAsset(id: string) {
    this.assetIds.push(id);
  }
  trackBorrowRequest(id: string) {
    this.borrowRequestIds.push(id);
  }
  trackBorrowRequestItem(id: string) {
    this.borrowRequestItemIds.push(id);
  }
  trackAuditLog(id: string) {
    this.auditLogIds.push(id);
  }
  trackStorageObject(bucket: string, path: string) {
    this.storagePaths.push({ bucket, path });
  }

  async cleanup(supabase: SupabaseClient<Database>) {
    if (this.auditLogIds.length > 0) {
      await supabase.from("AuditLogs").delete().in("id", this.auditLogIds);
    }
    if (this.borrowRequestItemIds.length > 0) {
      await supabase.from("BorrowRequestItems").delete().in("id", this.borrowRequestItemIds);
    }
    if (this.borrowRequestIds.length > 0) {
      // Items may also cascade-orphan via borrow_request_id even if not individually tracked.
      await supabase.from("BorrowRequestItems").delete().in("borrow_request_id", this.borrowRequestIds);
      await supabase.from("BorrowRequests").delete().in("id", this.borrowRequestIds);
    }
    if (this.assetIds.length > 0) {
      await supabase.from("Assets").delete().in("id", this.assetIds);
    }
    for (const { bucket, path } of this.storagePaths) {
      await supabase.storage.from(bucket).remove([path]);
    }

    this.assetIds = [];
    this.borrowRequestIds = [];
    this.borrowRequestItemIds = [];
    this.auditLogIds = [];
    this.storagePaths = [];
  }
}

/** Best-effort sweep for any leftover TEST_QA_-prefixed rows from a crashed prior run. */
export async function sweepLeftoverTestData(supabase: SupabaseClient<Database>) {
  const { data: staleAssets } = await supabase
    .from("Assets")
    .select("id")
    .ilike("name", `${TEST_PREFIX}%`);

  if (staleAssets && staleAssets.length > 0) {
    const ids = staleAssets.map((a) => a.id);
    await supabase.from("BorrowRequestItems").delete().in("asset_id", ids);
    await supabase.from("Assets").delete().in("id", ids);
  }
}
