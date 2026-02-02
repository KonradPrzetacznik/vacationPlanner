/**
 * GET /api/vacation-requests/:id
 * Endpoint for fetching detailed information about a single vacation request
 * Implements RBAC (Role-Based Access Control)
 */

import type { APIRoute } from "astro";
import { getVacationRequestByIdParamsSchema } from "@/lib/schemas/vacation-request-detail.schema";
import { getVacationRequestById } from "@/lib/services/vacation-requests.service";
import type { GetVacationRequestByIdResponseDTO } from "@/types";

export const prerender = false;

/**
 * GET handler for fetching a single vacation request by ID
 * Access control:
 * - EMPLOYEE: Can only view their own requests
 * - HR: Can view requests from their team members
 * - ADMINISTRATOR: Can view all requests
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Get authenticated user and Supabase client from locals
    const currentUser = locals.user;
    const supabase = locals.supabase;

    if (!currentUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const currentUserId = currentUser.id;

    // 2. Validate request ID parameter
    const validationResult = getVacationRequestByIdParamsSchema.safeParse({
      id: params.id,
    });

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || "Invalid vacation request ID format";
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = validationResult.data;

    // 3. Fetch vacation request from service
    const vacationRequest = await getVacationRequestById(supabase, currentUserId, id);

    // 4. Return success response
    const response: GetVacationRequestByIdResponseDTO = {
      data: vacationRequest,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof Error) {
      // Authorization errors (403)
      if (error.message.includes("only view your own") || error.message.includes("not authorized")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Not found errors (404)
      if (error.message.includes("not found")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Permission verification errors (500)
      if (error.message.includes("verify") || error.message.includes("permissions")) {
        return new Response(JSON.stringify({ error: "Failed to verify user permissions" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Generic server error (500)
    return new Response(JSON.stringify({ error: "Failed to fetch vacation request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
