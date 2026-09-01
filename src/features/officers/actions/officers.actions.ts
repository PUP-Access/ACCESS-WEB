"use server";

import { revalidatePath } from "next/cache";
import { getActionErrorMessage } from "@/lib/errors";
import { checkRole } from "@/utils/checkRole";
import { rolesForArea } from "@/utils/adminAccess";
import {
  CreateOfficerSchema,
  UpdateOfficerSchema,
  ReorderOfficersSchema,
} from "../schemas";
import {
  createOfficer,
  deactivateOfficer,
  updateOfficer,
  reorderOfficers,
} from "../services/officers.admin.service";

type ActionState =
  | { status: "idle" }
  | { status: "success"; data?: unknown }
  | { status: "error"; message: string };

export async function createOfficerAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await checkRole({ roles: rolesForArea("officers") });

    const rawData = Object.fromEntries(formData);
    const result = CreateOfficerSchema.safeParse(rawData);

    if (!result.success) {
      const errorMsg = result.error.issues
        .map((issue) => issue.message)
        .at(0) ?? "Invalid input";

      return {
        status: "error",
        message: errorMsg,
      };
    }

    const officer = await createOfficer(result.data);

    revalidatePath("/admin/officers", "layout");

    return {
      status: "success",
      data: officer,
    };
  } catch (err) {
    // Catch any errors from the service layer
    return {
      status: "error",
      message: getActionErrorMessage(err),
    };
  }
}

export async function updateOfficerAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await checkRole({ roles: rolesForArea("officers") });

    const officerId = formData.get("id");
    if (!officerId || typeof officerId !== "string") {
      return {
        status: "error",
        message: "Officer ID is required",
      };
    }

    const rawData = Object.fromEntries(
      Array.from(formData.entries()).filter(([key]) => key !== "id")
    );

    const result = UpdateOfficerSchema.safeParse(rawData);

    if (!result.success) {
      const errorMsg = result.error.issues
        .map((issue) => issue.message)
        .at(0) ?? "Invalid input";

      return {
        status: "error",
        message: errorMsg,
      };
    }

    const officer = await updateOfficer(officerId, result.data);

    revalidatePath("/admin/officers", "layout");

    return {
      status: "success",
      data: officer,
    };
  } catch (err) {
    return {
      status: "error",
      message: getActionErrorMessage(err),
    };
  }
}

export async function deactivateOfficerAction(
  prevState: ActionState,
  officerId: string
): Promise<ActionState> {
  try {
    await checkRole({ roles: rolesForArea("officers") });

    if (!officerId || typeof officerId !== "string") {
      return {
        status: "error",
        message: "Officer ID is required",
      };
    }

    await deactivateOfficer(officerId);

    revalidatePath("/admin/officers", "layout");

    return {
      status: "success",
    };
  } catch (err) {
    return {
      status: "error",
      message: getActionErrorMessage(err),
    };
  }
}

export async function reorderOfficersAction(
  prevState: ActionState,
  input: unknown
): Promise<ActionState> {
  try {
    await checkRole({ roles: rolesForArea("officers") });

    const result = ReorderOfficersSchema.safeParse(input);

    if (!result.success) {
      const errorMsg = result.error.issues
        .map((issue) => issue.message)
        .at(0) ?? "Invalid input";

      return {
        status: "error",
        message: errorMsg,
      };
    }

    await reorderOfficers(result.data);

    revalidatePath("/admin/officers", "layout");

    return {
      status: "success",
    };
  } catch (err) {
    return {
      status: "error",
      message: getActionErrorMessage(err),
    };
  }
}