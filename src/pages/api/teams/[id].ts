/**
 * GET /api/teams/:id
 * Endpoint for retrieving team details with members list
 *
 * Authorization:
 * - ADMINISTRATOR: Can view any team
 * - HR: Can view any team
 * - EMPLOYEE: Can view only teams they are members of
 *
 * PATCH /api/teams/:id
 * Endpoint for updating team information
 *
 * Authorization:
 * - ADMINISTRATOR: Can update any team
 * - HR: Can update any team
 * - EMPLOYEE: Cannot update teams (403)
 *
 * DELETE /api/teams/:id
 * Endpoint for deleting teams
 *
 * Authorization:
 * - ADMINISTRATOR: Can delete any team
 * - HR: Can delete any team
 * - EMPLOYEE: Cannot delete teams (403)
 */

import type { APIRoute } from "astro";
import { teamIdParamSchema, updateTeamSchema } from "@/lib/schemas/teams.schema";
import { getTeamById, updateTeam, deleteTeam } from "@/lib/services/teams.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET handler for /api/teams/:id
 * Retrieves team details with members list
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Validate path parameter
    const idValidation = teamIdParamSchema.safeParse({ id: params.id });

    if (!idValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid team ID format",
          details: idValidation.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const teamId = idValidation.data.id;

    // 2. Use DEFAULT_USER_ID for development (auth will be implemented later)
    const currentUserId = DEFAULT_USER_ID;

    // 3. Get current user's role
    const { data: currentUserProfile, error: profileError } = await locals.supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUserId)
      .single();

    if (profileError || !currentUserProfile) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Call service to get team details
    const result = await getTeamById(locals.supabase, teamId, currentUserId, currentUserProfile.role);

    // 5. Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle known error types
    if (error instanceof Error) {
      // Not found errors (404)
      if (error.message.includes("Team not found") || error.message.includes("not found")) {
        return new Response(JSON.stringify({ error: "Team not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Authorization errors (403 Forbidden)
      if (error.message.includes("Not a member") || error.message.includes("permissions")) {
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
 * PATCH handler for /api/teams/:id
 * Updates team information
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Validate path parameter
    const idValidation = teamIdParamSchema.safeParse({ id: params.id });

    if (!idValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid team ID format",
          details: idValidation.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const teamId = idValidation.data.id;

    // 2. Use DEFAULT_USER_ID for development (auth will be implemented later)
    const currentUserId = DEFAULT_USER_ID;

    // 3. Get current user's role for authorization
    const { data: currentUserProfile, error: profileError } = await locals.supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUserId)
      .single();

    if (profileError || !currentUserProfile) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Check if user is HR or ADMINISTRATOR
    if (currentUserProfile.role !== "HR" && currentUserProfile.role !== "ADMINISTRATOR") {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validationResult = updateTeamSchema.safeParse(body);

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

    // 6. Call service to update team
    const result = await updateTeam(locals.supabase, teamId, validatedData);

    // 7. Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle known error types
    if (error instanceof Error) {
      // Not found errors (404)
      if (error.message.includes("Team not found") || error.message.includes("not found")) {
        return new Response(JSON.stringify({ error: "Team not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Team name already exists (400 Bad Request)
      if (error.message.includes("already exists")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
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
 * DELETE handler for /api/teams/:id
 * Deletes a team and all its members (CASCADE)
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Validate path parameter
    const idValidation = teamIdParamSchema.safeParse({ id: params.id });

    if (!idValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid team ID format",
          details: idValidation.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const teamId = idValidation.data.id;

    // 2. Use DEFAULT_USER_ID for development (auth will be implemented later)
    const currentUserId = DEFAULT_USER_ID;

    // 3. Get current user's role for authorization
    const { data: currentUserProfile, error: profileError } = await locals.supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUserId)
      .single();

    if (profileError || !currentUserProfile) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Check if user is HR or ADMINISTRATOR
    if (currentUserProfile.role !== "HR" && currentUserProfile.role !== "ADMINISTRATOR") {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Call service to delete team
    const result = await deleteTeam(locals.supabase, teamId);

    // 6. Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle known error types
    if (error instanceof Error) {
      // Not found errors (404)
      if (error.message.includes("Team not found") || error.message.includes("not found")) {
        return new Response(JSON.stringify({ error: "Team not found" }), {
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
