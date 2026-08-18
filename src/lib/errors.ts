import { NextResponse } from "next/server";
import { ZodError } from "zod";

// allows proper parsing of err msgs and statuses
export class AppError extends Error {
  constructor(public message: string, public statusCode: number = 400) {
    super(message);
    this.name = "AppError";
  }
}

// for API routes, sets HTTP status dynamically,
// unknown errors are catched by a 500 http status
export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

// client-facing (used in actions)
export function getActionErrorMessage(error: unknown, fallback = "An unexpected error occurred"): string {
  if (error instanceof AppError) {
    if (error.message && error.message !== "{}") return error.message;
    return fallback;
  }

  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join(", ") || fallback;
  }

  if (error instanceof Error && error.message) {
    if (error.message !== "{}" && error.message.trim().length > 0) {
      return error.message;
    }
  }

  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim().length > 0 && msg !== "{}") {
      return msg;
    }
  }

  return fallback;
}

type SupabaseErrorLike = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

export function isRlsPolicyError(error: unknown): boolean {
  const message = getErrorMessage(error, "").toLowerCase();
  return message.includes("row-level security");
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object" && "message" in error) {
    const supabaseError = error as SupabaseErrorLike;
    if (typeof supabaseError.message === "string" && supabaseError.message.length > 0) {
      return supabaseError.message;
    }
  }

  return fallback;
}

export function throwSupabaseError(error: SupabaseErrorLike | null): asserts error is null {
  if (error) {
    throw new Error(error.message ?? "Database request failed");
  }
}
