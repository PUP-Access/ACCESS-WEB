import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogInForm } from "@/features/auth/components/LogInForm";
import { RegistrationForm } from "@/features/auth/components/RegistrationForm";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

// Mock auth actions
vi.mock("@/features/auth/actions/auth.actions", () => ({
  signInAction: vi.fn(),
  signUpAction: vi.fn(),
  forgotPasswordAction: vi.fn(),
  resetPasswordAction: vi.fn(),
  signOut: vi.fn(),
}));

// Mock browser supabase client
vi.mock("@/lib/supabase/browser-client", () => ({
  getSupabaseBrowserClient: vi.fn(),
}));

describe("Auth Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("LogInForm", () => {
    it("renders email, password inputs, submit button, and navigation links", () => {
      render(<LogInForm />);

      expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^Log in$/i })).toBeInTheDocument();
      expect(screen.getByText(/Remember me/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Forgot Password/i })).toHaveAttribute(
        "href",
        "/auth/forgot-password"
      );
      expect(screen.getByRole("link", { name: /Sign up/i })).toHaveAttribute(
        "href",
        "/auth/register"
      );
    });

    it("toggles password visibility when the eye button is clicked", async () => {
      const user = userEvent.setup();
      render(<LogInForm />);

      const passwordInput = screen.getByPlaceholderText(/Password/i);
      expect(passwordInput).toHaveAttribute("type", "password");

      const toggleButton = screen.getByRole("button", { name: /Show password/i });
      await user.click(toggleButton);

      expect(passwordInput).toHaveAttribute("type", "text");
      expect(screen.getByRole("button", { name: /Hide password/i })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /Hide password/i }));
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  describe("RegistrationForm", () => {
    it("renders organization name, email, password fields and sign up button", () => {
      render(<RegistrationForm />);

      expect(screen.getByPlaceholderText(/Organization Name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^Sign up$/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /^Log in$/i })).toHaveAttribute(
        "href",
        "/auth/login"
      );
    });

    it("toggles password visibility in registration form", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const passwordInput = screen.getByPlaceholderText(/Password/i);
      expect(passwordInput).toHaveAttribute("type", "password");

      const toggleButton = screen.getByRole("button", { name: /Show password/i });
      await user.click(toggleButton);

      expect(passwordInput).toHaveAttribute("type", "text");
    });
  });

  describe("ForgotPasswordForm", () => {
    it("renders email input and send reset link button", () => {
      render(<ForgotPasswordForm />);

      expect(screen.getByPlaceholderText(/Enter your registered email/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Send reset link/i })).toBeInTheDocument();
    });
  });

  describe("ResetPasswordForm", () => {
    it("renders new password and confirm password inputs", () => {
      render(<ResetPasswordForm />);

      expect(screen.getByPlaceholderText(/^New Password$/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/^Confirm New Password$/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Reset Password/i })).toBeInTheDocument();
    });
  });

  describe("LogoutButton", () => {
    it("renders null if user is not logged in", () => {
      vi.mocked(getSupabaseBrowserClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      } as unknown as ReturnType<typeof getSupabaseBrowserClient>);

      const { container } = render(<LogoutButton />);
      expect(container.firstChild).toBeNull();
    });

    it("renders logout button when user is logged in", async () => {
      vi.mocked(getSupabaseBrowserClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-123", email: "user@pupaccess.org" } },
          }),
        },
      } as unknown as ReturnType<typeof getSupabaseBrowserClient>);

      render(<LogoutButton />);

      const logoutBtn = await screen.findByRole("button", { name: /Logout/i });
      expect(logoutBtn).toBeInTheDocument();
    });
  });
});
