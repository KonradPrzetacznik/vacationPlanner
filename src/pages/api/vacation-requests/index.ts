/**
 * GET /api/vacation-requests
 * List vacation requests with filtering and pagination
 *
 * Authorization: Using DEFAULT_USER_ID for development
 * - ADMINISTRATOR: Can view all vacation requests
 * - HR: Can view requests from team members
 * - EMPLOYEE: Can view only their own requests
 *
 * NOTE: Full authentication will be implemented later
 */
import type { APIRoute } from "astro";
import { GetVacationRequestsQuerySchema } from "@/lib/schemas/vacation-requests.schema";
import { getVacationRequests } from "@/lib/services/vacation-requests.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const supabase = locals.supabase;

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract and validate query parameters
    const queryParams: Record<string, string | string[]> = Object.fromEntries(url.searchParams.entries());

    // Handle multiple status values (e.g., ?status=SUBMITTED&status=APPROVED)
    const statuses = url.searchParams.getAll("status");
    if (statuses.length > 0) {
      queryParams.status = statuses;
    }

    const validationResult = GetVacationRequestsQuerySchema.safeParse(queryParams);

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

    const validatedQuery = validationResult.data;

    // Use DEFAULT_USER_ID for development (auth will be implemented later)
    const currentUserId = DEFAULT_USER_ID;

    // Call service to get vacation requests
    const startTime = Date.now();
    const result = await getVacationRequests(supabase, currentUserId, validatedQuery);
    const duration = Date.now() - startTime;

    // Log slow queries
    if (duration > 1000) {
      console.warn("[GET /api/vacation-requests] Slow query detected:", {
        duration,
        queryParams: validatedQuery,
        userId: currentUserId,
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /api/vacation-requests] Error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      // Authorization errors
      if (
        error.message.includes("only view your own") ||
        error.message.includes("not a member of this team")
      ) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Not found errors
      if (
        error.message.includes("not found") ||
        error.message.includes("User not found")
      ) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Generic server error
    return new Response(
      JSON.stringify({ error: "Failed to fetch vacation requests" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

