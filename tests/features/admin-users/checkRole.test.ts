import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRole } from "@/utils/checkRole";

const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock("@/lib/supabase/server-client", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn(() => ({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          maybeSingle: mockMaybeSingle,
        }),
      }),
    })),
  })),
}));

describe("checkRole Utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws 401 Unauthorized if no active user session exists", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(checkRole({ roles: "Admin" })).rejects.toThrow("Unauthorized");
  });

  it("throws 403 Forbidden with missing profile message if user row is not found in public.Users", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-without-row" } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(checkRole({ roles: "Admin" })).rejects.toThrow(
      "Your account is missing a profile in public.Users"
    );
  });

  it("throws 403 Forbidden if user role does not match required role", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { role: "Organization" }, error: null });

    await expect(checkRole({ roles: "Admin" })).rejects.toThrow("Forbidden");
  });

  it("passes without error when user has the matching role", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-user" } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { role: "Admin" }, error: null });

    await expect(checkRole({ roles: "Admin" })).resolves.toBeUndefined();
  });

  it("passes when user role is included in an array of allowed roles", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "tech-user" } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { role: "Tech" }, error: null });

    await expect(
      checkRole({ roles: ["Admin", "Tech"] })
    ).resolves.toBeUndefined();
  });

  it("throws 403 Forbidden when user role is not included in an array of allowed roles", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "govs-user" } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { role: "Govs" }, error: null });

    await expect(
      checkRole({ roles: ["Admin", "Tech"] })
    ).rejects.toThrow("Forbidden");
  });
});
