import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { checkRole } from "@/utils/checkRole";
import { AppError } from "@/lib/errors";
import type { Json, Tables } from "@/lib/supabase/database.types";
import {
  AdminBorrowRequestsFilterSchema,
  BorrowRequestIdSchema,
  RejectBorrowRequestSchema,
} from "../schemas";
import { adjustEquipmentQuantities } from "../utils/requested-items";
import { sendBorrowStatusEmail } from "./borrow-status-email";

export type BorrowRequest = Tables<"BorrowRequests">;

export type BorrowRequestsFilter = {
  status?: BorrowRequest["status"] | "All";
  page?: number;
  limit?: number;
};

export async function getBorrowRequestsForAdmin({
  status = "Pending",
  page = 1,
  limit = 10,
}: BorrowRequestsFilter = {}) {
  const filters = AdminBorrowRequestsFilterSchema.parse({ status, page, limit });

  await checkRole({ roles: "Admin" });
  const supabase = await createSupabaseServerClient();

  const maxRows = Math.min(filters.limit, 50);
  const from = (filters.page - 1) * filters.limit;
  const to = from + maxRows - 1;

  let query = supabase.from("BorrowRequests").select("*", { count: "exact" });

  if (filters.status !== "All") {
    query = query.eq("status", filters.status);
  }

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: data ?? [],
    meta: {
      page: filters.page,
      limit: filters.limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / filters.limit),
    },
  };
}

export async function getBorrowRequestById(id: string): Promise<BorrowRequest> {
  BorrowRequestIdSchema.parse(id);

  await checkRole({ roles: "Admin" });
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("BorrowRequests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new AppError(`Borrow request with id ${id} not found`, 404);
  return data;
}

export async function getPendingBorrowRequestCount(): Promise<number> {
  await checkRole({ roles: "Admin" });
  const supabase = await createSupabaseServerClient();

  const { count, error } = await supabase
    .from("BorrowRequests")
    .select("*", { count: "exact", head: true })
    .eq("status", "Pending");

  if (error) throw error;
  return count ?? 0;
}

export async function getRecentBorrowRequests(limit = 5): Promise<BorrowRequest[]> {
  await checkRole({ roles: "Admin" });
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("BorrowRequests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

async function loadRequestForTransition(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  id: string,
  requiredStatus: BorrowRequest["status"]
): Promise<BorrowRequest> {
  const { data: request, error } = await supabase
    .from("BorrowRequests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!request) throw new AppError(`Borrow request with id ${id} not found`, 404);
  if (request.status !== requiredStatus) {
    throw new AppError(`Cannot perform this action on a request in "${request.status}" status`, 409);
  }

  return request;
}

async function logBorrowAuditEvent(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  action: string,
  entityId: string,
  stateChanges: Record<string, unknown>
) {
  try {
    const { error } = await supabase.rpc("log_audit_event", {
      p_action: action,
      p_entity_type: "BorrowRequest",
      p_entity_id: entityId,
      p_state_changes: stateChanges as Json,
    });
    if (error) console.error("Audit log RPC error:", error);
  } catch (err) {
    console.error("Audit log error:", err);
  }
}

async function notifyBorrower(request: BorrowRequest, status: string) {
  try {
    await sendBorrowStatusEmail(request, status);
  } catch (emailErr) {
    console.error(`Failed to send ${status} borrow status email:`, emailErr);
  }
}

export async function approveBorrowRequest(id: string): Promise<BorrowRequest> {
  BorrowRequestIdSchema.parse(id);

  await checkRole({ roles: "Admin" });
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const request = await loadRequestForTransition(supabase, id, "Pending");

  const nowIso = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("BorrowRequests")
    .update({
      status: "Approved",
      reviewed_by: user?.id ?? null,
      reviewed_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  await logBorrowAuditEvent(supabase, "BORROW_REQUEST_APPROVED", id, {
    oldStatus: "Pending",
    newStatus: "Approved",
    borrower: request.borrower_contact_name,
    item: request.requested_item,
  });

  await notifyBorrower(updated, "Approved");

  return updated;
}

export async function rejectBorrowRequest(id: string, reason: string): Promise<BorrowRequest> {
  BorrowRequestIdSchema.parse(id);
  const { reason: validatedReason } = RejectBorrowRequestSchema.parse({ reason });

  await checkRole({ roles: "Admin" });
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const request = await loadRequestForTransition(supabase, id, "Pending");

  await adjustEquipmentQuantities(supabase, request.requested_item, "restock");

  const nowIso = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("BorrowRequests")
    .update({
      status: "Rejected",
      rejection_reason: validatedReason,
      reviewed_by: user?.id ?? null,
      reviewed_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  await logBorrowAuditEvent(supabase, "BORROW_REQUEST_REJECTED", id, {
    oldStatus: "Pending",
    newStatus: "Rejected",
    reason: validatedReason,
    borrower: request.borrower_contact_name,
    item: request.requested_item,
  });

  await notifyBorrower(updated, "Rejected");

  return updated;
}

export async function releaseBorrowRequest(id: string): Promise<BorrowRequest> {
  BorrowRequestIdSchema.parse(id);

  await checkRole({ roles: "Admin" });
  const supabase = await createSupabaseServerClient();

  const request = await loadRequestForTransition(supabase, id, "Approved");

  const nowIso = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("BorrowRequests")
    .update({
      status: "Active",
      released_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  await logBorrowAuditEvent(supabase, "BORROW_REQUEST_RELEASED", id, {
    oldStatus: "Approved",
    newStatus: "Active",
    releasedAt: nowIso,
    borrower: request.borrower_contact_name,
    item: request.requested_item,
  });

  await notifyBorrower(updated, "Active");

  return updated;
}

export async function returnBorrowRequest(id: string): Promise<BorrowRequest> {
  BorrowRequestIdSchema.parse(id);

  await checkRole({ roles: "Admin" });
  const supabase = await createSupabaseServerClient();

  const request = await loadRequestForTransition(supabase, id, "Active");

  await adjustEquipmentQuantities(supabase, request.requested_item, "restock");

  const nowIso = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("BorrowRequests")
    .update({
      status: "Returned",
      returned_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  await logBorrowAuditEvent(supabase, "BORROW_REQUEST_RETURNED", id, {
    oldStatus: "Active",
    newStatus: "Returned",
    returnedAt: nowIso,
    borrower: request.borrower_contact_name,
    item: request.requested_item,
  });

  await notifyBorrower(updated, "Returned");

  return updated;
}

export type ResolvedLetter =
  | { kind: "legacy-public-url"; url: string }
  | { kind: "signed"; url: string; expiresAt: string }
  | { kind: "none" };

const SIGNED_URL_TTL_SECONDS = 60;

export async function resolveBorrowRequestLetterUrl(id: string): Promise<ResolvedLetter> {
  BorrowRequestIdSchema.parse(id);
  await checkRole({ roles: "Admin" });

  const request = await getBorrowRequestById(id);
  const letterFileUrl = request.letter_file_url;

  if (!letterFileUrl) return { kind: "none" };

  if (letterFileUrl.startsWith("http")) {
    return { kind: "legacy-public-url", url: letterFileUrl };
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data, error } = await adminSupabase.storage
    .from("request-letters")
    .createSignedUrl(letterFileUrl, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    throw new AppError(error?.message || "Failed to generate a signed URL for this letter.", 500);
  }

  return {
    kind: "signed",
    url: data.signedUrl,
    expiresAt: new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString(),
  };
}
