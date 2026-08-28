import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { type EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Auth Callback Route Handler
 * Handles both:
 * 1. Token hash OTP verification (?token_hash=...&type=...)
 * 2. Authorization code exchange (?code=...)
 *
 * If error/errorCode is in params -> returns 404
 * On success -> redirects to next with ?verified=true
 * On failure / missing tokens -> redirects to /auth/login?error=invalid_reset_link
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const next = searchParams.get("next") ?? "/auth/reset-password";

  if (error || errorCode) {
    return new NextResponse(null, { status: 404 });
  }

  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    // In test environments or outside request store
  }

  const supabase = await createSupabaseServerClient();

  if (token_hash && type) {
    const { error: otpError } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });

    if (!otpError) {
      const response = NextResponse.redirect(`${origin}${next}?verified=true`);
      if (cookieStore) {
        cookieStore.getAll().forEach((cookie) => {
          response.cookies.set(cookie.name, cookie.value);
        });
      }
      return response;
    }

    return NextResponse.redirect(`${origin}/auth/login?error=invalid_reset_link`);
  }

  if (code) {
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError && data.session) {
      const response = NextResponse.redirect(`${origin}${next}?verified=true`);
      if (cookieStore) {
        cookieStore.getAll().forEach((cookie) => {
          response.cookies.set(cookie.name, cookie.value);
        });
      }
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=invalid_reset_link`);
}