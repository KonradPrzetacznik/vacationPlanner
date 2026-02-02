/**
 * GET /api/settings
 * Endpoint for retrieving all global settings
 *
 * Authorization: Using DEFAULT_USER_ID for development
 * - ADMINISTRATOR: Can view all settings
 * - HR: Can view all settings
 * - EMPLOYEE: Can view all settings
 *
 * NOTE: Full authentication will be implemented later
 */

import type { APIRoute } from "astro";
import { getAllSettings, updateSetting } from "@/lib/services/settings.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { z } from "zod";
import type { SettingDTO } from "@/types";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET handler for /api/settings
 * Retrieves all global settings
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // 1. Use DEFAULT_USER_ID for development (auth will be implemented later)
    // 2. Verify user exists (basic authentication check)
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

    // 3. Call service to get all settings
    const result = await getAllSettings(locals.supabase);

    // 4. Return successful response (200 OK)
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Generic internal server error (500)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST handler for /api/settings
 * Updates multiple settings at once
 *
 * Authorization: Only HR users can update settings
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Use DEFAULT_USER_ID for development
    const { data: currentUserProfile, error: profileError } = await locals.supabase
      .from("profiles")
      .select("id, role")
      .eq("id", DEFAULT_USER_ID)
      .single();

    if (profileError || !currentUserProfile) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Parse request body
    const body = await request.json();

    // 3. Validate request body schema
    const settingsSchema = z.array(
      z.object({
        key: z.string(),
        value: z.number(),
      })
    );

    const validationResult = settingsSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: validationResult.error.issues,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const settingsToUpdate = validationResult.data;

    // 4. Update each setting
    const updatedSettings: SettingDTO[] = [];
    for (const setting of settingsToUpdate) {
      try {
        const updated = await updateSetting(
          locals.supabase,
          currentUserProfile.role as "ADMINISTRATOR" | "HR" | "EMPLOYEE",
          setting.key,
          { value: setting.value }
        );
        updatedSettings.push(updated);
      } catch (error) {
        // Handle specific errors from updateSetting
        if (error instanceof Error) {
          if (error.message.includes("Only HR and ADMINISTRATOR")) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }
          if (error.message === "Setting not found") {
            return new Response(JSON.stringify({ error: `Setting ${setting.key} not found` }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }
          if (error.message.includes("Invalid value")) {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
        }
        throw error; // Re-throw for generic error handling
      }
    }

    // 5. Return successful response
    return new Response(JSON.stringify({ data: updatedSettings }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
