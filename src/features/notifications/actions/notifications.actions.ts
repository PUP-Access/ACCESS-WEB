"use server";

import { revalidatePath } from "next/cache";
import { getActionErrorMessage } from "@/lib/errors";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
} from "../services/notifications.service";

type ActionState =
  | { status: "idle" }
  | { status: "success"; message?: string }
  | { status: "error"; message: string };

export async function markNotificationAsReadAction(id: string): Promise<ActionState> {
  try {
    await markNotificationAsRead(id);
    revalidatePath("/admin");
    return { status: "success" };
  } catch (err) {
    return { status: "error", message: getActionErrorMessage(err, "Failed to mark notification as read") };
  }
}

export async function markAllNotificationsAsReadAction(): Promise<ActionState> {
  try {
    await markAllNotificationsAsRead();
    revalidatePath("/admin");
    return { status: "success" };
  } catch (err) {
    return { status: "error", message: getActionErrorMessage(err, "Failed to mark all notifications as read") };
  }
}

export async function clearAllNotificationsAction(): Promise<ActionState> {
  try {
    await clearAllNotifications();
    revalidatePath("/admin");
    return { status: "success" };
  } catch (err) {
    return { status: "error", message: getActionErrorMessage(err, "Failed to clear notifications") };
  }
}

