"use server";

import { revalidatePath } from "next/cache";
import { SubmitBorrowRequestSchema } from "@/features/borrow/schemas";
import { adjustAssetQuantities, buildRequestedItemDisplayString } from "@/features/borrow";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getErrorMessage } from "@/lib/errors";

type ActionState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

function toDateTime(
  date: string,
  hour: string,
  minute: string,
  period: string
): Date {
  let h = parseInt(hour, 10);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, h, parseInt(minute, 10));
}

export async function submitBorrowRequestAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { status: "error", message: "You must sign in to submit a borrow request." };
    }

    const { data: userRow, error: userError } = await supabase
      .from("Users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (userError) throw userError;

    if (!userRow?.role || !["Organization", "Default"].includes(userRow.role)) {
      return {
        status: "error",
        message: "Your account is not authorized to submit borrow requests.",
      };
    }

    const parsed = SubmitBorrowRequestSchema.safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      courseYearSection: formData.get("courseYearSection"),
      contactNumber: formData.get("contactNumber"),
      organization: formData.get("organization"),
      purpose: formData.get("purpose"),
      additionalInfo: formData.get("additionalInfo") || "",
      items: formData.get("items"),
      startDate: formData.get("startDate"),
      startHour: formData.get("startHour"),
      startMinute: formData.get("startMinute"),
      startPeriod: formData.get("startPeriod"),
      endDate: formData.get("endDate"),
      endHour: formData.get("endHour"),
      endMinute: formData.get("endMinute"),
      endPeriod: formData.get("endPeriod"),
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues.map((i) => i.message).at(0) ?? "Invalid input",
      };
    }

    const letterFile = formData.get("letterFile");
    if (!(letterFile instanceof File) || letterFile.size === 0) {
      return { status: "error", message: "Request letter file is required." };
    }

    const start = toDateTime(
      parsed.data.startDate,
      parsed.data.startHour,
      parsed.data.startMinute,
      parsed.data.startPeriod
    );
    const end = toDateTime(
      parsed.data.endDate,
      parsed.data.endHour,
      parsed.data.endMinute,
      parsed.data.endPeriod
    );

    if (end <= start) {
      return { status: "error", message: "End date and time must be after the start." };
    }

    const ext = letterFile.name.split(".").pop()?.toLowerCase() ?? "pdf";
    const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const contentType =
      letterFile.type ||
      ({
        pdf: "application/pdf",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }[ext] ?? "application/octet-stream");

    const adminSupabase = createSupabaseAdminClient();

    const { error: uploadError } = await adminSupabase.storage
      .from("request-letters")
      .upload(filePath, letterFile, {
        contentType,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Never trust client-supplied names/categories — resolve real Assets rows by id.
    const assetIds = parsed.data.items.map((i) => i.assetId);
    const { data: assets, error: assetsError } = await adminSupabase
      .from("Assets")
      .select("id, name, category, quantity, is_deleted")
      .in("id", assetIds);

    if (assetsError) throw assetsError;

    const assetById = new Map((assets ?? []).map((a) => [a.id, a]));
    for (const item of parsed.data.items) {
      const asset = assetById.get(item.assetId);
      if (!asset || asset.is_deleted) {
        return { status: "error", message: "One or more selected items are no longer available." };
      }
      if (item.quantity > asset.quantity) {
        return {
          status: "error",
          message: `Not enough stock for ${asset.name}. Available: ${asset.quantity}, Requested: ${item.quantity}.`,
        };
      }
    }

    const requestedItemDisplay = buildRequestedItemDisplayString(
      parsed.data.items.map((i) => {
        const asset = assetById.get(i.assetId)!;
        return { name: asset.name, category: asset.category, quantity: i.quantity };
      })
    );

    await adjustAssetQuantities(adminSupabase, parsed.data.items, "deduct");

    const { data: insertedData, error: insertError } = await adminSupabase
      .from("BorrowRequests")
      .insert({
        user_id: user.id,
        borrower_contact_name: parsed.data.fullName,
        borrower_email: parsed.data.email,
        borrower_phone: parsed.data.contactNumber,
        course_year_section: parsed.data.courseYearSection,
        organization_name: parsed.data.organization,
        purpose: parsed.data.purpose,
        additional_info: parsed.data.additionalInfo || null,
        requested_item: requestedItemDisplay,
        requested_start_date: start.toISOString(),
        requested_end_date: end.toISOString(),
        letter_file_url: filePath,
        status: "Pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const { error: itemsError } = await adminSupabase.from("BorrowRequestItems").insert(
      parsed.data.items.map((i) => ({
        borrow_request_id: insertedData.id,
        asset_id: i.assetId,
        quantity: i.quantity,
      }))
    );

    if (itemsError) throw itemsError;

    // Send automated email notification upon initial submission
    if (insertedData && parsed.data.email && process.env.RESEND_API_KEY) {
      try {
        const { sendBorrowStatusEmail } = await import("@/features/borrow");
        await sendBorrowStatusEmail(insertedData, "Pending");
      } catch (emailErr) {
        console.error("Failed to send initial borrow status email:", emailErr);
      }
    }

    revalidatePath("/admin/borrow-requests");
    revalidatePath("/admin");

    return { status: "success" };
  } catch (err) {
    return {
      status: "error",
      message: getErrorMessage(err, "Failed to submit borrow request"),
    };
  }
}

export async function getMyBorrowRequestsAction() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { status: "error", message: "Not authenticated", data: [] };
    }

    const adminSupabase = createSupabaseAdminClient();
    const { data, error } = await adminSupabase
      .from("BorrowRequests")
      .select("id, requested_item, requested_start_date, requested_end_date, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { status: "success", data };
  } catch (err) {
    return {
      status: "error",
      message: getErrorMessage(err, "Failed to fetch borrow requests"),
      data: [],
    };
  }
}
