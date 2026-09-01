import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { SignUpInput, LoginInput } from "../schemas";
import { AppError } from "@/lib/errors";

export async function registerOrganization(input: SignUpInput) {
  const supabaseAdmin = createSupabaseAdminClient();

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://pupaccess.org").replace(/\/$/, "");

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "signup",
    email: input.email,
    password: input.password!,
    options: {
      data: {
        organization_name: input.organization_name,
      },
      redirectTo: `${siteUrl}/auth/login`,
    },
  });

  if (error) {
    console.error("Supabase admin generateLink error:", error);
    throw new AppError(error.message, error.status ?? 400);
  }

  const actionLink = data.properties?.action_link;

  if (!actionLink) {
    console.error("Supabase did not return an action_link for signup.");
    throw new AppError("Failed to generate confirmation link.", 500);
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured. Confirmation email cannot be sent.");
    throw new AppError("Email service is temporarily unavailable. Please try again later or contact support.", 503);
  }

  const { Resend } = await import("resend");
  const { renderAccessEmail } = await import("@/lib/email/email-template");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error: resendError } = await resend.emails.send({
    from: "ACCESS \u003cnoreply@pupaccess.org\u003e",
    to: input.email,
    subject: "Confirm Your Organization Account | ACCESS",
    html: renderAccessEmail({
      title: "Confirm Your Organization Account",
      preheader: `Confirm email verification for ${input.organization_name}.`,
      statusLabel: "Account Verification",
      salutation: `Dear Representative of ${input.organization_name},`,
      leadParagraph: `Thank you for registering with \u003cstrong\u003ePUP ACCESS\u003c/strong\u003e. We have received your registration details and are preparing your organization's portal access.`,
      secondaryParagraph: `To finalize your verification and enable equipment reservation features, please confirm your official email address by clicking the button below:`,
      cta: {
        text: "Confirm Organization Account",
        url: actionLink,
      },
      notice: {
        title: "Account Activation Notice",
        content: "This secure verification link is valid for your organization account. If you did not initiate this registration, please disregard this message.",
      },
      closingRemark: "For any assistance during the registration process, feel free to visit Room 424, CEA Building or reply to this email.",
    }),
  });

  if (resendError) {
    console.error("Resend signup email error:", resendError);
    throw new AppError(resendError.message || "Failed to send confirmation email.", 500);
  }

  return data;
}

export async function logInService(input: LoginInput) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password!,
  });

  if (error) throw new AppError(error.message, error.status);

  return data;
}

export async function logOutService() {
  const supabase = await createSupabaseServerClient();
  
  const { error } = await supabase.auth.signOut();

  if (error) throw new AppError(error.message, 500);
}

export async function forgotPasswordService(email: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://pupaccess.org").replace(/\/$/, "");
  
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email: email,
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=/auth/reset-password`,
    },
  });

  if (error) {
    // Don't leak whether an email is registered: log the real error server-side,
    // but tell the caller it "succeeded" so responses are indistinguishable.
    if (error.code === "user_not_found") {
      console.warn(`Password reset requested for unregistered email: ${email}`);
      return { success: true };
    }

    console.error("Supabase admin recovery error:", error);
    throw new AppError(error.message, error.status ?? 400);
  }

  const actionLink = data.properties?.action_link;

  if (!actionLink) {
    console.error("Supabase did not return an action_link for recovery.");
    throw new AppError("Failed to generate recovery link.", 500);
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured. Recovery email cannot be sent.");
    throw new AppError("Email service is temporarily unavailable. Please try again later or contact support.", 503);
  }

  const { Resend } = await import("resend");
  const { renderAccessEmail } = await import("@/lib/email/email-template");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const resetUrl = data.properties?.hashed_token
    ? `${siteUrl}/auth/callback?token_hash=${data.properties.hashed_token}&type=recovery&next=/auth/reset-password`
    : actionLink;

  const { error: resendError } = await resend.emails.send({
    from: "ACCESS <noreply@pupaccess.org>",
    to: email,
    subject: "Password Reset Request | ACCESS",
    html: renderAccessEmail({
      title: "Password Reset Request",
      preheader: "Password recovery request for your ACCESS account.",
      statusLabel: "Security Notice",
      salutation: "Dear User,",
      leadParagraph: `We received a request to reset the password associated with your ACCESS account (<strong>${email}</strong>).`,
      secondaryParagraph: `To configure a new password and restore access to your account, please click the button below:`,
      cta: {
        text: "Reset Account Password",
        url: resetUrl,
      },
      notice: {
        title: "Security Advisory",
        content: "If you did not request a password reset, no changes have been made to your credentials and you may safely disregard this email.",
      },
      closingRemark: "If you suspect unauthorized activity on your account, please notify our administrators.",
    }),
  });

  if (resendError) {
    console.error("Resend recovery email error:", resendError);
    throw new AppError(resendError.message || "Failed to send reset email.", 500);
  }

  return { success: true };
}

export async function resetPasswordService(password: string) {
  const supabase = await createSupabaseServerClient();
  
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new AppError(error.message, error.status);

  // Invalidate the recovery session immediately after reset
  await logOutService();

  return { success: true };
}