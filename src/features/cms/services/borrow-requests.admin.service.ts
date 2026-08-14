import { throwSupabaseError } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { checkRole } from "@/utils/checkRole";
import type { Tables } from "@/lib/supabase/database.types";

export type BorrowRequest = Tables<"BorrowRequests">;

export type BorrowRequestsFilter = {
  status?: Tables<"BorrowRequests">["status"] | "All";
  page?: number;
  limit?: number;
};

export async function getBorrowRequestsForAdmin({
  status = "Pending",
  page = 1,
  limit = 10,
}: BorrowRequestsFilter = {}) {
  await checkRole({ roles: "Admin" });
  const supabase = createSupabaseAdminClient();

  const maxRows = Math.min(limit, 50);
  const from = (page - 1) * limit;
  const to = from + maxRows - 1;

  let query = supabase
    .from("BorrowRequests")
    .select("*", { count: "exact" });

  if (status !== "All" && status) {
    query = query.eq("status", status);
  }

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  throwSupabaseError(error);

  return {
    data: data ?? [],
    meta: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  };
}

export async function getBorrowRequestById(id: string) {
  await checkRole({ roles: "Admin" });
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("BorrowRequests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  throwSupabaseError(error);
  if (!data) throw new Error("Borrow request not found");
  return data;
}

export async function getPendingBorrowRequestCount(): Promise<number> {
  await checkRole({ roles: "Admin" });
  const supabase = createSupabaseAdminClient();

  const { count, error } = await supabase
    .from("BorrowRequests")
    .select("*", { count: "exact", head: true })
    .eq("status", "Pending");

  throwSupabaseError(error);
  return count ?? 0;
}

export async function getRecentBorrowRequests(limit = 5) {
  await checkRole({ roles: "Admin" });
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("BorrowRequests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  throwSupabaseError(error);
  return data ?? [];
}

export async function updateBorrowRequestStatus(id: string, status: string) {
  await checkRole({ roles: "Admin" });
  const supabase = createSupabaseAdminClient();

  const { data: request, error: fetchError } = await supabase
    .from("BorrowRequests")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !request) {
    throw new Error("Borrow request not found");
  }

  const deductedStatuses = ["Pending", "Approved", "Active"];
  const wasDeducted = deductedStatuses.includes(request.status || "");
  const willBeDeducted = deductedStatuses.includes(status);

  if (wasDeducted !== willBeDeducted && request.requested_item) {
    const items = request.requested_item.split(", ");
    
    for (const itemStr of items) {
      const match = itemStr.match(/(.+?) x(\d+) \((.+?)\)/);
      if (match) {
        const name = match[1];
        const qty = parseInt(match[2], 10);
        const category = match[3];

        const { data: equipment } = await supabase
          .from("Equipments")
          .select("*")
          .eq("name", name)
          .eq("category", category)
          .single();

        if (equipment) {
          let newQuantity = equipment.quantity;
          if (!wasDeducted && willBeDeducted) {
            newQuantity -= qty;
            if (newQuantity < 0) {
              throw new Error(`Not enough inventory for ${name}. Available: ${equipment.quantity}, Requested: ${qty}`);
            }
          } else if (wasDeducted && !willBeDeducted) {
            newQuantity += qty;
          }

          const { error: updateInvError } = await supabase
            .from("Equipments")
            .update({ quantity: newQuantity })
            .eq("id", equipment.id);

          if (updateInvError) throw updateInvError;
        }
      }
    }
  }

  const { error } = await supabase
    .from("BorrowRequests")
    .update({ status: status as any })
    .eq("id", id);

  throwSupabaseError(error);
}
