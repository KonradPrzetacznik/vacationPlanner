/**
 * GET /api/users/:userId/vacation-allowances/:year
 * Endpoint for retrieving vacation allowance for a specific year
 *
 * Authorization: Using DEFAULT_USER_ID for development
 * - ADMINISTRATOR: Can view all users' allowances including deleted users
 * - HR: Can view active users' allowances only
 * - EMPLOYEE: Can view only their own allowances
 *
 * NOTE: Full authentication will be implemented later
 */

import type { APIRoute } from "astro";
import { getVacationAllowanceByYear } from "@/lib/services/vacation-allowances.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { getVacationAllowanceByYearParamsSchema } from "@/lib/schemas/vacation-allowances.schema";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET handler for /api/users/:userId/vacation-allowances/:year
 * Retrieves vacation allowance for a specific year
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Validate path parameters
    const paramsValidation = getVacationAllowanceByYearParamsSchema.safeParse(params);

    if (!paramsValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid parameters",
          details: paramsValidation.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { userId, year } = paramsValidation.data;

    // 2. Use DEFAULT_USER_ID for development (auth will be implemented later)
    const currentUserId = DEFAULT_USER_ID;

    // 3. Get current user's role for RBAC
    const { data: currentUserProfile, error: profileError } = await locals.supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUserId)
      .single();

    if (profileError || !currentUserProfile) {
      console.error(
        "[GET /api/users/:userId/vacation-allowances/:year] Failed to fetch current user profile:",
        profileError
      );
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const currentUserRole = currentUserProfile.role as "ADMINISTRATOR" | "HR" | "EMPLOYEE";

    // 4. Call service to get vacation allowance by year
    const result = await getVacationAllowanceByYear(locals.supabase, currentUserId, currentUserRole, userId, year);

    // 5. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /api/users/:userId/vacation-allowances/:year] Error:", error);

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
