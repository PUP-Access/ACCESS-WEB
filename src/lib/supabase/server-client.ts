import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "./database.types";

function getEnvironmentVariables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

/**
 * Creates a Supabase client for Server Components, Actions, and Route Handlers.
 * This client automatically syncs auth state using Next.js cookies.
 */
export async function createSupabaseServerClient() {
  const { supabaseUrl, supabaseAnonKey } = getEnvironmentVariables();
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      // Allows Supabase to read the session from the browser's request
      getAll() {
        return cookieStore.getAll();
      },
      // Allows Supabase to refresh and update the session cookie
      setAll(cookiesToSet) {
        // The 'setAll' method can fail if called from a Server Component.
        // This is safe to ignore as middleware handles session updates.
        try {
          cookiesToSet.forEach(({ name, value, options }) => 
            cookieStore.set(name, value, options)
          );
        } catch {
          // Intentionally ignored when called from Server Components
        }
      }
    }
  });
}