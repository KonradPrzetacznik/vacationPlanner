/**
 * GET /api/users/:id
 * Endpoint for retrieving a single user with their team memberships
 *
 * Authorization: Using DEFAULT_USER_ID for development
 * - ADMINISTRATOR: Can view all users including soft-deleted
 * - HR: Can view active users only
 * - EMPLOYEE: Can view only themselves (active only)
 *
 * PATCH /api/users/:id
 * Endpoint for updating user profile information
 *
 * Authorization: Using DEFAULT_USER_ID for development
 * - ADMINISTRATOR: Can update all fields (except email) for all users
 * - EMPLOYEE: Can update only their own firstName and lastName
 *
 * DELETE /api/users/:id
 * Endpoint for soft-deleting a user and cancelling their future vacations
 *
 * Authorization: Using DEFAULT_USER_ID for development
 * - ADMINISTRATOR: Can delete any user
 *
 * NOTE: Full authentication will be implemented later
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { getUserById, updateUser, deleteUser } from "@/lib/services/users.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { updateUserSchema, userIdSchema } from "@/lib/schemas/users.schema";

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

/**
 * PATCH handler for /api/users/:id
 * Updates user profile information
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Validate path parameter
    const idValidation = userIdSchema.safeParse(params.id);

    if (!idValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid user ID format",
          details: idValidation.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = idValidation.data;

    // 2. Use DEFAULT_USER_ID for development (auth will be implemented later)
    const currentUserId = DEFAULT_USER_ID;

    // 3. Get current user's role for authorization
    const { data: currentUserProfile, error: profileError } = await locals.supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUserId)
      .single();

    if (profileError || !currentUserProfile) {
      console.error("[PATCH /api/users/:id] Failed to fetch current user profile:", profileError);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const currentUserRole = currentUserProfile.role as "ADMINISTRATOR" | "HR" | "EMPLOYEE";

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

    const validationResult = updateUserSchema.safeParse(body);

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

    // 5. Call service to update user
    const startTime = Date.now();
    const result = await updateUser(
      locals.supabase,
      userId,
      validatedData,
      currentUserId,
      currentUserRole
    );
    const duration = Date.now() - startTime;

    // Log slow operations
    if (duration > 1000) {
      console.warn("[PATCH /api/users/:id] Slow operation detected:", {
        duration,
        userId,
        currentUserId,
        currentUserRole,
      });
    }

    // 6. Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[PATCH /api/users/:id] Error:", {
      timestamp: new Date().toISOString(),
      userId: params.id,
      currentUserId: DEFAULT_USER_ID,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle known error types
    if (error instanceof Error) {
      // User not found (404)
      if (error.message.includes("User not found")) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Permission errors (403 or 400 depending on context)
      if (error.message.includes("Insufficient permissions")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (error.message.includes("Cannot change")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Failed to update (500)
      if (error.message.includes("Failed to update")) {
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

/**
 * DELETE handler for /api/users/:id
 * Soft-deletes a user and cancels their future vacation requests
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Validate path parameter
    const idValidation = userIdSchema.safeParse(params.id);

    if (!idValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid user ID format",
          details: idValidation.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = idValidation.data;

    // 2. Use DEFAULT_USER_ID for development (auth will be implemented later)
    const currentUserId = DEFAULT_USER_ID;

    // 3. Get current user's role for authorization
    const { data: currentUserProfile, error: profileError } = await locals.supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUserId)
      .single();

    if (profileError || !currentUserProfile) {
      console.error("[DELETE /api/users/:id] Failed to fetch current user profile:", profileError);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Check if user is ADMINISTRATOR
    if (currentUserProfile.role !== "ADMINISTRATOR") {
      return new Response(JSON.stringify({ error: "Forbidden: Administrator role required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Call service to delete user
    const startTime = Date.now();
    const result = await deleteUser(locals.supabase, userId);
    const duration = Date.now() - startTime;

    // Log slow operations
    if (duration > 2000) {
      console.warn("[DELETE /api/users/:id] Slow operation detected:", {
        duration,
        userId,
        currentUserId,
        cancelledVacations: result.cancelledVacations,
      });
    }

    // 6. Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[DELETE /api/users/:id] Error:", {
      timestamp: new Date().toISOString(),
      userId: params.id,
      currentUserId: DEFAULT_USER_ID,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle known error types
    if (error instanceof Error) {
      // User not found (404)
      if (error.message.includes("User not found") || error.message.includes("not found")) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // User already deleted (404)
      if (error.message.includes("already deleted")) {
        return new Response(JSON.stringify({ error: "User already deleted" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Failed to delete (500)
      if (error.message.includes("Failed to delete")) {
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

