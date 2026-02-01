/**
 * Forgot Password API Endpoint
 * Handles password reset request
 * POST /api/auth/forgot-password
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "@/db/supabase.client";

// Disable prerendering for this API route
export const prerender = false;

// Request body validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu e-mail"),
});

/**
 * POST handler for forgot password
 * Sends password reset email to user
 */
export const POST: APIRoute = async ({ request, cookies, url }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = forgotPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: validationResult.error.errors[0].message,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { email } = validationResult.data;

    // Create Supabase client with SSR support
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Get the base URL for the redirect
    const baseUrl = url.origin;
    const redirectTo = `${baseUrl}/set-password`;

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    // Always return success to prevent email enumeration
    // (don't reveal whether email exists in database)
    if (error) {
      console.error("Password reset error:", error);
    }

    return new Response(
      JSON.stringify({
        message: "Jeśli podany adres e-mail istnieje w systemie, wysłaliśmy na niego link do resetowania hasła",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // Handle unexpected errors
    console.error("Forgot password error:", error);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas wysyłania linku do resetowania hasła",
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
