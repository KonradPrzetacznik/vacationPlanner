/**
 * API Endpoint: POST /api/vacation-requests/:id/cancel
 * Cancel a vacation request (Employee - owner only)
 */
import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { VacationRequestIdParamSchema } from "@/lib/schemas/vacation-requests.schema";
import { cancelVacationRequest } from "@/lib/services/vacation-requests.service";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const supabase = context.locals.supabase;

    // 1. Extract currentUserId (DEFAULT_USER_ID for development)
    const currentUserId = DEFAULT_USER_ID;

    // 2. Validate request ID parameter
    const paramValidation = VacationRequestIdParamSchema.safeParse({
      id: context.params.id,
    });

    if (!paramValidation.success) {
      return new Response(JSON.stringify({ error: "Invalid vacation request ID format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = paramValidation.data;

    // 2. Cancel vacation request via service
    const response = await cancelVacationRequest(supabase, currentUserId, id);

    // 4. Return success response
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to cancel vacation request";

    // Determine status code based on error message
    let statusCode = 500;

    if (errorMessage.includes("not found")) {
      statusCode = 404;
    } else if (errorMessage.includes("can only cancel your own") || errorMessage.includes("not authorized")) {
      statusCode = 403;
    } else if (
      errorMessage.includes("Only SUBMITTED or APPROVED") ||
      errorMessage.includes("Cannot cancel vacation that started") ||
      errorMessage.includes("Invalid")
    ) {
      statusCode = 400;
    } else if (errorMessage.includes("Not authenticated")) {
      statusCode = 401;
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
};
