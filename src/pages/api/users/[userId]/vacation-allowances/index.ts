/**
 * GET /api/users/:userId/vacation-allowances
 * Endpoint for retrieving vacation allowances for a user
 * Optional query parameter: year (filter by specific year)
 *
 * Authorization: Using DEFAULT_USER_ID for development
 * - ADMINISTRATOR: Can view all users' allowances including deleted users
 * - HR: Can view active users' allowances only
 * - EMPLOYEE: Can view only their own allowances
 *
 * NOTE: Full authentication will be implemented later
 */

import type { APIRoute } from "astro";
import { getVacationAllowances } from "@/lib/services/vacation-allowances.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import {
  getVacationAllowancesParamsSchema,
  getVacationAllowancesQuerySchema,
} from "@/lib/schemas/vacation-allowances.schema";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET handler for /api/users/:userId/vacation-allowances
 * Retrieves vacation allowances for a user with optional year filter
 */
export const GET: APIRoute = async ({ params, url, locals }) => {
  try {
    // 1. Validate path parameter
    const paramsValidation = getVacationAllowancesParamsSchema.safeParse(params);

    if (!paramsValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid user ID format",
          details: paramsValidation.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { userId } = paramsValidation.data;

    // 2. Validate query parameters
    const yearParam = url.searchParams.get("year");
    const queryParams = {
      year: yearParam && yearParam !== "" ? yearParam : undefined,
    };

    const queryValidation = getVacationAllowancesQuerySchema.safeParse(queryParams);

    if (!queryValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid query parameters",
          details: queryValidation.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { year } = queryValidation.data;

    // 3. Use DEFAULT_USER_ID for development (auth will be implemented later)
    const currentUserId = DEFAULT_USER_ID;

    // 4. Get current user's role for RBAC
    const { data: currentUserProfile, error: profileError } = await locals.supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUserId)
      .single();

    if (profileError || !currentUserProfile) {
      console.error("[GET /api/users/:userId/vacation-allowances] Failed to fetch current user profile:", profileError);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const currentUserRole = currentUserProfile.role as "ADMINISTRATOR" | "HR" | "EMPLOYEE";

    // 5. Call service to get vacation allowances
    const result = await getVacationAllowances(locals.supabase, currentUserId, currentUserRole, userId, year);

    // 6. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /api/users/:userId/vacation-allowances] Error:", error);

    // Handle specific error types
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Map error messages to HTTP status codes
    if (errorMessage.includes("not found") || errorMessage.includes("Not found")) {
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (errorMessage.includes("Forbidden")) {
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (errorMessage.includes("Unauthorized")) {
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generic error
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
