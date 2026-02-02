/**
 * Logout API Endpoint
 * Handles user logout and session termination
 * POST /api/auth/logout
 */

import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";

// Disable prerendering for this API route
export const prerender = false;

/**
 * POST handler for logout
 * Signs out user and clears session cookies
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase client with SSR support
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Sign out user
    const { error } = await supabase.auth.signOut();

    if (error) {
      return new Response(
        JSON.stringify({
          error: "Wystąpił błąd podczas wylogowywania",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Success
    return new Response(
      JSON.stringify({
        message: "Wylogowano pomyślnie",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch {
    // Handle unexpected errors
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas wylogowywania",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
