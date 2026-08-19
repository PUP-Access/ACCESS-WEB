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

  // Log admin activity
  try {
    const { logAdminActivity } = await import("@/features/audit");
    await logAdminActivity("BORROW_STATUS_UPDATED", "BorrowRequest", id, {
      oldStatus: request.status,
      newStatus: status,
      borrower: request.borrower_contact_name,
      item: request.requested_item,
    });
  } catch (logErr) {
    console.error("Audit log error:", logErr);
  }

  // Send automated email notification if status changed
  if (request.status !== status && request.borrower_email && process.env.RESEND_API_KEY) {
    try {
      await sendBorrowStatusEmail(request, status);
    } catch (emailErr) {
      console.error("Failed to send borrow status email:", emailErr);
    }
  }
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export async function sendBorrowStatusEmail(request: BorrowRequest, newStatus: string) {
  if (!process.env.RESEND_API_KEY || !request.borrower_email) return;

  const { Resend } = await import("resend");
  const { renderAccessEmail } = await import("@/lib/email/email-template");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const name = request.borrower_contact_name || "Borrower";
  const items = request.requested_item || "Requested Items";
  const startDateFormatted = formatDateTime(request.requested_start_date);
  const endDateFormatted = formatDateTime(request.requested_end_date);
  const orgName = request.organization_name || "N/A";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pupaccess.org";

  let subject = "";
  let htmlBody = "";

  if (newStatus === "Pending") {
    subject = "Equipment Borrow Request Received – Pending Review | ACCESS";
    htmlBody = renderAccessEmail({
      title: "Equipment Borrow Request Received",
      preheader: `Your borrow request for ${items} has been recorded and is currently pending review.`,
      statusLabel: "Pending Review",
      recipientName: name,
      leadParagraph: `Thank you for submitting your equipment borrow request. We confirm that your request has been logged and is currently undergoing administrative review.`,
      secondaryParagraph: `Please wait while our officers verify equipment availability and approve your requested borrowing schedule. You will receive an automated confirmation once an official decision has been made.`,
      details: [
        { label: "Requested Items", value: items },
        { label: "Start Schedule", value: startDateFormatted },
        { label: "Target Return Date", value: endDateFormatted },
        { label: "Organization / Dept", value: orgName },
        ...(request.purpose ? [{ label: "Purpose", value: request.purpose }] : []),
      ],
      notice: {
        title: "Review in Progress",
        content: "Requests are subject to equipment availability and schedule verification. Please wait until your request is officially approved before claiming items at the laboratory.",
      },
      cta: {
        text: "View Equipment Portal",
        url: `${siteUrl}/#borrow`,
      },
      closingRemark: "For any questions regarding your reservation, feel free to visit Room 424, CEA Building or reply to this email.",
    });
  } else if (newStatus === "Approved") {
    subject = "Equipment Borrow Request Approved | ACCESS";
    htmlBody = renderAccessEmail({
      title: "Equipment Borrow Request Approved",
      preheader: `Your borrow request for ${items} has been approved.`,
      statusLabel: "Approved for Pickup",
      recipientName: name,
      leadParagraph: `We are pleased to inform you that your request to borrow equipment has been reviewed and <strong style="color: #16a34a;">Approved</strong>.`,
      details: [
        { label: "Approved Equipment", value: items },
        { label: "Pickup Schedule", value: startDateFormatted },
        { label: "Return Deadline", value: endDateFormatted },
        { label: "Organization", value: orgName },
      ],
      notice: {
        title: "Pickup Instructions",
        content: "• <strong>Location:</strong> Room 424, College of Engineering and Architecture (CEA) Building.<br/>• <strong>Requirement:</strong> Please present and surrender a valid School ID upon claiming.<br/>• <strong>Inspection:</strong> Please check equipment completeness before leaving the room.",
      },
      cta: {
        text: "Go to ACCESS Portal",
        url: `${siteUrl}/#borrow`,
      },
      closingRemark: "Please ensure prompt claiming during your designated schedule.",
    });
  } else if (newStatus === "Active") {
    subject = "Equipment Borrowing is Active – Care & Return Guidelines | ACCESS";
    htmlBody = renderAccessEmail({
      title: "Equipment Handover Confirmation",
      preheader: `Your borrowing transaction for ${items} is now Active.`,
      statusLabel: "Active (In Possession)",
      recipientName: name,
      leadParagraph: `This is to confirm that the requested equipment has been released to your custody. Your borrowing status is now <strong>Active</strong>.`,
      details: [
        { label: "Borrowed Equipment", value: items },
        { label: "Return Deadline", value: endDateFormatted, highlight: true },
        { label: "Return Location", value: "Room 424, CEA Building" },
        { label: "Borrower", value: `${name} (${orgName})` },
      ],
      notice: {
        title: "Important Care & Return Guidelines",
        content: `• <strong>Care:</strong> Please take good care of all borrowed items and accessories while in your possession.<br/>• <strong>Accountability:</strong> Any damages, loss, or missing components will be held strictly accountable to the borrower who borrowed the said item(s).`,
      },
      cta: {
        text: "Track Borrow Status",
        url: `${siteUrl}/#borrow`,
      },
      closingRemark: "Thank you for your cooperation and for taking good care of the equipment.",
    });
  } else if (newStatus === "Rejected") {
    subject = "Update regarding your Equipment Borrow Request | ACCESS";
    htmlBody = renderAccessEmail({
      title: "Equipment Borrow Request Notice",
      preheader: `Update regarding your borrowing request for ${items}.`,
      statusLabel: "Not Approved",
      recipientName: name,
      leadParagraph: `Thank you for your interest in utilizing ACCESS equipment. Following administrative review, we regret to inform you that your request could not be approved at this time.`,
      details: [
        { label: "Requested Equipment", value: items },
        { label: "Status", value: "Not Approved" },
        ...(request.rejection_reason ? [{ label: "Remarks", value: request.rejection_reason }] : []),
      ],
      notice: {
        title: "Remarks",
        content: request.rejection_reason || "Due to inventory availability or schedule constraints, this request could not be accommodated. You may submit a new request for an alternate schedule.",
      },
      closingRemark: "For further inquiries or assistance, feel free to visit Room 424, CEA Building.",
    });
  } else if (newStatus === "Returned") {
    subject = "Equipment Return Confirmation | ACCESS";
    htmlBody = renderAccessEmail({
      title: "Equipment Return Confirmation",
      preheader: `Your borrowed equipment (${items}) has been successfully returned.`,
      statusLabel: "Returned & Cleared",
      recipientName: name,
      leadParagraph: `This is to certify that the borrowed equipment has been successfully returned, inspected, and cleared in our system.`,
      details: [
        { label: "Returned Equipment", value: items },
        { label: "Status", value: "ID Released & Cleared" },
        { label: "Return Date", value: formatDateTime(new Date().toISOString()) },
      ],
      notice: {
        content: "Your surrendered ID has been released. Thank you for returning the equipment on time and in good condition!",
      },
      closingRemark: "Thank you for taking good care of our equipment.",
    });
  } else if (newStatus === "Cancelled") {
    subject = "Equipment Borrow Request Cancelled | ACCESS";
    htmlBody = renderAccessEmail({
      title: "Borrow Request Cancelled",
      preheader: `Your borrow request for ${items} has been marked as cancelled.`,
      statusLabel: "Cancelled",
      recipientName: name,
      leadParagraph: `This notification confirms that your equipment borrow request has been officially marked as <strong>Cancelled</strong>.`,
      secondaryParagraph: `The reserved items and schedule have been released back into the laboratory inventory.`,
      details: [
        { label: "Requested Items", value: items },
        { label: "Requested Schedule", value: `${startDateFormatted} – ${endDateFormatted}` },
        { label: "Organization / Dept", value: orgName },
        { label: "Status", value: "Cancelled", highlight: true },
      ],
      notice: {
        title: "Cancellation Notice",
        content: "If you still require equipment for an upcoming project, laboratory session, or organizational event, you are welcome to submit a new borrow request on the portal anytime.",
      },
      cta: {
        text: "Submit New Borrow Request",
        url: `${siteUrl}/#borrow`,
      },
      closingRemark: "For any questions or clarification regarding this cancellation, feel free to visit Room 424, CEA Building or reply to this email.",
    });
  }

  if (subject && htmlBody) {
    await resend.emails.send({
      from: "ACCESS <noreply@pupaccess.org>",
      to: request.borrower_email,
      subject,
      html: htmlBody,
    });
  }
}
