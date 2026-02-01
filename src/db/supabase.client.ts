import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { AstroCookies } from "astro";

import type { Database } from "../db/database.types.ts";

// DEFAULT_USER_ID points to ADMINISTRATOR user (Admin User-ADM) for MVP development
// This allows testing of admin-specific endpoints like user management without full auth
// NOTE: This is only used as fallback in development mode when DISABLE_AUTH is true
export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Cookie options for Supabase auth
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: import.meta.env.PROD,
  httpOnly: true,
  sameSite: "lax",
};

/**
 * Parse cookie header string into array of cookie objects
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  if (!cookieHeader) return [];
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Create Supabase server client for SSR
 * Use this in Astro pages, API routes, and middleware
 */
export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

// Regular client for standard operations (uses anon key with RLS)
// DEPRECATED: Use createSupabaseServerInstance instead for SSR
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Admin client for privileged operations (uses service_role key, bypasses RLS)
// Only use this for operations that require admin privileges (e.g., creating users)
export const supabaseAdminClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);

export type SupabaseClient = typeof supabaseClient;
