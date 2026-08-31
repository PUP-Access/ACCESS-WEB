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
      pendingUsersResult,
      totalUsersResult,
      activeBorrowsResult,
      assetsResult,
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
      supabase
        .from("Users")
        .select("*", { count: "exact", head: true })
        .eq("role", "Pending"),
      supabase
        .from("Users")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("BorrowRequests")
        .select("*", { count: "exact", head: true })
        .eq("status", "Active"),
      supabase
        .from("Assets")
        .select("status, quantity")
        .eq("is_deleted", false),
    ]);

    const assetsData = assetsResult.data ?? [];
    const totalAssetsCount = assetsData.length;
    const totalAssetStockCount = assetsData.reduce((sum, a) => sum + (a.quantity || 0), 0);
    const assetsInMaintenanceCount = assetsData.filter(
      (a) => a.status === "Maintenance" || a.status === "Lost"
    ).length;

    return {
      pendingBorrowRequests,
      unreadContactMessages,
      draftEvents: draftEventsResult.count ?? 0,
      faqCount,
      recentBorrowRequests,
      recentContactMessages,
      pendingUserRegistrations: pendingUsersResult.count ?? 0,
      totalRegisteredUsers: totalUsersResult.count ?? 0,
      activeBorrowRequests: activeBorrowsResult.count ?? 0,
      totalAssetsCount,
      totalAssetStockCount,
      assetsInMaintenanceCount,
    };
  } catch (error) {
    console.error("Error in getAdminDashboardStats:", error);
    return {
      pendingBorrowRequests: 0,
      unreadContactMessages: 0,
      draftEvents: 0,
      faqCount: 0,
      recentBorrowRequests: [],
      recentContactMessages: [],
      pendingUserRegistrations: 0,
      totalRegisteredUsers: 0,
      activeBorrowRequests: 0,
      totalAssetsCount: 0,
      totalAssetStockCount: 0,
      assetsInMaintenanceCount: 0,
    };
  }
}
