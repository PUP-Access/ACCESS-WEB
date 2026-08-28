import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  registerOrganization,
  logInService,
  logOutService,
  forgotPasswordService,
  resetPasswordService,
} from "@/features/auth/services/auth.services";

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

// Mock email-template
const mockRenderAccessEmail = vi.fn().mockReturnValue("<html-email-content>");
vi.mock("@/lib/email/email-template", () => ({
  renderAccessEmail: (...args: unknown[]) => mockRenderAccessEmail(...args),
}));

// Mock Supabase clients
const mockGenerateLink = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock("@/lib/supabase/admin-client", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    auth: {
      admin: {
        generateLink: mockGenerateLink,
      },
    },
  })),
}));

vi.mock("@/lib/supabase/server-client", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
      updateUser: mockUpdateUser,
    },
  })),
}));

describe("Auth Services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "re_test_key_123";
    process.env.NEXT_PUBLIC_SITE_URL = "https://pupaccess.org";
  });

  describe("registerOrganization", () => {
    it("successfully generates link and sends confirmation email", async () => {
      mockGenerateLink.mockResolvedValue({
        data: {
          properties: {
            action_link: "https://pupaccess.org/auth/confirm?token=xyz",
          },
        },
        error: null,
      });

      mockSend.mockResolvedValue({
        data: { id: "email-123" },
        error: null,
      });

      const result = await registerOrganization({
        email: "org@example.com",
        password: "Password123",
        organization_name: "Test Organization",
      });

      expect(mockGenerateLink).toHaveBeenCalledWith({
        type: "signup",
        email: "org@example.com",
        password: "Password123",
        options: {
          data: {
            organization_name: "Test Organization",
          },
          redirectTo: "https://pupaccess.org/auth/login",
        },
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "org@example.com",
          subject: "Confirm Your Organization Account | ACCESS",
        })
      );

      expect(result).toBeDefined();
    });

    it("throws AppError when Supabase generateLink fails", async () => {
      mockGenerateLink.mockResolvedValue({
        data: null,
        error: { message: "User already registered", status: 422 },
      });

      await expect(
        registerOrganization({
          email: "org@example.com",
          password: "Password123",
          organization_name: "Test Organization",
        })
      ).rejects.toThrow("User already registered");
    });

    it("throws AppError when action_link is missing", async () => {
      mockGenerateLink.mockResolvedValue({
        data: { properties: {} },
        error: null,
      });

      await expect(
        registerOrganization({
          email: "org@example.com",
          password: "Password123",
          organization_name: "Test Organization",
        })
      ).rejects.toThrow("Failed to generate confirmation link.");
    });

    it("throws 503 error when RESEND_API_KEY is not configured", async () => {
      delete process.env.RESEND_API_KEY;
      mockGenerateLink.mockResolvedValue({
        data: { properties: { action_link: "https://pupaccess.org/confirm" } },
        error: null,
      });

      await expect(
        registerOrganization({
          email: "org@example.com",
          password: "Password123",
          organization_name: "Test Organization",
        })
      ).rejects.toThrow("Email service is temporarily unavailable");
    });

    it("throws AppError when Resend email sending fails", async () => {
      mockGenerateLink.mockResolvedValue({
        data: { properties: { action_link: "https://pupaccess.org/confirm" } },
        error: null,
      });

      mockSend.mockResolvedValue({
        data: null,
        error: { message: "Rate limit exceeded" },
      });

      await expect(
        registerOrganization({
          email: "org@example.com",
          password: "Password123",
          organization_name: "Test Organization",
        })
      ).rejects.toThrow("Rate limit exceeded");
    });
  });

  describe("logInService", () => {
    it("successfully signs in user with credentials", async () => {
      const mockSessionData = {
        user: { id: "user-1", email: "user@example.com" },
        session: { access_token: "jwt-token" },
      };

      mockSignInWithPassword.mockResolvedValue({
        data: mockSessionData,
        error: null,
      });

      const result = await logInService({
        email: "user@example.com",
        password: "Password123",
      });

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "Password123",
      });
      expect(result).toEqual(mockSessionData);
    });

    it("throws AppError on invalid credentials", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials", status: 400 },
      });

      await expect(
        logInService({
          email: "wrong@example.com",
          password: "wrongpassword",
        })
      ).rejects.toThrow("Invalid login credentials");
    });
  });

  describe("logOutService", () => {
    it("successfully logs out user", async () => {
      mockSignOut.mockResolvedValue({ error: null });
      await expect(logOutService()).resolves.toBeUndefined();
      expect(mockSignOut).toHaveBeenCalled();
    });

    it("throws AppError when signOut fails", async () => {
      mockSignOut.mockResolvedValue({
        error: { message: "Failed to sign out" },
      });
      await expect(logOutService()).rejects.toThrow("Failed to sign out");
    });
  });

  describe("forgotPasswordService", () => {
    it("generates direct callback link with hashed_token and sends password reset email", async () => {
      mockGenerateLink.mockResolvedValue({
        data: {
          properties: {
            hashed_token: "mock-hashed-recovery-token",
            action_link: "https://plzkphbuwfokfcopwlxv.supabase.co/auth/v1/verify?token=mock-hashed-recovery-token&type=recovery",
          },
        },
        error: null,
      });

      mockSend.mockResolvedValue({
        data: { id: "email-recovery-1" },
        error: null,
      });

      const result = await forgotPasswordService("user@example.com");

      expect(mockGenerateLink).toHaveBeenCalledWith({
        type: "recovery",
        email: "user@example.com",
        options: {
          redirectTo: "https://pupaccess.org/auth/callback?next=/auth/reset-password",
        },
      });

      expect(mockRenderAccessEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          cta: expect.objectContaining({
            url: "https://pupaccess.org/auth/callback?token_hash=mock-hashed-recovery-token&type=recovery&next=/auth/reset-password",
          }),
        })
      );

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          subject: "Password Reset Request | ACCESS",
        })
      );

      expect(result).toEqual({ success: true });
    });

    it("falls back to action_link when hashed_token is not present", async () => {
      mockGenerateLink.mockResolvedValue({
        data: {
          properties: {
            action_link: "https://plzkphbuwfokfcopwlxv.supabase.co/auth/v1/verify?token=abc",
          },
        },
        error: null,
      });

      mockSend.mockResolvedValue({
        data: { id: "email-recovery-2" },
        error: null,
      });

      const result = await forgotPasswordService("user@example.com");

      expect(mockRenderAccessEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          cta: expect.objectContaining({
            url: "https://plzkphbuwfokfcopwlxv.supabase.co/auth/v1/verify?token=abc",
          }),
        })
      );

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
        })
      );

      expect(result).toEqual({ success: true });
    });

    it("throws AppError if Supabase fails to generate recovery link", async () => {
      mockGenerateLink.mockResolvedValue({
        data: null,
        error: { message: "User not found", status: 404 },
      });

      await expect(forgotPasswordService("nonexistent@example.com")).rejects.toThrow(
        "User not found"
      );
    });

    it("throws AppError if recovery action link is missing", async () => {
      mockGenerateLink.mockResolvedValue({
        data: { properties: {} },
        error: null,
      });

      await expect(forgotPasswordService("user@example.com")).rejects.toThrow(
        "Failed to generate recovery link."
      );
    });

    it("throws 503 if RESEND_API_KEY is missing", async () => {
      delete process.env.RESEND_API_KEY;
      mockGenerateLink.mockResolvedValue({
        data: { properties: { action_link: "https://pupaccess.org/recovery" } },
        error: null,
      });

      await expect(forgotPasswordService("user@example.com")).rejects.toThrow(
        "Email service is temporarily unavailable"
      );
    });
  });

  describe("resetPasswordService", () => {
    it("updates password and logs out recovery session", async () => {
      mockUpdateUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });
      mockSignOut.mockResolvedValue({ error: null });

      const result = await resetPasswordService("NewPassword123!");

      expect(mockUpdateUser).toHaveBeenCalledWith({ password: "NewPassword123!" });
      expect(mockSignOut).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it("throws AppError if password update fails", async () => {
      mockUpdateUser.mockResolvedValue({
        data: { user: null },
        error: { message: "New password should be different from old password", status: 422 },
      });

      await expect(resetPasswordService("SamePassword123!")).rejects.toThrow(
        "New password should be different from old password"
      );
    });
  });
});
