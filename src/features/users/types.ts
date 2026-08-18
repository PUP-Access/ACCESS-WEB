import type { Database } from "@/lib/supabase/database.types";

export type UserRole = Database["public"]["Enums"]["user_role"];
export type UserRow = Database["public"]["Tables"]["Users"]["Row"];

export type GetUsersOptions = {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
};

export type UserActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};
