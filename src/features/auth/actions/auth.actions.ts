"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import { SignUpSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from "../schemas";
import { forgotPasswordService, logInService, logOutService, registerOrganization, resetPasswordService } from "../services/auth.services";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getActionErrorMessage } from "@/lib/errors";

type ActionState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export async function signUpAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = Object.fromEntries(formData);
  const result = SignUpSchema.safeParse(rawData);
  
  if (!result.success) {
    // Return the first error
    return { 
      status: "error", 
      message: result.error.issues.map((i) => i.message).at(0) ?? "Invalid input"
    };
  }

  try {
    await registerOrganization(result.data);

    // Revalidate to clear any stale cache
    revalidatePath("/", "layout");
    return { status: "success" };

  } catch (err) {
    console.error("SignUp Error: ", err);
    return { 
      status: "error", 
      message: getActionErrorMessage(err) 
    };
  }
};

export async function signInAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = Object.fromEntries(formData);
  const result = LoginSchema.safeParse(rawData);
  
  if (!result.success) {
    // Return the first error
    return { 
      status: "error", 
      message: result.error.issues.map((i) => i.message).at(0) ?? "Invalid input"
    };
  }

  try {
    await logInService(result.data);
    revalidatePath("/", "layout");
    redirect("/")

  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { 
      status: "error", 
      message: getActionErrorMessage(err) 
    };
  }
};

export const signOut = async () => {
  try {
    await logOutService();
  } catch (error) {
    console.error("Sign out error:", error);
  }

  // Clear cache and send them back to login
  revalidatePath("/", "layout");
  redirect("/auth/login");
};

export async function forgotPasswordAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = Object.fromEntries(formData);
  const result = ForgotPasswordSchema.safeParse(rawData);

  if (!result.success) {
    // Return the first error
    return { 
      status: "error", 
      message: result.error.issues.map((i) => i.message).at(0) ?? "Invalid input"
    };
  }

  try {
      await forgotPasswordService(result.data.email);
      return { status: "success" };
  } catch (err) {
    return { 
      status: "error", 
      message: getActionErrorMessage(err) 
    };
  }
};

export async function resetPasswordAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = Object.fromEntries(formData);
  const result = ResetPasswordSchema.safeParse(rawData);

  if (!result.success) {
    // Return the first error
    return { 
      status: "error", 
      message: result.error.issues.map((i) => i.message).at(0) ?? "Invalid input"
    };
  }

  try {
      await resetPasswordService(result.data.password);
      return { status: "success" };
  } catch (err) {
    return { 
      status: "error", 
      message: getActionErrorMessage(err) 
    };
  }
};