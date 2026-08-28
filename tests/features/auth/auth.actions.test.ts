import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  signUpAction,
  signInAction,
  signOut,
  forgotPasswordAction,
  resetPasswordAction,
} from "@/features/auth/actions/auth.actions";
import * as authServices from "@/features/auth/services/auth.services";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppError } from "@/lib/errors";

vi.mock("@/features/auth/services/auth.services", () => ({
  registerOrganization: vi.fn(),
  logInService: vi.fn(),
  logOutService: vi.fn(),
  forgotPasswordService: vi.fn(),
  resetPasswordService: vi.fn(),
}));

describe("Auth Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signUpAction", () => {
    it("returns error on invalid formData fields", async () => {
      const formData = new FormData();
      formData.append("email", "not-an-email");
      formData.append("password", "short");
      formData.append("organization_name", "A");

      const result = await signUpAction({ status: "idle" }, formData);
      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.message).toBeDefined();
      }
      expect(authServices.registerOrganization).not.toHaveBeenCalled();
    });

    it("successfully calls registerOrganization and revalidates layout cache", async () => {
      vi.mocked(authServices.registerOrganization).mockResolvedValue({} as unknown as Awaited<ReturnType<typeof authServices.registerOrganization>>);

      const formData = new FormData();
      formData.append("email", "org@example.com");
      formData.append("password", "ValidPass1");
      formData.append("organization_name", "Valid Org Name");

      const result = await signUpAction({ status: "idle" }, formData);

      expect(authServices.registerOrganization).toHaveBeenCalledWith({
        email: "org@example.com",
        password: "ValidPass1",
        organization_name: "Valid Org Name",
      });
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
      expect(result).toEqual({ status: "success" });
    });

    it("catches service errors and formats error message", async () => {
      vi.mocked(authServices.registerOrganization).mockRejectedValue(
        new AppError("Email already registered", 400)
      );

      const formData = new FormData();
      formData.append("email", "org@example.com");
      formData.append("password", "ValidPass1");
      formData.append("organization_name", "Valid Org Name");

      const result = await signUpAction({ status: "idle" }, formData);
      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.message).toBe("Email already registered");
      }
    });
  });

  describe("signInAction", () => {
    it("returns validation error on empty email or password", async () => {
      const formData = new FormData();
      formData.append("email", "");
      formData.append("password", "");

      const result = await signInAction({ status: "idle" }, formData);
      expect(result.status).toBe("error");
      expect(authServices.logInService).not.toHaveBeenCalled();
    });

    it("authenticates and triggers redirect to home", async () => {
      vi.mocked(authServices.logInService).mockResolvedValue({} as unknown as Awaited<ReturnType<typeof authServices.logInService>>);

      const formData = new FormData();
      formData.append("email", "user@example.com");
      formData.append("password", "Password123");

      // redirect in Next.js throws NEXT_REDIRECT
      await expect(signInAction({ status: "idle" }, formData)).rejects.toThrow("NEXT_REDIRECT: /");
      expect(authServices.logInService).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "Password123",
      });
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
      expect(redirect).toHaveBeenCalledWith("/");
    });

    it("returns error state on login failure", async () => {
      vi.mocked(authServices.logInService).mockRejectedValue(
        new AppError("Invalid credentials", 401)
      );

      const formData = new FormData();
      formData.append("email", "user@example.com");
      formData.append("password", "WrongPassword");

      const result = await signInAction({ status: "idle" }, formData);
      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.message).toBe("Invalid credentials");
      }
    });
  });

  describe("signOut", () => {
    it("calls logOutService, revalidates cache, and redirects to /auth/login", async () => {
      vi.mocked(authServices.logOutService).mockResolvedValue(undefined);

      await expect(signOut()).rejects.toThrow("NEXT_REDIRECT: /auth/login");
      expect(authServices.logOutService).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
      expect(redirect).toHaveBeenCalledWith("/auth/login");
    });
  });

  describe("forgotPasswordAction", () => {
    it("validates email and delegates to forgotPasswordService", async () => {
      vi.mocked(authServices.forgotPasswordService).mockResolvedValue({ success: true });

      const formData = new FormData();
      formData.append("email", "reset@example.com");

      const result = await forgotPasswordAction({ status: "idle" }, formData);
      expect(result).toEqual({ status: "success" });
      expect(authServices.forgotPasswordService).toHaveBeenCalledWith("reset@example.com");
    });

    it("returns validation error on invalid email", async () => {
      const formData = new FormData();
      formData.append("email", "not-valid-email");

      const result = await forgotPasswordAction({ status: "idle" }, formData);
      expect(result.status).toBe("error");
      expect(authServices.forgotPasswordService).not.toHaveBeenCalled();
    });

    it("returns error message if forgotPasswordService fails", async () => {
      vi.mocked(authServices.forgotPasswordService).mockRejectedValue(
        new AppError("User not found", 404)
      );

      const formData = new FormData();
      formData.append("email", "notfound@example.com");

      const result = await forgotPasswordAction({ status: "idle" }, formData);
      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.message).toBe("User not found");
      }
    });
  });

  describe("resetPasswordAction", () => {
    it("validates matching passwords and calls resetPasswordService", async () => {
      vi.mocked(authServices.resetPasswordService).mockResolvedValue({ success: true });

      const formData = new FormData();
      formData.append("password", "NewPass123");
      formData.append("confirmPassword", "NewPass123");

      const result = await resetPasswordAction({ status: "idle" }, formData);
      expect(result).toEqual({ status: "success" });
      expect(authServices.resetPasswordService).toHaveBeenCalledWith("NewPass123");
    });

    it("returns error if passwords do not match", async () => {
      const formData = new FormData();
      formData.append("password", "NewPass123");
      formData.append("confirmPassword", "DifferentPass123");

      const result = await resetPasswordAction({ status: "idle" }, formData);
      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.message).toBe("Passwords do not match");
      }
      expect(authServices.resetPasswordService).not.toHaveBeenCalled();
    });

    it("returns error if resetPasswordService throws", async () => {
      vi.mocked(authServices.resetPasswordService).mockRejectedValue(
        new AppError("Password cannot be reused", 400)
      );

      const formData = new FormData();
      formData.append("password", "NewPass123");
      formData.append("confirmPassword", "NewPass123");

      const result = await resetPasswordAction({ status: "idle" }, formData);
      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.message).toBe("Password cannot be reused");
      }
    });
  });
});
