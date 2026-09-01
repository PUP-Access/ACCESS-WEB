import { describe, it, expect, vi, beforeEach } from "vitest";
import { proxy } from "@/proxy";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware-client";

vi.mock("@/lib/supabase/middleware-client", () => ({
  createSupabaseMiddlewareClient: vi.fn(),
}));

describe("Proxy / Middleware Route Protection", () => {
  let mockCookiesDelete = vi.fn();
  let mockGetUser: ReturnType<typeof vi.fn>;
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockEq: ReturnType<typeof vi.fn>;
  let mockMaybeSingle: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookiesDelete = vi.fn();
    mockGetUser = vi.fn();
    mockMaybeSingle = vi.fn();
    mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
    mockSelect = vi.fn(() => ({ eq: mockEq }));

    const mockSupabase = {
      auth: { getUser: mockGetUser },
      from: vi.fn(() => ({ select: mockSelect })),
    };

    const mockResponse = NextResponse.next();
    vi.spyOn(mockResponse.cookies, "delete").mockImplementation((...args: [key: string] | [options: { name: string }]) => {
      mockCookiesDelete(...args);
      return mockResponse.cookies;
    });

    vi.mocked(createSupabaseMiddlewareClient).mockReturnValue({
      supabase: mockSupabase as unknown as ReturnType<typeof createSupabaseMiddlewareClient>["supabase"],
      response: mockResponse,
    });
  });

  const createRequest = (pathname: string) => {
    return new NextRequest(new URL(`https://pupaccess.org${pathname}`));
  };

  it("redirects unauthenticated user accessing /borrow to /auth/login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = createRequest("/borrow/items");
    const res = await proxy(req);

    expect(res.status).toBe(307); // NextResponse.redirect
    expect(res.headers.get("location")).toBe("https://pupaccess.org/auth/login");
  });

  it("redirects unauthenticated user accessing /admin to /auth/login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = createRequest("/admin/users");
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://pupaccess.org/auth/login");
  });

  it("rewrites unauthenticated user accessing /auth/reset-password to /404", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = createRequest("/auth/reset-password");
    const res = await proxy(req);

    expect(res.headers.get("x-middleware-rewrite")).toContain("/404");
  });

  it("rewrites authenticated non-admin user accessing /admin to /404", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: "org-user-1", app_metadata: { role: "Organization" } },
      },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { role: "Organization" } });

    const req = createRequest("/admin/users");
    const res = await proxy(req);

    expect(res.headers.get("x-middleware-rewrite")).toContain("/404");
  });

  it("allows authenticated Admin user to access /admin routes", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: "admin-1", app_metadata: { role: "Admin" } },
      },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { role: "Admin" } });

    const req = createRequest("/admin/users");
    const res = await proxy(req);

    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("allows a Tech user into their allowed area (/admin/borrow-requests)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "tech-1", app_metadata: {} } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { role: "Tech" } });

    const req = createRequest("/admin/borrow-requests");
    const res = await proxy(req);

    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("rewrites a Tech user hitting an area outside their scope (/admin/users) to /404", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "tech-1", app_metadata: {} } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { role: "Tech" } });

    const req = createRequest("/admin/users");
    const res = await proxy(req);

    expect(res.headers.get("x-middleware-rewrite")).toContain("/404");
  });

  it("rewrites a SponsorsPartners user hitting Tech's area (/admin/inventory) to /404", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "sp-1", app_metadata: {} } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { role: "SponsorsPartners" } });

    const req = createRequest("/admin/inventory");
    const res = await proxy(req);

    expect(res.headers.get("x-middleware-rewrite")).toContain("/404");
  });

  it("allows a Govs user into their allowed area (/admin/events) but not sponsors-partners", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "govs-1", app_metadata: {} } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { role: "Govs" } });

    const allowedReq = createRequest("/admin/events");
    const allowedRes = await proxy(allowedReq);
    expect(allowedRes.headers.get("x-middleware-rewrite")).toBeNull();

    const deniedReq = createRequest("/admin/content/sponsors-partners");
    const deniedRes = await proxy(deniedReq);
    expect(deniedRes.headers.get("x-middleware-rewrite")).toContain("/404");
  });

  it("redirects a non-Admin scoped role landing on bare /admin to their default page instead of 404", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "tech-1", app_metadata: {} } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { role: "Tech" } });

    const req = createRequest("/admin");
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://pupaccess.org/admin/borrow-requests");
  });

  it("redirects authenticated user visiting /auth/login back to home /", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { role: "Organization" } });

    const req = createRequest("/auth/login");
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://pupaccess.org/");
  });

  it("redirects authenticated user visiting /auth/register back to home /", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { role: "Organization" } });

    const req = createRequest("/auth/register");
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://pupaccess.org/");
  });

  it("deletes auth cookie if getUser returns an error", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid session" },
    });

    const req = createRequest("/public");
    await proxy(req);

    expect(mockCookiesDelete).toHaveBeenCalledWith("sb-plzkphbuwfokfcopwlxv-auth-token");
  });
});
