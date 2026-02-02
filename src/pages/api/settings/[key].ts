/**
 * GET /api/settings/:key
 * PUT /api/settings/:key
 * Endpoints for managing specific global settings
 *
 * GET Authorization: All authenticated users can view settings
 * PUT Authorization: Only HR users can update settings
 *
 * NOTE: Using DEFAULT_USER_ID for development - full auth will be implemented later
 */

import type { APIRoute } from "astro";
import { getSettingByKey, updateSetting } from "@/lib/services/settings.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { settingKeyParamSchema, updateSettingSchema } from "@/lib/schemas/settings.schema";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET handler for /api/settings/:key
 * Retrieves specific setting by key
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Validate path parameter (key)
    const paramValidationResult = settingKeyParamSchema.safeParse(params);

    if (!paramValidationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid setting key format",
          details: paramValidationResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { key } = paramValidationResult.data;

    // 2. Use DEFAULT_USER_ID for development (auth will be implemented later)
    // 3. Verify user exists (basic authentication check)
    const { data: currentUserProfile, error: profileError } = await locals.supabase
      .from("profiles")
      .select("id")
      .eq("id", DEFAULT_USER_ID)
      .single();

    if (profileError || !currentUserProfile) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Call service to get setting by key
    const result = await getSettingByKey(locals.supabase, key);

    // 5. Return successful response (200 OK)
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle known error types
    if (error instanceof Error) {
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

/**
 * PUT handler for /api/settings/:key
 * Updates specific setting value (HR only)
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Validate path parameter (key)
    const paramValidationResult = settingKeyParamSchema.safeParse(params);

    if (!paramValidationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid setting key format",
          details: paramValidationResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { key } = paramValidationResult.data;

    // 2. Use DEFAULT_USER_ID for development (auth will be implemented later)
    // 3. Get current user's role for authorization
    const { data: currentUserProfile, error: profileError } = await locals.supabase
      .from("profiles")
      .select("role")
      .eq("id", DEFAULT_USER_ID)
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

    const validationResult = updateSettingSchema.safeParse(body);

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

    // 5. Call service to update setting
    const result = await updateSetting(locals.supabase, currentUserRole, key, validatedData);

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

      // Validation errors (400 Bad Request)
      if (error.message.includes("Invalid value for")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
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
