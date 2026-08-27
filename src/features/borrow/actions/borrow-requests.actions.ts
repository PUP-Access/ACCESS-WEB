"use server";

import { revalidatePath } from "next/cache";
import { getActionErrorMessage } from "@/lib/errors";
import { BorrowRequestIdSchema } from "../schemas";
import {
  approveBorrowRequest,
  rejectBorrowRequest,
  releaseBorrowRequest,
  returnBorrowRequest,
  resolveBorrowRequestLetterUrl,
} from "../services/borrow-requests.admin.service";

type ActionState =
  | { status: "idle" }
  | { status: "success"; message?: string }
  | { status: "error"; message: string };

function revalidateBorrowRequestPaths(id: string) {
  revalidatePath("/admin/borrow-requests");
  revalidatePath(`/admin/borrow-requests/${id}`);
  revalidatePath("/admin");
}

export async function approveBorrowRequestAction(id: string): Promise<ActionState> {
  try {
    const validId = BorrowRequestIdSchema.parse(id);
    await approveBorrowRequest(validId);
    revalidateBorrowRequestPaths(validId);
    return { status: "success", message: "Request approved." };
  } catch (err) {
    return { status: "error", message: getActionErrorMessage(err, "Failed to approve request") };
  }
}

export async function rejectBorrowRequestAction(id: string, formData: FormData): Promise<ActionState> {
  try {
    const validId = BorrowRequestIdSchema.parse(id);
    const reason = String(formData.get("reason") ?? "");
    await rejectBorrowRequest(validId, reason);
    revalidateBorrowRequestPaths(validId);
    return { status: "success", message: "Request rejected." };
  } catch (err) {
    return { status: "error", message: getActionErrorMessage(err, "Failed to reject request") };
  }
}

export async function releaseBorrowRequestAction(id: string): Promise<ActionState> {
  try {
    const validId = BorrowRequestIdSchema.parse(id);
    await releaseBorrowRequest(validId);
    revalidateBorrowRequestPaths(validId);
    return { status: "success", message: "Items released to borrower." };
  } catch (err) {
    return { status: "error", message: getActionErrorMessage(err, "Failed to release request") };
  }
}

export async function returnBorrowRequestAction(id: string): Promise<ActionState> {
  try {
    const validId = BorrowRequestIdSchema.parse(id);
    await returnBorrowRequest(validId);
    revalidateBorrowRequestPaths(validId);
    return { status: "success", message: "Items marked as returned." };
  } catch (err) {
    return { status: "error", message: getActionErrorMessage(err, "Failed to mark request as returned") };
  }
}

export async function getBorrowRequestLetterUrlAction(
  id: string
): Promise<
  | { status: "success"; kind: "legacy-public-url" | "signed" | "none"; url?: string }
  | { status: "error"; message: string }
> {
  try {
    const validId = BorrowRequestIdSchema.parse(id);
    const resolved = await resolveBorrowRequestLetterUrl(validId);
    if (resolved.kind === "none") {
      return { status: "success", kind: "none" };
    }
    return { status: "success", kind: resolved.kind, url: resolved.url };
  } catch (err) {
    return { status: "error", message: getActionErrorMessage(err, "Failed to open letter") };
  }
}
