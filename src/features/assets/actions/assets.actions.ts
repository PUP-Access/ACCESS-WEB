"use server";

import { revalidatePath } from "next/cache";
import { getActionErrorMessage } from "@/lib/errors";
import { checkRole } from "@/utils/checkRole";
import {
  createAssetSchema,
  updateAssetSchema,
  deleteAssetSchema,
} from "../schemas";
import {
  createAsset,
  updateAsset,
  deleteAsset,
  decrementAssetQuantity,
} from "../services/assets.admin.service";

type ActionState =
  | { status: "idle" }
  | { status: "success"; data?: unknown; message?: string }
  | { status: "error"; message: string };

export async function createAssetAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await checkRole({ roles: "Admin" });

    const rawData = Object.fromEntries(formData);
    const parsedData = { ...rawData, quantity: rawData.quantity ? parseInt(rawData.quantity as string, 10) : undefined };

    const result = createAssetSchema.safeParse(parsedData);

    if (!result.success) {
      const errorMsg = result.error.issues
        .map((issue) => issue.message)
        .at(0) ?? "Invalid input";

      return {
        status: "error",
        message: errorMsg,
      };
    }

    const { asset, merged } = await createAsset(result.data);

    revalidatePath("/admin/inventory", "page");
    revalidatePath("/", "page"); // revalidate landing page too

    return {
      status: "success",
      data: asset,
      message: merged
        ? `Added ${result.data.quantity} to existing stock of ${asset.name}`
        : "Asset added",
    };
  } catch (err) {
    return {
      status: "error",
      message: getActionErrorMessage(err),
    };
  }
}

export async function updateAssetAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await checkRole({ roles: "Admin" });

    const rawData = Object.fromEntries(formData);
    const parsedData = { ...rawData, quantity: rawData.quantity ? parseInt(rawData.quantity as string, 10) : undefined };

    const result = updateAssetSchema.safeParse(parsedData);

    if (!result.success) {
      const errorMsg = result.error.issues
        .map((issue) => issue.message)
        .at(0) ?? "Invalid input";

      return {
        status: "error",
        message: errorMsg,
      };
    }

    const asset = await updateAsset(result.data);

    revalidatePath("/admin/inventory", "page");
    revalidatePath("/", "page");

    return {
      status: "success",
      data: asset,
    };
  } catch (err) {
    return {
      status: "error",
      message: getActionErrorMessage(err),
    };
  }
}

export async function deleteAssetAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await checkRole({ roles: "Admin" });

    const rawData = Object.fromEntries(formData);
    const result = deleteAssetSchema.safeParse(rawData);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid input",
      };
    }

    await deleteAsset(result.data);

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

export async function decrementAssetAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await checkRole({ roles: "Admin" });

    const rawData = Object.fromEntries(formData);
    const result = deleteAssetSchema.safeParse(rawData);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid input",
      };
    }

    const asset = await decrementAssetQuantity(result.data);

    revalidatePath("/admin/inventory", "page");
    revalidatePath("/", "page");

    return {
      status: "success",
      data: asset,
    };
  } catch (err) {
    return {
      status: "error",
      message: getActionErrorMessage(err),
    };
  }
}
