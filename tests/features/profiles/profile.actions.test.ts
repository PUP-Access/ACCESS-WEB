import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  updateUserProfileAction,
  changeUserPasswordAction,
} from "@/features/users/actions/users.actions";
import { revalidatePath } from "next/cache";

// Mock Supabase Server Client & Admin Client
const mockGetUser = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockUpdateAuthUser = vi.fn();

const mockUsersUpdate = vi.fn();
const mockUsersEq = vi.fn();

const mockStorageUpload = vi.fn();
const mockStorageGetPublicUrl = vi.fn();

vi.mock("@/lib/supabase/server-client", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
      signInWithPassword: mockSignInWithPassword,
      updateUser: mockUpdateAuthUser,
    },
    from: vi.fn(() => ({
      update: mockUsersUpdate.mockReturnValue({
        eq: mockUsersEq,
      }),
    })),
  })),
}));

vi.mock("@/lib/supabase/admin-client", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
      })),
    },
    from: vi.fn(() => ({
      update: mockUsersUpdate.mockReturnValue({
        eq: mockUsersEq,
      }),
    })),
  })),
}));

// Mock Resend
const mockSend = vi.fn();
vi.mock("resend", () => {
  return {
    Resend: class {
      emails = {
        send: mockSend,
      };
    },
  };
});

vi.mock("@/lib/email/email-template", () => ({
  renderAccessEmail: vi.fn().mockReturnValue("<security-email-html>"),
}));

describe("Profile Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "re_test_profile_key";
  });

  describe("updateUserProfileAction", () => {
    it("returns error if user is not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Unauthorized") });

      const result = await updateUserProfileAction({ organizationName: "New Org" });
      expect(result).toEqual({
        status: "error",
        message: "You must be logged in to update your profile.",
      });
    });

    it("returns error if organizationName is empty whitespace", async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: "user-123", user_metadata: { organization_name: "Old Org" } },
        },
        error: null,
      });

      const result = await updateUserProfileAction({ organizationName: "   " });
      expect(result).toEqual({
        status: "error",
        message: "Organization or Display Name cannot be empty.",
      });
    });

    it("successfully updates organization name in DB and Auth metadata", async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: "user-123",
            user_metadata: { organization_name: "Old Org" },
          },
        },
        error: null,
      });

      mockUsersEq.mockResolvedValue({ error: null });
      mockUpdateAuthUser.mockResolvedValue({ data: { user: {} }, error: null });

      const result = await updateUserProfileAction({
        organizationName: "Updated Society of Coders",
      });

      expect(result.status).toBe("success");
      expect(mockUsersUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_name: "Updated Society of Coders",
        })
      );
      expect(mockUpdateAuthUser).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organization_name: "Updated Society of Coders",
        }),
      });
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    });

    it("uploads base64 avatar to storage and updates metadata with public URL", async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: "user-123",
            user_metadata: { organization_name: "Org" },
          },
        },
        error: null,
      });

      mockStorageUpload.mockResolvedValue({ data: { path: "avatars/user-123.png" }, error: null });
      mockStorageGetPublicUrl.mockReturnValue({
        data: { publicUrl: "https://storage.pupaccess.org/avatars/user-123.png" },
      });
      mockUpdateAuthUser.mockResolvedValue({ data: { user: {} }, error: null });

      const base64Avatar = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      const result = await updateUserProfileAction({ avatarUrl: base64Avatar });

      expect(result.status).toBe("success");
      expect(mockStorageUpload).toHaveBeenCalledWith(
        expect.stringMatching(/^avatars\/user-123_\d+\.png$/),
        expect.any(Buffer),
        expect.objectContaining({ contentType: "image/png", upsert: true })
      );
      expect(mockUpdateAuthUser).toHaveBeenCalledWith({
        data: expect.objectContaining({
          avatar_url: "https://storage.pupaccess.org/avatars/user-123.png",
        }),
      });
    });

    it("returns error if database update fails", async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: "user-123", user_metadata: {} },
        },
        error: null,
      });

      mockUsersEq.mockResolvedValue({
        error: { message: "Database connection timed out" },
      });

      const result = await updateUserProfileAction({ organizationName: "Valid Name" });
      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.message).toContain("Failed to update profile database record");
      }
    });
  });

  describe("changeUserPasswordAction", () => {
    it("returns error if user is not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await changeUserPasswordAction({
        currentPassword: "OldPassword123",
        newPassword: "NewPassword123",
      });

      expect(result).toEqual({
        status: "error",
        message: "You must be logged in to change your password.",
      });
    });

    it("validates that currentPassword is provided", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-1", email: "user@pupaccess.org" } },
        error: null,
      });

      const result = await changeUserPasswordAction({
        currentPassword: "",
        newPassword: "NewPassword123",
      });

      expect(result).toEqual({
        status: "error",
        message: "Current password is required.",
      });
    });

    it("validates that newPassword is at least 6 characters", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-1", email: "user@pupaccess.org" } },
        error: null,
      });

      const result = await changeUserPasswordAction({
        currentPassword: "OldPassword123",
        newPassword: "12345",
      });

      expect(result).toEqual({
        status: "error",
        message: "New password must be at least 6 characters long.",
      });
    });

    it("returns error if current password verification fails", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-1", email: "user@pupaccess.org" } },
        error: null,
      });

      mockSignInWithPassword.mockResolvedValue({
        data: null,
        error: { message: "Invalid credentials" },
      });

      const result = await changeUserPasswordAction({
        currentPassword: "WrongOldPassword",
        newPassword: "NewPassword123",
      });

      expect(result).toEqual({
        status: "error",
        message: "Incorrect current password. Please try again.",
      });
      expect(mockUpdateAuthUser).not.toHaveBeenCalled();
    });

    it("successfully changes password and sends security email", async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: "user-1",
            email: "user@pupaccess.org",
            user_metadata: { organization_name: "Access Devs" },
          },
        },
        error: null,
      });

      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });

      mockUpdateAuthUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });

      mockSend.mockResolvedValue({ data: { id: "email-sent-1" }, error: null });

      const result = await changeUserPasswordAction({
        currentPassword: "CorrectOldPassword123",
        newPassword: "SecureNewPassword123",
      });

      expect(result.status).toBe("success");
      expect(mockUpdateAuthUser).toHaveBeenCalledWith({
        password: "SecureNewPassword123",
      });
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@pupaccess.org",
          subject: "Security Alert: Account Password Changed | ACCESS",
        })
      );
    });
  });
});
