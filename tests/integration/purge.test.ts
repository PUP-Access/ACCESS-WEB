import { afterEach, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createTestSupabaseClient } from "../helpers/test-supabase-client";
import { TestDataTracker } from "../helpers/cleanup";

const supabase = createTestSupabaseClient();
const tracker = new TestDataTracker();

// Safely in the past regardless of when the suite runs.
const PRIOR_MONTH_ISO = new Date(Date.UTC(2020, 0, 1)).toISOString();
const CURRENT_MONTH_ISO = new Date().toISOString();

afterEach(async () => {
  await tracker.cleanup(supabase);
});

async function insertBorrowRequest(updatedAt: string) {
  const { data, error } = await supabase
    .from("BorrowRequests")
    .insert({
      status: "Returned",
      requested_start_date: updatedAt,
      requested_end_date: updatedAt,
      returned_at: updatedAt,
      created_at: updatedAt,
      updated_at: updatedAt,
    })
    .select()
    .single();
  if (error || !data) throw error ?? new Error("Failed to insert test BorrowRequest");
  return data;
}

async function insertAuditLog(createdAt: string, entityId: string | null = null) {
  const { data, error } = await supabase
    .from("AuditLogs")
    .insert({
      id: crypto.randomUUID(),
      action: "TEST_EVENT",
      entity_type: "BorrowRequest",
      entity_id: entityId,
      created_at: createdAt,
    })
    .select()
    .single();
  if (error || !data) throw error ?? new Error("Failed to insert test AuditLog");
  return data;
}

describe("purge_old_borrow_requests", () => {
  it("deletes Returned requests (and their items) with updated_at in a prior month", async () => {
    const br = await insertBorrowRequest(PRIOR_MONTH_ISO);
    tracker.trackBorrowRequest(br.id);

    const { error: rpcError } = await supabase.rpc("purge_old_borrow_requests");
    expect(rpcError).toBeNull();

    const { data: remaining } = await supabase.from("BorrowRequests").select("id").eq("id", br.id);
    expect(remaining).toHaveLength(0);
  });

  it("does NOT delete requests updated in the current month", async () => {
    const br = await insertBorrowRequest(CURRENT_MONTH_ISO);
    tracker.trackBorrowRequest(br.id);

    const { error: rpcError } = await supabase.rpc("purge_old_borrow_requests");
    expect(rpcError).toBeNull();

    const { data: remaining } = await supabase.from("BorrowRequests").select("id").eq("id", br.id);
    expect(remaining).toHaveLength(1);
  });
});

describe("purge_old_audit_logs", () => {
  it("deletes any AuditLogs entry (regardless of entity_type) with created_at in a prior month", async () => {
    const log = await insertAuditLog(PRIOR_MONTH_ISO);
    tracker.trackAuditLog(log.id);

    const { error: rpcError } = await supabase.rpc("purge_old_audit_logs");
    expect(rpcError).toBeNull();

    const { data: remaining } = await supabase.from("AuditLogs").select("id").eq("id", log.id);
    expect(remaining).toHaveLength(0);
  });

  it("does NOT delete AuditLogs entries created in the current month", async () => {
    const log = await insertAuditLog(CURRENT_MONTH_ISO);
    tracker.trackAuditLog(log.id);

    const { error: rpcError } = await supabase.rpc("purge_old_audit_logs");
    expect(rpcError).toBeNull();

    const { data: remaining } = await supabase.from("AuditLogs").select("id").eq("id", log.id);
    expect(remaining).toHaveLength(1);
  });
});

describe("purge function grants", () => {
  it("rejects calls from non-service-role clients (anon)", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) throw new Error("Missing Supabase anon env vars for this test");

    const anonClient = createClient<Database>(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await anonClient.rpc("purge_old_borrow_requests");
    expect(error).not.toBeNull();
  });
});
