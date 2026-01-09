/**
 * POST /api/teams/:id/members
 * Endpoint for adding members to a team
 *
 * Authorization:
 * - ADMINISTRATOR: Can add members to any team
 * - HR: Can add members to any team
 * - EMPLOYEE: Cannot add members (403)
 */

import type { APIRoute } from "astro";
import { teamIdParamSchema, addTeamMembersSchema } from "@/lib/schemas/teams.schema";
import { addMembers } from "@/lib/services/teams.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";

// Disable prerendering for this API route
export const prerender = false;

/**
 * POST handler for /api/teams/:id/members
 * Adds multiple users to a team (bulk operation)
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
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
      console.error("[POST /api/teams/:id/members] Failed to fetch current user profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Check if user is HR or ADMINISTRATOR
    if (currentUserProfile.role !== "HR" && currentUserProfile.role !== "ADMINISTRATOR") {
      return new Response(
        JSON.stringify({ error: "Only HR can add team members" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Validate path parameter (team ID)
    // 4. Validate path parameter (team ID)
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

    // 5. Parse and validate request body
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

    const bodyValidation = addTeamMembersSchema.safeParse(body);

    if (!bodyValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: bodyValidation.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { userIds } = bodyValidation.data;

    // 6. Call service to add members
    const startTime = Date.now();
    const addedMembers = await addMembers(locals.supabase, teamId, userIds);
    const duration = Date.now() - startTime;

    // Log slow operations
    if (duration > 2000) {
      console.warn("[POST /api/teams/:id/members] Slow operation detected:", {
        duration,
        teamId,
        currentUserId,
        memberCount: userIds.length,
      });
    }

    // 7. Return success response
    return new Response(
      JSON.stringify({
        message: "Members added successfully",
        added: addedMembers,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[POST /api/teams/:id/members] Error:", {
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

      if (error.message.startsWith("User") && error.message.includes("not found")) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Bad request errors (400)
      if (error.message.includes("is already a member of this team")) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
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

