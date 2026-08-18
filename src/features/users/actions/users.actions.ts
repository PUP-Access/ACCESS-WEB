"use server";

import { revalidatePath } from "next/cache";
import { updateUserRole, deleteUserAccount } from "../services/users.admin.service";
import { getErrorMessage } from "@/lib/errors";
import type { UserRole, UserActionState } from "../types";

export async function updateUserRoleAction(
  userId: string,
  newRole: UserRole
): Promise<UserActionState> {
  try {
    if (!userId || !newRole) {
      return { status: "error", message: "User ID and Role are required." };
    }

    await updateUserRole(userId, newRole);

    revalidatePath("/admin/users");
    revalidatePath("/admin");

    return {
      status: "success",
      message: `User role successfully updated to ${newRole}.`,
    };
  } catch (err) {
    console.error("Update user role error:", err);
    return {
      status: "error",
      message: getErrorMessage(err, "Failed to update user role."),
    };
  }
}

export async function deleteUserAccountAction(userId: string): Promise<UserActionState> {
  try {
    if (!userId) {
      return { status: "error", message: "User ID is required." };
    }

    await deleteUserAccount(userId);

    revalidatePath("/admin/users");
    revalidatePath("/admin");

    return {
      status: "success",
      message: "User account and associated data were permanently deleted.",
    };
  } catch (err) {
    console.error("Delete user account error:", err);
    return {
      status: "error",
      message: getErrorMessage(err, "Failed to delete user account."),
    };
  }
}
