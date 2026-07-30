"use server";

import { revalidatePath } from "next/cache";
import { getActionErrorMessage } from "@/lib/errors";
import { checkRole } from "@/utils/checkRole";
import {
  createEquipmentSchema,
  updateEquipmentSchema,
  deleteEquipmentSchema,
} from "../schemas";
import {
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from "../services/equipments.admin.service";

type ActionState =
  | { status: "idle" }
  | { status: "success"; data?: unknown }
  | { status: "error"; message: string };

export async function createEquipmentAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await checkRole({ roles: "Admin" });

    const rawData = Object.fromEntries(formData);
    const parsedData = { ...rawData, quantity: rawData.quantity ? parseInt(rawData.quantity as string, 10) : undefined };

    const result = createEquipmentSchema.safeParse(parsedData);

    if (!result.success) {
      const errorMsg = result.error.issues
        .map((issue) => issue.message)
        .at(0) ?? "Invalid input";

      return {
        status: "error",
        message: errorMsg,
      };
    }

    const equipment = await createEquipment(result.data);

    revalidatePath("/admin/inventory", "page");
    revalidatePath("/", "page"); // revalidate landing page too

    return {
      status: "success",
      data: equipment,
    };
  } catch (err) {
    return {
      status: "error",
      message: getActionErrorMessage(err),
    };
  }
}

export async function updateEquipmentAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await checkRole({ roles: "Admin" });

    const rawData = Object.fromEntries(formData);
    const parsedData = { ...rawData, quantity: rawData.quantity ? parseInt(rawData.quantity as string, 10) : undefined };

    const result = updateEquipmentSchema.safeParse(parsedData);

    if (!result.success) {
      const errorMsg = result.error.issues
        .map((issue) => issue.message)
        .at(0) ?? "Invalid input";

      return {
        status: "error",
        message: errorMsg,
      };
    }

    const equipment = await updateEquipment(result.data);

    revalidatePath("/admin/inventory", "page");
    revalidatePath("/", "page");

    return {
      status: "success",
      data: equipment,
    };
  } catch (err) {
    return {
      status: "error",
      message: getActionErrorMessage(err),
    };
  }
}

export async function deleteEquipmentAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await checkRole({ roles: "Admin" });

    const rawData = Object.fromEntries(formData);
    const result = deleteEquipmentSchema.safeParse(rawData);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid input",
      };
    }

    await deleteEquipment(result.data);

    revalidatePath("/admin/inventory", "page");
    revalidatePath("/", "page");

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
