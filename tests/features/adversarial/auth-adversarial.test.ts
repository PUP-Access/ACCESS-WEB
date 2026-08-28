import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerOrganization } from "@/features/auth/services/auth.services";
import { proxy } from "@/proxy";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware-client";
import { SignUpSchema } from "@/features/auth/schemas";

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
  renderAccessEmail: vi.fn().mockReturnValue("<test-email>"),
}));

const mockGenerateLink = vi.fn();
const mockDeleteUser = vi.fn();

vi.mock("@/lib/supabase/admin-client", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    auth: {
      admin: {
        generateLink: mockGenerateLink,
        deleteUser: mockDeleteUser,
      },
    },
  })),
}));

vi.mock("@/lib/supabase/middleware-client", () => ({
  createSupabaseMiddlewareClient: vi.fn(),
}));

describe("Adversarial & Edge-Case Auth Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.NEXT_PUBLIC_SITE_URL = "https://pupaccess.org";
  });

  describe("Edge Case 1: Partial Registration Failure (Zombie User Vulnerability)", () => {
    it("exposes that user created in Supabase Auth remains orphaned if email dispatch fails", async () => {
      // Step 1: Supabase admin successfully creates user & generates link
      mockGenerateLink.mockResolvedValue({
        data: {
          user: { id: "orphaned-user-1", email: "neworg@pupaccess.org" },
          properties: { action_link: "https://pupaccess.org/confirm" },
        },
        error: null,
      });

      // Step 2: Resend email dispatch fails (e.g. rate limit / network error)
      mockSend.mockResolvedValue({
        data: null,
        error: { message: "Resend API 429 Too Many Requests" },
      });

      // Assert that registerOrganization throws
      await expect(
        registerOrganization({
          email: "neworg@pupaccess.org",
          password: "SecurePassword123",
          organization_name: "Orphaned Organization",
        })
      ).rejects.toThrow("Resend API 429 Too Many Requests");

      // Check whether deleteUser cleanup was attempted
      // If there is no rollback logic in auth.services.ts, deleteUser will NOT be called
      const cleanupAttempted = mockDeleteUser.mock.calls.length > 0;
      expect(cleanupAttempted).toBe(false); 
      // NOTE: This test proves that the system currently leaves an unconfirmed user in Auth if Resend fails.
    });
  });

  describe("Edge Case 2: Route Prefix Collisions in Proxy", () => {
    let mockGetUser: ReturnType<typeof vi.fn>;
    let mockMaybeSingle: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockGetUser = vi.fn();
      mockMaybeSingle = vi.fn();
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: mockMaybeSingle })),
      }));

      const mockSupabase = {
        auth: { getUser: mockGetUser },
        from: vi.fn(() => ({ select: mockSelect })),
      };

      const mockResponse = NextResponse.next();
      vi.mocked(createSupabaseMiddlewareClient).mockReturnValue({
        supabase: mockSupabase as unknown as ReturnType<typeof createSupabaseMiddlewareClient>["supabase"],
        response: mockResponse,
      });
    });

    it("evaluates prefix collisions like /borrow-public or /admin-guide for unauthenticated users", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      // If a route starts with "/borrow-info", pathname.startsWith("/borrow") is true!
      const req = new NextRequest(new URL("https://pupaccess.org/borrow-info"));
      const res = await proxy(req);

      // The proxy redirects to /auth/login because "/borrow-info".startsWith("/borrow") is true
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("https://pupaccess.org/auth/login");
    });
  });

  describe("Edge Case 3: Malicious Input & Payload Fuzzing", () => {
    it("rejects extreme payload sizes and control characters in signup", () => {
      // 1. Huge org name (10,000 chars)
      const oversizedOrg = SignUpSchema.safeParse({
        email: "test@example.com",
        password: "ValidPassword1",
        organization_name: "A".repeat(10000),
      });
      expect(oversizedOrg.success).toBe(false);

      // 2. Control characters / XSS script tags in organization name
      const xssOrg = SignUpSchema.safeParse({
        email: "test@example.com",
        password: "ValidPassword1",
        organization_name: "<script>alert('xss')</script>",
      });
      expect(xssOrg.success).toBe(false);

      // 3. Null bytes in email
      const nullByteEmail = SignUpSchema.safeParse({
        email: "test\0@example.com",
        password: "ValidPassword1",
        organization_name: "Valid Org",
      });
      expect(nullByteEmail.success).toBe(false);
    });
  });
});
