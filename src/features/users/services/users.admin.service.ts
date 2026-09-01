import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { checkRole } from "@/utils/checkRole";
import { rolesForArea } from "@/utils/adminAccess";
import { throwSupabaseError, AppError } from "@/lib/errors";
import type { UserRole, UserRow, GetUsersOptions } from "../types";

export async function getUserStats() {
  await checkRole({ roles: rolesForArea("users") });
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("Users")
    .select("role");

  throwSupabaseError(error);

  const users = data ?? [];
  const total = users.length;
  const pending = users.filter((u) => u.role === "Pending").length;
  const organization = users.filter((u) => u.role === "Organization").length;
  const admin = users.filter((u) => u.role === "Admin").length;

  return {
    total,
    pending,
    organization,
    admin,
  };
}

export async function getUsersForAdmin(options: GetUsersOptions = {}) {
  await checkRole({ roles: rolesForArea("users") });
  const supabase = createSupabaseAdminClient();

  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(50, Math.max(1, options.limit ?? 10));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("Users")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (options.role && options.role !== "All") {
    query = query.eq("role", options.role as UserRole);
  }

  if (options.search && options.search.trim().length > 0) {
    const term = options.search.trim();
    query = query.or(`email.ilike.%${term}%,organization_name.ilike.%${term}%`);
  }

  query = query.range(from, to);

  const { data, error, count } = await query;
  throwSupabaseError(error);

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: (data ?? []) as UserRow[],
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

export async function updateUserRole(userId: string, newRole: UserRole) {
  await checkRole({ roles: rolesForArea("users") });
  const supabase = createSupabaseAdminClient();

  const validRoles: UserRole[] = ["Admin", "Organization", "Pending", "Tech", "SponsorsPartners", "Govs"];
  if (!validRoles.includes(newRole)) {
    throw new AppError("Invalid role provided", 400);
  }

  const { data, error } = await supabase
    .from("Users")
    .update({
      role: newRole,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  throwSupabaseError(error);

  const updatedUser = data as UserRow;

  // Log admin activity
  try {
    const { logAdminActivity } = await import("@/features/audit");
    await logAdminActivity("USER_ROLE_UPDATED", "User", userId, {
      newRole,
      email: updatedUser.email,
      organization: updatedUser.organization_name,
    });
  } catch (logErr) {
    console.error("Audit log error:", logErr);
  }

  // Send approval notification email if user was approved
  if (
    newRole === "Organization" &&
    updatedUser.email &&
    process.env.RESEND_API_KEY
  ) {
    try {
      await sendAccountApprovedEmail(updatedUser);
    } catch (emailErr) {
      console.error("Failed to send account approval email:", emailErr);
    }
  }

  return updatedUser;
}

export async function deleteUserAccount(userId: string) {
  await checkRole({ roles: rolesForArea("users") });
  const { createSupabaseServerClient } = await import("@/lib/supabase/server-client");
  const serverSupabase = await createSupabaseServerClient();
  const {
    data: { user: currentAdmin },
  } = await serverSupabase.auth.getUser();

  if (currentAdmin && currentAdmin.id === userId) {
    throw new AppError("You cannot delete your own active administrator account.", 400);
  }

  const supabase = createSupabaseAdminClient();

  // 1. Fetch user data before deletion for audit logging
  const { data: user, error: fetchErr } = await supabase
    .from("Users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  throwSupabaseError(fetchErr);
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  // 2. Cascade delete BorrowRequests associated with this user
  if (user.email) {
    await supabase
      .from("BorrowRequests")
      .delete()
      .ilike("borrower_email", user.email);
  }
  await supabase.from("BorrowRequests").delete().eq("user_id", userId);

  // 3. Delete from public.Users
  const { error: userDeleteErr } = await supabase
    .from("Users")
    .delete()
    .eq("id", userId);

  throwSupabaseError(userDeleteErr);

  // 4. Delete user from Supabase Auth
  try {
    await supabase.auth.admin.deleteUser(userId);
  } catch (authErr) {
    console.error("Warning: Failed to delete user from Supabase Auth:", authErr);
  }

  // 5. Log admin activity
  try {
    const { logAdminActivity } = await import("@/features/audit");
    await logAdminActivity("USER_DELETED", "User", userId, {
      email: user.email,
      organization: user.organization_name,
      role: user.role,
    });
  } catch (logErr) {
    console.error("Audit log error:", logErr);
  }

  return { success: true, user };
}

async function sendAccountApprovedEmail(user: UserRow) {
  if (!process.env.RESEND_API_KEY || !user.email) return;

  const { Resend } = await import("resend");
  const { renderAccessEmail } = await import("@/lib/email/email-template");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const orgName = user.organization_name || "Member";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pupaccess.org";

  await resend.emails.send({
    from: "ACCESS <noreply@pupaccess.org>",
    to: user.email,
    subject: "Account Approved – Equipment Borrowing Unlocked | ACCESS",
    html: renderAccessEmail({
      title: "Account Approved",
      preheader: `Your account for ${orgName} has been approved. Equipment borrowing is now unlocked.`,
      statusLabel: "Account Approved",
      salutation: `Dear Representative of ${orgName},`,
      leadParagraph: `We are pleased to inform you that your organization account on the <strong>PUP ACCESS</strong> portal has been reviewed and verified.`,
      secondaryParagraph: `Your organization is now authorized to submit equipment borrow requests and reserve laboratory assets.`,
      details: [
        { label: "Organization", value: orgName },
        { label: "Account Status", value: "Verified & Active" },
        { label: "Borrowing Privileges", value: "Unlocked", highlight: true },
      ],
      notice: {
        title: "Borrowing Privileges Unlocked",
        content: "You can now browse the inventory catalog and submit borrow requests for academic projects and organizational activities.",
      },
      cta: {
        text: "Browse Equipment & Borrow",
        url: `${siteUrl}/#borrow`,
      },
      closingRemark: "For any assistance or questions, feel free to visit Room 424, CEA Building or reply to this email.",
    }),
  });
}
