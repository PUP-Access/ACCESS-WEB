import { describe, it, expect } from "vitest";
import {
  SignUpSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "@/features/auth/schemas";

describe("Auth Schemas Validation", () => {
  describe("LoginSchema", () => {
    it("validates valid login credentials and normalizes email", () => {
      const validData = {
        email: "  User@Example.COM ",
        password: "MyPassword123!",
      };
      const result = LoginSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
        expect(result.data.password).toBe("MyPassword123!");
      }
    });

    it("rejects invalid email formats", () => {
      const invalidEmails = ["not-an-email", "@example.com", "user@", ""];
      for (const email of invalidEmails) {
        const result = LoginSchema.safeParse({
          email,
          password: "password123",
        });
        expect(result.success).toBe(false);
      }
    });

    it("rejects empty password", () => {
      const result = LoginSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Password is required");
      }
    });
  });

  describe("SignUpSchema", () => {
    it("validates valid signup data with strong password and valid organization name", () => {
      const validData = {
        email: "OrgLeader@Domain.Org",
        password: "ValidPassword1",
        organization_name: "Association of Computer Enthusiasts",
      };
      const result = SignUpSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("orgleader@domain.org");
        expect(result.data.organization_name).toBe("Association of Computer Enthusiasts");
      }
    });

    it("rejects passwords shorter than 8 characters", () => {
      const result = SignUpSchema.safeParse({
        email: "test@example.com",
        password: "Pass1",
        organization_name: "Test Org",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes("at least 8 characters"))).toBe(true);
      }
    });

    it("rejects passwords exceeding 70 characters", () => {
      const result = SignUpSchema.safeParse({
        email: "test@example.com",
        password: "A1" + "a".repeat(70),
        organization_name: "Test Org",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes("not exceed 70 characters"))).toBe(true);
      }
    });

    it("rejects passwords without an uppercase letter", () => {
      const result = SignUpSchema.safeParse({
        email: "test@example.com",
        password: "lowercase1234",
        organization_name: "Test Org",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes("uppercase"))).toBe(true);
      }
    });

    it("rejects passwords without a numeric digit", () => {
      const result = SignUpSchema.safeParse({
        email: "test@example.com",
        password: "PasswordWithoutNumber",
        organization_name: "Test Org",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes("number"))).toBe(true);
      }
    });

    it("validates organization name constraints (length and special characters)", () => {
      // Too short
      const shortOrg = SignUpSchema.safeParse({
        email: "test@example.com",
        password: "Password123",
        organization_name: "AB",
      });
      expect(shortOrg.success).toBe(false);

      // Too long (> 50 chars)
      const longOrg = SignUpSchema.safeParse({
        email: "test@example.com",
        password: "Password123",
        organization_name: "A".repeat(51),
      });
      expect(longOrg.success).toBe(false);

      // Invalid special characters like <> / \
      const invalidCharsOrg = SignUpSchema.safeParse({
        email: "test@example.com",
        password: "Password123",
        organization_name: "Hacker <Org>",
      });
      expect(invalidCharsOrg.success).toBe(false);

      // Allowed characters: hyphen, period, apostrophe, whitespace
      const validSpecialChars = SignUpSchema.safeParse({
        email: "test@example.com",
        password: "Password123",
        organization_name: "St. Jude's Tech-Club 2026",
      });
      expect(validSpecialChars.success).toBe(true);
    });
  });

  describe("ForgotPasswordSchema", () => {
    it("accepts valid email for recovery", () => {
      const result = ForgotPasswordSchema.safeParse({
        email: "RECOVERY@example.com",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("recovery@example.com");
      }
    });

    it("rejects missing or malformed email", () => {
      expect(ForgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
      expect(ForgotPasswordSchema.safeParse({ email: "invalid-email" }).success).toBe(false);
    });
  });

  describe("ResetPasswordSchema", () => {
    it("accepts matching strong passwords", () => {
      const result = ResetPasswordSchema.safeParse({
        password: "NewPassword123",
        confirmPassword: "NewPassword123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects non-matching confirmPassword", () => {
      const result = ResetPasswordSchema.safeParse({
        password: "NewPassword123",
        confirmPassword: "DifferentPassword123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Passwords do not match");
        expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
      }
    });

    it("rejects weak new passwords even if they match", () => {
      const result = ResetPasswordSchema.safeParse({
        password: "weak",
        confirmPassword: "weak",
      });
      expect(result.success).toBe(false);
    });
  });
});
