/**
 * PATCH /api/vacation-allowances/:id
 * Endpoint for updating existing vacation allowances
 *
 * Authorization: Using DEFAULT_USER_ID for development
 * - HR: Can update vacation allowances for any user
 * - ADMINISTRATOR: Cannot update vacation allowances
 * - EMPLOYEE: Cannot update vacation allowances
 *
 * NOTE: Full authentication will be implemented later
 */

import type { APIRoute } from "astro";
import { updateVacationAllowance } from "@/lib/services/vacation-allowances.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import {
  vacationAllowanceIdParamSchema,
  updateVacationAllowanceSchema,
} from "@/lib/schemas/vacation-allowances.schema";

// Disable prerendering for this API route
export const prerender = false;

/**
 * PATCH handler for /api/vacation-allowances/:id
 * Updates an existing vacation allowance
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Validate path parameter (id)
    const paramValidationResult = vacationAllowanceIdParamSchema.safeParse(params);

    if (!paramValidationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid vacation allowance ID format",
          details: paramValidationResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { id: allowanceId } = paramValidationResult.data;

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

    const currentUserRole = currentUserProfile.role;

    // 4. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validationResult = updateVacationAllowanceSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: validationResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validatedData = validationResult.data;

    // 5. Call service to update vacation allowance
    const startTime = Date.now();
    const result = await updateVacationAllowance(
      locals.supabase,
      currentUserId,
      currentUserRole,
      allowanceId,
      validatedData
    );
    const duration = Date.now() - startTime;

    // Log slow operations
    if (duration > 1000) {
      // Log slow operation
    }

    // 6. Return successful response (200 OK)
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle known error types
    if (error instanceof Error) {
      // Authorization errors (403 Forbidden)
      if (error.message.includes("Only HR users")) {
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
    }

    // Generic internal server error (500)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
