import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/(marketing)/auth/callback/route";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

vi.mock("@/lib/supabase/server-client", () => ({
  createSupabaseServerClient: vi.fn(),
}));

describe("Auth Callback Route Handler (GET)", () => {
  const mockVerifyOtp = vi.fn();
  const mockExchangeCodeForSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        verifyOtp: mockVerifyOtp,
        exchangeCodeForSession: mockExchangeCodeForSession,
      },
    } as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>);
  });

  it("returns 404 if error or error_code is present in URL search params", async () => {
    const req1 = new Request("https://pupaccess.org/auth/callback?error=access_denied");
    const res1 = await GET(req1);
    expect(res1.status).toBe(404);

    const req2 = new Request("https://pupaccess.org/auth/callback?error_code=otp_expired");
    const res2 = await GET(req2);
    expect(res2.status).toBe(404);
  });

  it("successfully verifies token_hash with verifyOtp and redirects to next with ?verified=true", async () => {
    mockVerifyOtp.mockResolvedValue({ error: null });

    const req = new Request(
      "https://pupaccess.org/auth/callback?token_hash=valid-token-hash&type=recovery&next=/auth/reset-password"
    );
    const res = await GET(req);

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      token_hash: "valid-token-hash",
      type: "recovery",
    });
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://pupaccess.org/auth/reset-password?verified=true");
  });

  it("redirects to /auth/login?error=invalid_reset_link when verifyOtp fails", async () => {
    mockVerifyOtp.mockResolvedValue({ error: { message: "Token expired or invalid" } });

    const req = new Request(
      "https://pupaccess.org/auth/callback?token_hash=expired-token-hash&type=recovery"
    );
    const res = await GET(req);

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      token_hash: "expired-token-hash",
      type: "recovery",
    });
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://pupaccess.org/auth/login?error=invalid_reset_link");
  });

  it("successfully exchanges authorization code with exchangeCodeForSession and redirects", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { session: { access_token: "mock-jwt" } },
      error: null,
    });

    const req = new Request("https://pupaccess.org/auth/callback?code=valid-auth-code");
    const res = await GET(req);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("valid-auth-code");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://pupaccess.org/auth/reset-password?verified=true");
  });

  it("redirects to /auth/login?error=invalid_reset_link when exchangeCodeForSession fails", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid code" },
    });

    const req = new Request("https://pupaccess.org/auth/callback?code=invalid-auth-code");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://pupaccess.org/auth/login?error=invalid_reset_link");
  });

  it("redirects to login with invalid_reset_link when neither token_hash nor code is provided (e.g. hash fragment stripped by browser)", async () => {
    const req = new Request("https://pupaccess.org/auth/callback?next=/auth/reset-password");
    const res = await GET(req);

    expect(mockVerifyOtp).not.toHaveBeenCalled();
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://pupaccess.org/auth/login?error=invalid_reset_link");
  });

  it("respects custom next parameter on successful verification", async () => {
    mockVerifyOtp.mockResolvedValue({ error: null });

    const req = new Request(
      "https://pupaccess.org/auth/callback?token_hash=valid-token&type=signup&next=/dashboard"
    );
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://pupaccess.org/dashboard?verified=true");
  });
});
