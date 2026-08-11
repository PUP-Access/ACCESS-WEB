"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signInAction } from "../actions/auth.actions";

export function LogInForm() {
  const [state, formAction, isPending] = useActionState(signInAction, { status: "idle" });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="w-full space-y-5">
      {state.status === "error" && (
        <p className="rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-3 text-sm text-red-200">
          {state.message}
        </p>
      )}

      <div>
        <input
          type="text"
          id="email"
          name="email"
          required
          placeholder="Student Number"
          autoComplete="username"
          className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-md px-4 py-3.5 text-sm text-white placeholder:text-white/50 outline-none transition-all hover:border-orange-500/40 hover:bg-white/15 focus:bg-white/20 focus:border-[#F26223] focus:ring-2 focus:ring-[#F26223]/30"
        />
      </div>

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          id="password"
          name="password"
          required
          placeholder="Password"
          autoComplete="current-password"
          className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-md px-4 py-3.5 pr-12 text-sm text-white placeholder:text-white/50 outline-none transition-all hover:border-orange-500/40 hover:bg-white/15 focus:bg-white/20 focus:border-[#F26223] focus:ring-2 focus:ring-[#F26223]/30"
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 transition-colors hover:text-white cursor-pointer"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-[0_6px_20px_rgba(242,98,35,0.35)] hover:shadow-[0_8px_25px_rgba(242,98,35,0.5)]"
        style={{
          background: "linear-gradient(180deg, #F26223 0%, #C93A12 100%)",
        }}
      >
        {isPending ? "Loading..." : "Log in"}
      </button>

      <div className="flex items-center justify-between gap-3 text-sm">
        <label className="flex cursor-pointer items-center gap-2 text-white/85 select-none">
          <input
            type="checkbox"
            name="remember"
            className="h-4 w-4 rounded border-white/30 bg-transparent accent-[#F26223] cursor-pointer"
          />
          <span>Remember me</span>
        </label>
        <Link href="/auth/forgot-password" className="font-medium text-[#F26223] hover:text-[#ff7a3d] transition-colors">
          Forgot Password
        </Link>
      </div>

      {/* Clean Divider */}
      <div className="relative flex items-center my-4">
        <div className="flex-grow border-t border-white/15" />
        <span className="flex-shrink mx-4 text-xs font-medium text-white/60">
          Don&apos;t have an account?
        </span>
        <div className="flex-grow border-t border-white/15" />
      </div>

      <Link
        href="/auth/register"
        className="flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/15 hover:border-orange-500/40"
      >
        Sign up
      </Link>
    </form>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
