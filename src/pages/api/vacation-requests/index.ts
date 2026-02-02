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
import { createVacationRequestSchema } from "@/lib/schemas/vacation-request-detail.schema";
import { getVacationRequests, createVacationRequest } from "@/lib/services/vacation-requests.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import type { CreateVacationRequestResponseDTO } from "@/types";

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
      // Log slow query
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      // Authorization errors
      if (error.message.includes("only view your own") || error.message.includes("not a member of this team")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Not found errors
      if (error.message.includes("not found") || error.message.includes("User not found")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Generic server error
    return new Response(JSON.stringify({ error: "Failed to fetch vacation requests" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/vacation-requests
 * Create a new vacation request
 *
 * Authorization: Using DEFAULT_USER_ID for development
 * - All authenticated users can create vacation requests for themselves
 *
 * NOTE: Full authentication will be implemented later
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = locals.supabase;

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use DEFAULT_USER_ID for development (auth will be implemented later)
    const currentUserId = DEFAULT_USER_ID;

    if (!currentUserId) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate request data
    const validationResult = createVacationRequestSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request data",
          details: validationResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validatedData = validationResult.data;

    // Call service to create vacation request
    const result = await createVacationRequest(supabase, currentUserId, validatedData);

    // Return success response with 201 Created
    const response: CreateVacationRequestResponseDTO = result;

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      // Validation and business rule errors (400)
      if (
        error.message.includes("Invalid") ||
        error.message.includes("cannot be in the past") ||
        error.message.includes("weekend") ||
        error.message.includes("must be after") ||
        error.message.includes("Insufficient vacation days") ||
        error.message.includes("must include at least one business day")
      ) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Conflict errors (409)
      if (error.message.includes("overlapping")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Server errors related to verification (500)
      if (
        error.message.includes("Failed to verify") ||
        error.message.includes("Failed to calculate") ||
        error.message.includes("Failed to check")
      ) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Generic server error
    return new Response(JSON.stringify({ error: "Failed to create vacation request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
