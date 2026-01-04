/**
 * GET /api/users
 * Endpoint for retrieving paginated and filtered list of users
 *
 * Authorization: Using DEFAULT_USER_ID for development
 * - ADMINISTRATOR: Can view all users including soft-deleted
 * - HR: Can view active users only
 * - EMPLOYEE: Can view active users only
 *
 * NOTE: Full authentication will be implemented later
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { getUsers } from "@/lib/services/users.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";

// Disable prerendering for this API route - Astro uses this export
export const prerender = false;

/**
 * Zod schema for validating query parameters
 */
const getUsersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  role: z.enum(["ADMINISTRATOR", "HR", "EMPLOYEE"]).optional(),
  includeDeleted: z.coerce.boolean().optional().default(false),
  teamId: z.string().uuid().optional(),
});

/**
 * GET handler for /api/users
 * Retrieves list of users with pagination and filtering
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);

    const validationResult = getUsersQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid query parameters",
          details: validationResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validatedParams = validationResult.data;

    // 2. Use DEFAULT_USER_ID for development (auth will be implemented later)
    const currentUserId = DEFAULT_USER_ID;

    // 3. Call service to get users
    const startTime = Date.now();
    const result = await getUsers(locals.supabase, currentUserId, validatedParams);
    const duration = Date.now() - startTime;

    // Log slow queries
    if (duration > 1000) {
      console.warn("[GET /api/users] Slow query detected:", {
        duration,
        queryParams: validatedParams,
        userId: currentUserId,
      });
    }

    // 4. Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /api/users] Error:", {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle known error types
    if (error instanceof Error) {
      // Authorization errors (403 Forbidden)
      if (error.message.includes("Only administrators")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Not found errors (404)
      if (error.message.includes("Team not found")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
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
