"use server";

import { revalidatePath } from "next/cache";
import { SubmitBorrowRequestSchema } from "@/features/borrow/schemas";
import {
  adjustAssetQuantities,
  buildRequestedItemDisplayString,
  checkItemsAvailability,
  isWithinOperatingHours,
  isSunday,
  OPERATING_HOURS_LABEL,
  type ItemAvailabilityResult,
} from "@/features/borrow";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getErrorMessage } from "@/lib/errors";
import { manilaWallTimeToUtcDate } from "@/lib/date-utils";

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
  return manilaWallTimeToUtcDate(y, m, d, h, parseInt(minute, 10));
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

    if (!isWithinOperatingHours(start) || !isWithinOperatingHours(end)) {
      return {
        status: "error",
        message: `Pickup and return time must be between ${OPERATING_HOURS_LABEL} (Philippine Time).`,
      };
    }

    if (isSunday(start) || isSunday(end)) {
      return {
        status: "error",
        message: "Pickup and return cannot be scheduled on a Sunday.",
      };
    }

    const adminSupabase = createSupabaseAdminClient();

    // Check availability before touching Storage, so a rejected request never
    // leaves an orphaned letter file behind.
    const availability = await checkItemsAvailability(adminSupabase, parsed.data.items, start, end);
    if (!availability.ok) {
      const failed = availability.results.filter((r) => !r.available);
      return {
        status: "error",
        message: failed
          .map((f) => `${f.name}: only ${f.availableQuantity} available for the selected dates (requested ${f.requestedQuantity}).`)
          .join(" "),
      };
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

    const { error: uploadError } = await adminSupabase.storage
      .from("request-letters")
      .upload(filePath, letterFile, {
        contentType,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const resultByAssetId = new Map(availability.results.map((r) => [r.assetId, r]));
    const requestedItemDisplay = buildRequestedItemDisplayString(
      parsed.data.items.map((i) => {
        const result = resultByAssetId.get(i.assetId)!;
        return { name: result.name, category: result.category, quantity: i.quantity };
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

export type BorrowAvailabilityCheckResult =
  | { status: "ok"; results: ItemAvailabilityResult[] }
  | { status: "error"; message: string; results: ItemAvailabilityResult[] };

/**
 * Pre-flight availability check callable directly from the borrow form, so
 * unavailable items can be surfaced before the user attempts a full submit.
 * Not authoritative on its own — submitBorrowRequestAction re-checks fresh.
 */
export async function checkBorrowAvailabilityAction(
  items: { assetId: string; quantity: number }[],
  startDate: string,
  startHour: string,
  startMinute: string,
  startPeriod: string,
  endDate: string,
  endHour: string,
  endMinute: string,
  endPeriod: string
): Promise<BorrowAvailabilityCheckResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { status: "error", message: "You must sign in to check availability.", results: [] };
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
        results: [],
      };
    }

    if (!Array.isArray(items) || items.length === 0) {
      return { status: "error", message: "Please add at least one item to borrow.", results: [] };
    }
    for (const item of items) {
      if (typeof item.assetId !== "string" || !item.assetId || !Number.isInteger(item.quantity) || item.quantity < 1) {
        return { status: "error", message: "Invalid item selection.", results: [] };
      }
    }

    const start = toDateTime(startDate, startHour, startMinute, startPeriod);
    const end = toDateTime(endDate, endHour, endMinute, endPeriod);

    if (end <= start) {
      return { status: "error", message: "End date and time must be after the start.", results: [] };
    }

    if (!isWithinOperatingHours(start) || !isWithinOperatingHours(end)) {
      return {
        status: "error",
        message: `Pickup and return time must be between ${OPERATING_HOURS_LABEL} (Philippine Time).`,
        results: [],
      };
    }

    if (isSunday(start) || isSunday(end)) {
      return {
        status: "error",
        message: "Pickup and return cannot be scheduled on a Sunday.",
        results: [],
      };
    }

    const adminSupabase = createSupabaseAdminClient();
    const availability = await checkItemsAvailability(adminSupabase, items, start, end);

    if (!availability.ok) {
      const failed = availability.results.filter((r) => !r.available);
      return {
        status: "error",
        message: failed
          .map((f) => `${f.name}: only ${f.availableQuantity} available for the selected dates (requested ${f.requestedQuantity}).`)
          .join(" "),
        results: availability.results,
      };
    }

    return { status: "ok", results: availability.results };
  } catch (err) {
    return {
      status: "error",
      message: getErrorMessage(err, "Failed to check availability"),
      results: [],
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
