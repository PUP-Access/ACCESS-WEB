import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { notFound, redirect } from "next/navigation";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

type AMREntry = string | { method: string; timestamp: number };

// Helper to decode JWT payload without a library
function decodeJwt(token: string) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export default async function ResetPasswordPage() {
  const supabase = await createSupabaseServerClient();
  
  // 1. If there's no valid user, redirect to login
  const { data: { user }, error } = await supabase.auth.getUser();
  const { data: { session } } = await supabase.auth.getSession();

  if (!user || error) {
    redirect("/auth/login?error=unauthorized");
  }

  // 2. SECURE CHECK: Was this session created via a recovery email?
  const amr: AMREntry[] = session ? decodeJwt(session.access_token).amr ?? [] : [];
  
  const isRecovery = amr.some((entry) => {
    if (typeof entry === "string") {
      return entry === "recovery" || entry === "otp";
    }
    return entry.method === "recovery" || entry.method === "otp";
  });

  // If they are logged in but didn't use a reset link, show 404
  if (!isRecovery && !user.recovery_sent_at) {
    notFound();
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black-50">
      <ResetPasswordForm />
    </main>
  );
}