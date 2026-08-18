import { z } from "zod";

// --- Base Schemas (Re-usable) ---

const emailSchema = z.string()
  .trim()
  .min(1, "Email is required")
  .toLowerCase()
  .pipe(
    z.email({ message: "Please enter a valid email address" })
  );

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(70, "Password must not exceed 70 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[0-9]/, "Must contain at least one number");

// --- Exported Schemas ---

export const LoginSchema = z.object({
  email: emailSchema,
  // No validation complexity for older passwords
  password: z.string().min(1, "Password is required"), 
});

export const SignUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  organization_name: z.string()
    .trim()
    .min(3, "Org name must be at least 3 characters")
    .max(50, "Max 50 characters allowed")
    .regex(/^[a-zA-Z0-9\s\-'.]+$/, "Name contains invalid characters"),
});

export const ForgotPasswordSchema = z.object({
  email: emailSchema,
});

export const ResetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Types
export type LoginInput = z.infer<typeof LoginSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
