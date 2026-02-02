/**
 * GET /api/teams/:id/calendar
 * Endpoint for getting team vacation calendar
 *
 * Authorization:
 * - ADMINISTRATOR: Can view calendar for any team
 * - HR: Can view calendar for any team
 * - EMPLOYEE: Can only view calendar for teams they are a member of
 */

import type { APIRoute } from "astro";
import { teamIdParamSchema, getTeamCalendarQuerySchema } from "@/lib/schemas/teams.schema";
import { getCalendar } from "@/lib/services/teams.service";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET handler for /api/teams/:id/calendar
 * Returns team calendar with vacation requests for all members
 */
export const GET: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Get current user from middleware
    const currentUser = locals.user;

    if (!currentUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const currentUserId = currentUser.id;

    // 2. Get current user's role for authorization
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

    // 3. Validate path parameter (team ID)
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

    // 4. Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
      month: url.searchParams.get("month") || undefined,
      includeStatus:
        url.searchParams.getAll("includeStatus").length > 0 ? url.searchParams.getAll("includeStatus") : undefined,
    };

    const queryValidation = getTeamCalendarQuerySchema.safeParse(queryParams);

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

    const filters = queryValidation.data;

    // 5. Call service to get calendar
    const startTime = Date.now();
    const calendar = await getCalendar(
      locals.supabase,
      currentUserId,
      currentUserProfile.role as "ADMINISTRATOR" | "HR" | "EMPLOYEE",
      teamId,
      filters
    );
    const duration = Date.now() - startTime;

    // Log slow operations
    if (duration > 2000) {
      // Log slow operation
    }

    // 6. Return success response
    return new Response(JSON.stringify(calendar), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle known error types
    if (error instanceof Error) {
      // Not found errors (404)
      if (error.message === "Team not found") {
        return new Response(JSON.stringify({ error: "Team not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Forbidden errors (403)
      if (error.message === "You are not a member of this team") {
        return new Response(JSON.stringify({ error: "You are not a member of this team" }), {
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
