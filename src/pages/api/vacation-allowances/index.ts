/**
 * POST /api/vacation-allowances
 * Endpoint for creating new vacation allowances
 *
 * Authorization: Using DEFAULT_USER_ID for development
 * - HR: Can create vacation allowances for any active user
 * - ADMINISTRATOR: Cannot create vacation allowances
 * - EMPLOYEE: Cannot create vacation allowances
 *
 * NOTE: Full authentication will be implemented later
 */

import type { APIRoute } from "astro";
import { createVacationAllowance } from "@/lib/services/vacation-allowances.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { createVacationAllowanceSchema } from "@/lib/schemas/vacation-allowances.schema";

// Disable prerendering for this API route
export const prerender = false;

/**
 * POST handler for /api/vacation-allowances
 * Creates a new vacation allowance for a user
 */
export const POST: APIRoute = async ({ request, locals }) => {
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
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const currentUserRole = currentUserProfile.role;

    // 3. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validationResult = createVacationAllowanceSchema.safeParse(body);

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

    // 4. Call service to create vacation allowance
    const startTime = Date.now();
    const result = await createVacationAllowance(locals.supabase, currentUserId, currentUserRole, validatedData);
    const duration = Date.now() - startTime;

    // Log slow operations
    if (duration > 1000) {
      // Log slow operation
    }

    // 5. Return successful response (201 Created)
    return new Response(JSON.stringify(result), {
      status: 201,
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
      if (error.message.includes("User not found")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Bad request errors (400)
      if (error.message.includes("already exists") || error.message.includes("deleted user")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
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
