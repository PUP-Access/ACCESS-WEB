"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resetPasswordAction } from "../actions/auth.actions";

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, { status: "idle" });
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      const timer = setTimeout(() => router.push("/auth/login"), 3000);
      return () => clearTimeout(timer);
    }
  }, [router, state.status]);

  return (
    <form action={formAction} className="w-full space-y-5">
      {state.status === "error" && (
        <p className="rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-3 text-sm text-red-200">
          {state.message}
        </p>
      )}
      {state.status === "success" && (
        <p className="rounded-xl bg-green-500/20 border border-green-500/30 px-4 py-3 text-sm text-green-200">
          Password reset successful! Redirecting you shortly...
        </p>
      )}

      <div>
        <input
          name="password"
          type="password"
          placeholder="New Password"
          required
          className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-md px-4 py-3.5 text-sm text-white placeholder:text-white/50 outline-none transition-all hover:border-orange-500/40 hover:bg-white/15 focus:bg-white/20 focus:border-[#F26223] focus:ring-2 focus:ring-[#F26223]/30"
        />
      </div>

      <div>
        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirm New Password"
          required
          className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-md px-4 py-3.5 text-sm text-white placeholder:text-white/50 outline-none transition-all hover:border-orange-500/40 hover:bg-white/15 focus:bg-white/20 focus:border-[#F26223] focus:ring-2 focus:ring-[#F26223]/30"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-[0_6px_20px_rgba(242,98,35,0.35)] hover:shadow-[0_8px_25px_rgba(242,98,35,0.5)]"
        style={{
          background: "linear-gradient(180deg, #F26223 0%, #C93A12 100%)",
        }}
      >
        {isPending ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  );
}