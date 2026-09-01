import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRole } from "@/utils/checkRole";
import { getUsersForAdmin } from "@/features/users/services/users.admin.service";
import * as checkRoleModule from "@/utils/checkRole";

// Mock checkRole
vi.mock("@/utils/checkRole", () => ({
  checkRole: vi.fn(),
}));

// Mock Supabase Clients
const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockAdminSelect = vi.fn();

vi.mock("@/lib/supabase/server-client", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  })),
}));

vi.mock("@/lib/supabase/admin-client", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: mockAdminSelect,
    })),
  })),
}));

describe("Adversarial & Edge-Case Roles and Profiles Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Edge Case 1: Strict Role Equality vs. Role Hierarchy", () => {
    it("exposes that checkRole strictly checks membership and rejects an Admin if the route only lists a scoped role", async () => {
      // Re-bind original checkRole logic to test its exact behavior
      const actualCheckRole = (await vi.importActual<typeof import("@/utils/checkRole")>(
        "@/utils/checkRole"
      )).checkRole;

      mockGetUser.mockResolvedValue({
        data: { user: { id: "admin-user-id" } },
        error: null,
      });

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { role: "Admin" },
        error: null,
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: mockMaybeSingle,
        }),
      });

      // checkRole has no built-in notion that "Admin" outranks every other
      // role -- callers must explicitly include "Admin" in the allowed list
      // (which is exactly what rolesForArea() does for every real admin
      // service). Calling it directly with a list that omits "Admin" still
      // locks an Admin out, by design.
      await expect(actualCheckRole({ roles: ["Tech"] })).rejects.toThrow("Forbidden");
    });
  });

  describe("Edge Case 2: SQL Wildcard Characters in Search Query", () => {
    it("verifies how ILIKE wildcard characters (% and _) are formatted in query string", async () => {
      vi.mocked(checkRoleModule.checkRole).mockResolvedValue(undefined);

      const mockQueryBuilder = {
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        range: vi.fn().mockImplementation((_from: number, _to: number) => {
          return Promise.resolve({
            data: [],
            count: 0,
            error: null,
          });
        }),
      };

      mockAdminSelect.mockReturnValue(mockQueryBuilder);

      // Search term with SQL wildcards and single quotes
      const rawSearchTerm = "admin%_test' OR 1=1 --";
      await getUsersForAdmin({ search: rawSearchTerm });

      // Check how query was constructed
      expect(mockQueryBuilder.or).toHaveBeenCalledWith(
        `email.ilike.%${rawSearchTerm}%,organization_name.ilike.%${rawSearchTerm}%`
      );
    });
  });
});
