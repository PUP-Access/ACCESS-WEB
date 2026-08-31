import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getUserStats,
  getUsersForAdmin,
  updateUserRole,
  deleteUserAccount,
} from "@/features/users/services/users.admin.service";
import * as checkRoleModule from "@/utils/checkRole";
import * as auditModule from "@/features/audit";

// Mock checkRole
vi.mock("@/utils/checkRole", () => ({
  checkRole: vi.fn(),
}));

// Mock audit logging
vi.mock("@/features/audit", () => ({
  logAdminActivity: vi.fn(),
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
  renderAccessEmail: vi.fn().mockReturnValue("<html>Email content</html>"),
}));

// Mock Supabase Clients
const mockAdminSelect = vi.fn();
const mockAdminUpdate = vi.fn();
const mockAdminDelete = vi.fn();
const mockAdminDeleteAuthUser = vi.fn();

const mockServerGetUser = vi.fn();

vi.mock("@/lib/supabase/admin-client", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === "Users") {
        return {
          select: mockAdminSelect,
          update: mockAdminUpdate,
          delete: mockAdminDelete,
        };
      }
      if (table === "BorrowRequests") {
        return {
          delete: vi.fn(() => ({
            ilike: vi.fn().mockResolvedValue({ error: null }),
            eq: vi.fn().mockResolvedValue({ error: null }),
          })),
        };
      }
      return {};
    }),
    auth: {
      admin: {
        deleteUser: mockAdminDeleteAuthUser,
      },
    },
  })),
}));

vi.mock("@/lib/supabase/server-client", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: mockServerGetUser,
    },
  })),
}));

describe("Users Admin Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "re_mock_test_key";
    process.env.NEXT_PUBLIC_SITE_URL = "https://pupaccess.org";
    vi.mocked(checkRoleModule.checkRole).mockResolvedValue(undefined);
  });

  describe("getUserStats", () => {
    it("aggregates counts for all user roles", async () => {
      mockAdminSelect.mockResolvedValue({
        data: [
          { role: "Pending" },
          { role: "Pending" },
          { role: "Organization" },
          { role: "Organization" },
          { role: "Organization" },
          { role: "Default" },
          { role: "Admin" },
        ],
        error: null,
      });

      const stats = await getUserStats();

      expect(checkRoleModule.checkRole).toHaveBeenCalledWith({ roles: "Admin" });
      expect(stats).toEqual({
        total: 7,
        pending: 2,
        organization: 3,
        defaultUsers: 1,
        admin: 1,
      });
    });

    it("handles empty database records", async () => {
      mockAdminSelect.mockResolvedValue({ data: [], error: null });

      const stats = await getUserStats();
      expect(stats).toEqual({
        total: 0,
        pending: 0,
        organization: 0,
        defaultUsers: 0,
        admin: 0,
      });
    });
  });

  describe("getUsersForAdmin", () => {
    it("fetches paginated users with role and search filters", async () => {
      const mockQueryBuilder = {
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        range: vi.fn().mockImplementation((_from: number, _to: number) => {
          return Promise.resolve({
            data: [
              { id: "u-1", email: "comp@pupaccess.org", role: "Organization" },
              { id: "u-2", email: "ieee@pupaccess.org", role: "Organization" },
            ],
            count: 15,
            error: null,
          });
        }),
      };

      mockAdminSelect.mockReturnValue(mockQueryBuilder);

      const result = await getUsersForAdmin({
        page: 2,
        limit: 5,
        role: "Organization",
        search: "comp",
      });

      expect(mockAdminSelect).toHaveBeenCalledWith("*", { count: "exact" });
      expect(mockQueryBuilder.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("role", "Organization");
      expect(mockQueryBuilder.or).toHaveBeenCalledWith(
        "email.ilike.%comp%,organization_name.ilike.%comp%"
      );
      // Page 2, Limit 5 -> from: 5, to: 9
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(5, 9);

      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({
        total: 15,
        page: 2,
        limit: 5,
        totalPages: 3,
      });
    });
  });

  describe("updateUserRole", () => {
    it("rejects invalid role strings", async () => {
      await expect(
        updateUserRole("user-1", "SuperAdmin" as unknown as import("@/features/users/types").UserRole)
      ).rejects.toThrow("Invalid role provided");
    });

    it("updates user role, writes audit log, and sends approval email when status becomes Organization", async () => {
      const updatedRow = {
        id: "user-1",
        email: "org@pupaccess.org",
        organization_name: "Computer Society",
        role: "Organization",
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: updatedRow,
        error: null,
      });
      const mockSelectAfterUpdate = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelectAfterUpdate });
      mockAdminUpdate.mockReturnValue({ eq: mockEq });

      mockSend.mockResolvedValue({ data: { id: "resend-msg-1" }, error: null });

      const result = await updateUserRole("user-1", "Organization");

      expect(mockAdminUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          role: "Organization",
        })
      );
      expect(mockEq).toHaveBeenCalledWith("id", "user-1");
      expect(auditModule.logAdminActivity).toHaveBeenCalledWith(
        "USER_ROLE_UPDATED",
        "User",
        "user-1",
        {
          newRole: "Organization",
          email: "org@pupaccess.org",
          organization: "Computer Society",
        }
      );
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "org@pupaccess.org",
          subject: expect.stringContaining("Account Approved"),
        })
      );
      expect(result).toEqual(updatedRow);
    });
  });

  describe("deleteUserAccount", () => {
    it("prevents admin from deleting their own active administrator account", async () => {
      mockServerGetUser.mockResolvedValue({
        data: { user: { id: "admin-current-id" } },
      });

      await expect(deleteUserAccount("admin-current-id")).rejects.toThrow(
        "You cannot delete your own active administrator account."
      );
    });

    it("throws 404 if user to delete is not found", async () => {
      mockServerGetUser.mockResolvedValue({
        data: { user: { id: "admin-current-id" } },
      });

      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      mockAdminSelect.mockReturnValue({ eq: mockEq });

      await expect(deleteUserAccount("non-existent-user")).rejects.toThrow("User not found.");
    });

    it("deletes user, cleans up borrow requests, deletes auth account, and writes audit log", async () => {
      mockServerGetUser.mockResolvedValue({
        data: { user: { id: "admin-id" } },
      });

      const targetUser = {
        id: "target-user-id",
        email: "target@pupaccess.org",
        organization_name: "Org To Delete",
        role: "Default",
      };

      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: targetUser, error: null });
      const mockSelectEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      mockAdminSelect.mockReturnValue({ eq: mockSelectEq });

      const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
      mockAdminDelete.mockReturnValue({ eq: mockDeleteEq });
      mockAdminDeleteAuthUser.mockResolvedValue({ data: {}, error: null });

      const res = await deleteUserAccount("target-user-id");

      expect(res).toEqual({ success: true, user: targetUser });
      expect(mockDeleteEq).toHaveBeenCalledWith("id", "target-user-id");
      expect(mockAdminDeleteAuthUser).toHaveBeenCalledWith("target-user-id");
      expect(auditModule.logAdminActivity).toHaveBeenCalledWith(
        "USER_DELETED",
        "User",
        "target-user-id",
        {
          email: "target@pupaccess.org",
          organization: "Org To Delete",
          role: "Default",
        }
      );
    });
  });
});
