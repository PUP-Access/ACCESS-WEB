import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  updateUserRoleAction,
  deleteUserAccountAction,
} from "@/features/users/actions/users.actions";
import * as usersAdminService from "@/features/users/services/users.admin.service";
import { revalidatePath } from "next/cache";
import { AppError } from "@/lib/errors";

vi.mock("@/features/users/services/users.admin.service", () => ({
  updateUserRole: vi.fn(),
  deleteUserAccount: vi.fn(),
}));

describe("Users Admin Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateUserRoleAction", () => {
    it("returns error state if userId or newRole is missing", async () => {
      const res1 = await updateUserRoleAction("", "Admin");
      expect(res1).toEqual({
        status: "error",
        message: "User ID and Role are required.",
      });

      const res2 = await updateUserRoleAction("u-1", "" as unknown as import("@/features/users/types").UserRole);
      expect(res2).toEqual({
        status: "error",
        message: "User ID and Role are required.",
      });
      expect(usersAdminService.updateUserRole).not.toHaveBeenCalled();
    });

    it("successfully updates role and revalidates admin paths", async () => {
      vi.mocked(usersAdminService.updateUserRole).mockResolvedValue({} as unknown as import("@/features/users/types").UserRow);

      const result = await updateUserRoleAction("user-123", "Organization");

      expect(usersAdminService.updateUserRole).toHaveBeenCalledWith("user-123", "Organization");
      expect(revalidatePath).toHaveBeenCalledWith("/admin/users");
      expect(revalidatePath).toHaveBeenCalledWith("/admin");
      expect(result).toEqual({
        status: "success",
        message: "User role successfully updated to Organization.",
      });
    });

    it("handles service errors gracefully and formats message", async () => {
      vi.mocked(usersAdminService.updateUserRole).mockRejectedValue(
        new AppError("Forbidden: Insufficient privileges", 403)
      );

      const result = await updateUserRoleAction("user-123", "Admin");

      expect(result).toEqual({
        status: "error",
        message: "Forbidden: Insufficient privileges",
      });
    });
  });

  describe("deleteUserAccountAction", () => {
    it("returns error state if userId is empty", async () => {
      const result = await deleteUserAccountAction("");
      expect(result).toEqual({
        status: "error",
        message: "User ID is required.",
      });
      expect(usersAdminService.deleteUserAccount).not.toHaveBeenCalled();
    });

    it("successfully deletes account and revalidates admin paths", async () => {
      vi.mocked(usersAdminService.deleteUserAccount).mockResolvedValue({
        success: true,
        user: {} as unknown as import("@/features/users/types").UserRow,
      });

      const result = await deleteUserAccountAction("target-user-123");

      expect(usersAdminService.deleteUserAccount).toHaveBeenCalledWith("target-user-123");
      expect(revalidatePath).toHaveBeenCalledWith("/admin/users");
      expect(revalidatePath).toHaveBeenCalledWith("/admin");
      expect(result).toEqual({
        status: "success",
        message: "User account and associated data were permanently deleted.",
      });
    });

    it("handles self-deletion error from service", async () => {
      vi.mocked(usersAdminService.deleteUserAccount).mockRejectedValue(
        new AppError("You cannot delete your own active administrator account.", 400)
      );

      const result = await deleteUserAccountAction("current-admin-id");

      expect(result).toEqual({
        status: "error",
        message: "You cannot delete your own active administrator account.",
      });
    });
  });
});
