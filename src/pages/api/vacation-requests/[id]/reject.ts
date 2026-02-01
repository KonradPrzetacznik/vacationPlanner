/**
 * API Endpoint: POST /api/vacation-requests/:id/reject
 * Reject a vacation request with reason (HR only)
 */
import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { VacationRequestIdParamSchema, RejectVacationRequestSchema } from "@/lib/schemas/vacation-requests.schema";
import { rejectVacationRequest } from "@/lib/services/vacation-requests.service";

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

    // 3. Parse and validate request body
    let requestBody;
    try {
      const text = await context.request.text();
      requestBody = text ? JSON.parse(text) : {};
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const bodyValidation = RejectVacationRequestSchema.safeParse(requestBody);

    if (!bodyValidation.success) {
      const errorMessage = bodyValidation.error.errors[0]?.message || "Invalid request body";
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { reason } = bodyValidation.data;

    // 4. Call rejectVacationRequest service
    const response = await rejectVacationRequest(supabase, currentUserId, id, reason);

    // 5. Return success response
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[RejectVacationRequestEndpoint] Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Failed to reject vacation request";

    // Determine status code based on error message
    let statusCode = 500;

    if (errorMessage.includes("not found")) {
      statusCode = 404;
    } else if (
      errorMessage.includes("Only HR") ||
      errorMessage.includes("cannot reject your own") ||
      errorMessage.includes("not authorized")
    ) {
      statusCode = 403;
    } else if (
      errorMessage.includes("must be in") ||
      errorMessage.includes("Reason is required") ||
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
