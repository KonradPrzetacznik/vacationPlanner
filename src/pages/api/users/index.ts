/**
 * GET /api/users
 * Endpoint for retrieving paginated and filtered list of users
 *
 * Authorization: Using DEFAULT_USER_ID for development
 * - ADMINISTRATOR: Can view all users including soft-deleted
 * - HR: Can view active users only
 * - EMPLOYEE: Can view active users only
 *
 * POST /api/users
 * Endpoint for creating new users
 *
 * Authorization: Using DEFAULT_USER_ID for development
 * - ADMINISTRATOR: Can create new users
 *
 * NOTE: Full authentication will be implemented later
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { getUsers, createUser } from "@/lib/services/users.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { createUserSchema } from "@/lib/schemas/users.schema";

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

/**
 * POST handler for /api/users
 * Creates a new user with temporary password
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Use DEFAULT_USER_ID for development (auth will be implemented later)
    const currentUserId = DEFAULT_USER_ID;

    // 2. Get current user's role for authorization
    const { data: currentUserProfile, error: profileError } = await locals.supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUserId)
      .single();

    if (profileError || !currentUserProfile) {
      console.error("[POST /api/users] Failed to fetch current user profile:", profileError);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Check if user is ADMINISTRATOR
    if (currentUserProfile.role !== "ADMINISTRATOR") {
      return new Response(JSON.stringify({ error: "Forbidden: Administrator role required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validationResult = createUserSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validatedData = validationResult.data;

    // 5. Call service to create user
    const startTime = Date.now();
    const result = await createUser(locals.supabase, validatedData);
    const duration = Date.now() - startTime;

    // Log slow operations
    if (duration > 2000) {
      console.warn("[POST /api/users] Slow operation detected:", {
        duration,
        userId: result.id,
        currentUserId,
      });
    }

    // 6. Return successful response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[POST /api/users] Error:", {
      timestamp: new Date().toISOString(),
      currentUserId: DEFAULT_USER_ID,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle known error types
    if (error instanceof Error) {
      // Email already exists (400 Bad Request)
      if (error.message.includes("already exists")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Failed to create user (500)
      if (error.message.includes("Failed to")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
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

