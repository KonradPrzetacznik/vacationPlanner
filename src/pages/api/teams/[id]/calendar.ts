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
import { DEFAULT_USER_ID } from "@/db/supabase.client";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET handler for /api/teams/:id/calendar
 * Returns team calendar with vacation requests for all members
 */
export const GET: APIRoute = async ({ params, request, locals }) => {
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
      console.error("[GET /api/teams/:id/calendar] Failed to fetch current user profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
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
      includeStatus: url.searchParams.getAll("includeStatus").length > 0
        ? url.searchParams.getAll("includeStatus")
        : undefined,
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
      console.warn("[GET /api/teams/:id/calendar] Slow operation detected:", {
        duration,
        teamId,
        currentUserId,
        memberCount: calendar.members.length,
      });
    }

    // 6. Return success response
    return new Response(
      JSON.stringify(calendar),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[GET /api/teams/:id/calendar] Error:", {
      timestamp: new Date().toISOString(),
      teamId: params.id,
      currentUserId: DEFAULT_USER_ID,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle known error types
    if (error instanceof Error) {
      // Not found errors (404)
      if (error.message === "Team not found") {
        return new Response(
          JSON.stringify({ error: "Team not found" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Forbidden errors (403)
      if (error.message === "You are not a member of this team") {
        return new Response(
          JSON.stringify({ error: "You are not a member of this team" }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Generic internal server error (500)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

