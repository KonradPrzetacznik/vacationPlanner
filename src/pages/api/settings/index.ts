/**
 * GET /api/settings
 * Endpoint for retrieving all global settings
 *
 * Authorization: Using DEFAULT_USER_ID for development
 * - ADMINISTRATOR: Can view all settings
 * - HR: Can view all settings
 * - EMPLOYEE: Can view all settings
 *
 * NOTE: Full authentication will be implemented later
 */

import type { APIRoute } from "astro";
import { getAllSettings } from "@/lib/services/settings.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET handler for /api/settings
 * Retrieves all global settings
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // 1. Use DEFAULT_USER_ID for development (auth will be implemented later)
    // 2. Verify user exists (basic authentication check)
    const { data: currentUserProfile, error: profileError } = await locals.supabase
      .from("profiles")
      .select("id")
      .eq("id", DEFAULT_USER_ID)
      .single();

    if (profileError || !currentUserProfile) {
      console.error("[GET /api/settings] Failed to fetch current user profile:", profileError);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Call service to get all settings
    const startTime = Date.now();
    const result = await getAllSettings(locals.supabase);
    const duration = Date.now() - startTime;

    // Log slow operations
    if (duration > 1000) {
      console.warn("[GET /api/settings] Slow operation:", { duration });
    }

    // 4. Return successful response (200 OK)
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /api/settings] Error:", {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Generic internal server error (500)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

