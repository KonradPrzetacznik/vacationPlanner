/**
 * DELETE /api/teams/:id/members/:userId
 * Endpoint for removing a member from a team
 *
 * Authorization:
 * - ADMINISTRATOR: Can remove members from any team
 * - HR: Can remove members from any team
 * - EMPLOYEE: Cannot remove members (403)
 */

import type { APIRoute } from "astro";
import { removeTeamMemberParamsSchema } from "@/lib/schemas/teams.schema";
import { removeMember } from "@/lib/services/teams.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";

// Disable prerendering for this API route
export const prerender = false;

/**
 * DELETE handler for /api/teams/:id/members/:userId
 * Removes a single user from a team
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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
      console.error("[DELETE /api/teams/:id/members/:userId] Failed to fetch current user profile:", profileError);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Check if user is HR or ADMINISTRATOR
    if (currentUserProfile.role !== "HR" && currentUserProfile.role !== "ADMINISTRATOR") {
      return new Response(JSON.stringify({ error: "Only HR can remove team members" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Validate path parameters (team ID and user ID)
    const paramsValidation = removeTeamMemberParamsSchema.safeParse({
      id: params.id,
      userId: params.userId,
    });

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

    const { id: teamId, userId } = paramsValidation.data;

    // 5. Call service to remove member
    const startTime = Date.now();
    await removeMember(locals.supabase, teamId, userId);
    const duration = Date.now() - startTime;

    // Log slow operations
    if (duration > 1000) {
      console.warn("[DELETE /api/teams/:id/members/:userId] Slow operation detected:", {
        duration,
        teamId,
        userId,
        currentUserId,
      });
    }

    // 6. Return success response
    return new Response(
      JSON.stringify({
        message: "Member removed successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[DELETE /api/teams/:id/members/:userId] Error:", {
      timestamp: new Date().toISOString(),
      teamId: params.id,
      userId: params.userId,
      currentUserId: DEFAULT_USER_ID,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle known error types
    if (error instanceof Error) {
      // Not found errors (404)
      if (error.message === "Team not found") {
        return new Response(JSON.stringify({ error: "Team not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (error.message === "User not found") {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (error.message === "User is not a member of this team") {
        return new Response(JSON.stringify({ error: "User is not a member of this team" }), {
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
