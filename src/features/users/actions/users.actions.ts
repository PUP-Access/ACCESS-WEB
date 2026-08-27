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

export async function updateUserProfileAction(input: {
  organizationName?: string;
  avatarUrl?: string | null;
}): Promise<UserActionState> {
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server-client");
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin-client");

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { status: "error", message: "You must be logged in to update your profile." };
    }

    const userMetadata: Record<string, unknown> = { ...user.user_metadata };
    let trimmedName: string | undefined = undefined;

    if (input.organizationName !== undefined) {
      trimmedName = input.organizationName.trim();
      if (!trimmedName) {
        return { status: "error", message: "Organization or Display Name cannot be empty." };
      }
      userMetadata.organization_name = trimmedName;
    }

    // Clean up any existing bloated base64 avatar in metadata to prevent cookie size overflow
    if (typeof userMetadata.avatar_url === "string" && userMetadata.avatar_url.startsWith("data:image/")) {
      userMetadata.avatar_url = null;
    }

    if (input.avatarUrl !== undefined) {
      if (input.avatarUrl && input.avatarUrl.startsWith("data:image/")) {
        try {
          const adminClient = createSupabaseAdminClient();
          const matches = input.avatarUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
          if (matches) {
            const mimeType = matches[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, "base64");
            const ext = mimeType.split("/")[1] || "png";
            const filePath = `avatars/${user.id}_${Date.now()}.${ext}`;

            const { error: uploadError } = await adminClient.storage
              .from("access_web_assets")
              .upload(filePath, buffer, {
                contentType: mimeType,
                upsert: true,
              });

            if (!uploadError) {
              const { data: publicUrlData } = adminClient.storage
                .from("access_web_assets")
                .getPublicUrl(filePath);

              userMetadata.avatar_url = publicUrlData.publicUrl;
            } else {
              console.error("Avatar storage upload error:", uploadError);
              userMetadata.avatar_url = null;
            }
          }
        } catch (err) {
          console.error("Avatar processing error:", err);
          userMetadata.avatar_url = null;
        }
      } else {
        userMetadata.avatar_url = input.avatarUrl;
      }
    }

    // Update public Users table
    if (trimmedName) {
      let dbError: { message: string } | null = null;
      try {
        const adminClient = createSupabaseAdminClient();
        const { error } = await adminClient
          .from("Users")
          .update({
            organization_name: trimmedName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
        dbError = error;
      } catch {
        // Fallback to server client
        const { error } = await supabase
          .from("Users")
          .update({
            organization_name: trimmedName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
        dbError = error;
      }

      if (dbError) {
        console.error("Update profile DB error:", dbError);
        return { status: "error", message: `Failed to update profile database record: ${dbError.message}` };
      }
    }

    // Update Supabase auth user metadata
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: userMetadata,
    });

    if (authUpdateError) {
      console.error("Auth metadata update error:", authUpdateError);
      return { status: "error", message: authUpdateError.message || "Failed to update profile metadata." };
    }

    revalidatePath("/", "layout");

    return {
      status: "success",
      message: "Profile updated successfully!",
    };
  } catch (err) {
    console.error("Update profile error:", err);
    return {
      status: "error",
      message: getErrorMessage(err, "Failed to update profile."),
    };
  }
}

export async function changeUserPasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<UserActionState> {
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server-client");
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return { status: "error", message: "You must be logged in to change your password." };
    }

    if (!input.currentPassword) {
      return { status: "error", message: "Current password is required." };
    }

    if (!input.newPassword || input.newPassword.length < 6) {
      return { status: "error", message: "New password must be at least 6 characters long." };
    }

    // 1. Verify Current Password
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: input.currentPassword,
    });

    if (verifyError) {
      return { status: "error", message: "Incorrect current password. Please try again." };
    }

    // 2. Update to New Password
    const { error: updateError } = await supabase.auth.updateUser({
      password: input.newPassword,
    });

    if (updateError) {
      console.error("Change password error:", updateError);
      return { status: "error", message: updateError.message || "Failed to update password." };
    }

    // 3. Send Security Notice Email via Resend if API key is present
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const { renderAccessEmail } = await import("@/lib/email/email-template");
        const resend = new Resend(process.env.RESEND_API_KEY);

        const recipientName =
          (user.user_metadata?.organization_name as string | undefined) ||
          user.email.split("@")[0];

        await resend.emails.send({
          from: "ACCESS <noreply@pupaccess.org>",
          to: user.email,
          subject: "Security Alert: Account Password Changed | ACCESS",
          html: renderAccessEmail({
            title: "Password Changed Successfully",
            preheader: "Security notice for your ACCESS account password update.",
            statusLabel: "Security Advisory",
            salutation: `Dear ${recipientName},`,
            leadParagraph: `The password for your PUP ACCESS account <strong>${user.email}</strong> was changed successfully.`,
            secondaryParagraph: `If you performed this password update, no further action is required and your account remains fully secure.`,
            notice: {
              title: "Security Notice",
              content:
                "If you did NOT perform this password change, your account credentials may be compromised. Please contact an administrator immediately or reply to this email.",
            },
            closingRemark: "Thank you for helping us maintain official PUP ACCESS system security.",
          }),
        });
      } catch (emailErr) {
        console.error("Failed to send password change security email:", emailErr);
      }
    }

    return {
      status: "success",
      message: "Password updated successfully! A security notice was sent to your email.",
    };
  } catch (err) {
    console.error("Change password exception:", err);
    return {
      status: "error",
      message: getErrorMessage(err, "Failed to change password."),
    };
  }
}

