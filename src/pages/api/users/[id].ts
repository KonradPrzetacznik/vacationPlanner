/**
 * GET /api/users/:id
 * Endpoint for retrieving a single user with their team memberships
 *
 * Authorization: Using DEFAULT_USER_ID for development
 * - ADMINISTRATOR: Can view all users including soft-deleted
 * - HR: Can view active users only
 * - EMPLOYEE: Can view only themselves (active only)
 *
 * NOTE: Full authentication will be implemented later
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { getUserById } from "@/lib/services/users.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";

// Disable prerendering for this API route
export const prerender = false;

/**
 * Zod schema for validating path parameter
 */
const userIdParamSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
});

/**
 * GET handler for /api/users/:id
 * Retrieves a single user with their teams
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Validate path parameter
    const validationResult = userIdParamSchema.safeParse(params);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid user ID format",
          details: validationResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { id: userId } = validationResult.data;

    // 2. Use DEFAULT_USER_ID for development (auth will be implemented later)
    const currentUserId = DEFAULT_USER_ID;

    // 3. Get current user's role for RBAC
    const { data: currentUserProfile, error: profileError } = await locals.supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUserId)
      .single();

    if (profileError || !currentUserProfile) {
      console.error("[GET /api/users/:id] Failed to fetch current user profile:", profileError);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const currentUserRole = currentUserProfile.role as "ADMINISTRATOR" | "HR" | "EMPLOYEE";

    // 4. Call service to get user
    const startTime = Date.now();
    const userDetails = await getUserById(locals.supabase, currentUserId, currentUserRole, userId);
    const duration = Date.now() - startTime;

    // Log slow queries
    if (duration > 500) {
      console.warn("[GET /api/users/:id] Slow query detected:", {
        duration,
        userId,
        currentUserId,
        currentUserRole,
      });
    }

    // 5. Return successful response
    return new Response(JSON.stringify({ data: userDetails }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /api/users/:id] Error:", {
      timestamp: new Date().toISOString(),
      userId: params.id,
      currentUserId: DEFAULT_USER_ID,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle known error types
    if (error instanceof Error) {
      // Not found errors (404) - includes permission denials
      if (error.message.includes("User not found") || error.message.includes("not found")) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Authorization errors (403 Forbidden)
      if (error.message.includes("Insufficient permissions") || error.message.includes("permissions")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Generic internal server error (500)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
