import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { checkRole } from "@/utils/checkRole";
import { getUnreadContactMessageCount } from "./contact-messages.service";
import { getPendingBorrowRequestCount, getRecentBorrowRequests } from "@/features/borrow";
import { getFAQCount } from "./faq.service";
import { getContactMessagesForAdmin } from "./contact-messages.service";

export async function getAdminDashboardStats() {
  await checkRole({ roles: "Admin" });

  try {
    const supabase = createSupabaseAdminClient();

    const [
      pendingBorrowRequests,
      unreadContactMessages,
      faqCount,
      draftEventsResult,
      recentBorrowRequests,
      recentContactMessages,
    ] = await Promise.all([
      getPendingBorrowRequestCount().catch(() => 0),
      getUnreadContactMessageCount().catch(() => 0),
      getFAQCount().catch(() => 0),
      supabase
        .from("Events")
        .select("*", { count: "exact", head: true })
        .eq("status", "Draft"),
      getRecentBorrowRequests(5).catch(() => []),
      getContactMessagesForAdmin({ limit: 5 }).catch(() => []),
    ]);

    return {
      pendingBorrowRequests,
      unreadContactMessages,
      draftEvents: draftEventsResult.count ?? 0,
      faqCount,
      recentBorrowRequests,
      recentContactMessages,
    };
  } catch {
    return {
      pendingBorrowRequests: 0,
      unreadContactMessages: 0,
      draftEvents: 0,
      faqCount: 0,
      recentBorrowRequests: [],
      recentContactMessages: [],
    };
  }
}
