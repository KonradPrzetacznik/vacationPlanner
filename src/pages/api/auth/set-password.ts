/**
 * Set Password API Endpoint
 * Handles password setting/reset for both invite and recovery flows
 * POST /api/auth/set-password
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "@/db/supabase.client";

// Disable prerendering for this API route
export const prerender = false;

// Request body validation schema
const setPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Hasło musi zawierać co najmniej jedną małą literę, jedną wielką literę i jedną cyfrę"
    ),
  token: z.string().min(1, "Token jest wymagany"),
  type: z.enum(["recovery", "invite"]).optional().default("recovery"),
});

/**
 * POST handler for set password
 * Updates user password after verifying token
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = setPasswordSchema.safeParse(body);

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

    const { password, token, type } = validationResult.data;

    // Create Supabase client with SSR support
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Verify OTP token (works for both recovery and invite)
    const { data: verifyData, error: verifyError } =
      await supabase.auth.verifyOtp({
        token_hash: token,
        type: type,
      });

    if (verifyError || !verifyData.user) {
      return new Response(
        JSON.stringify({
          error: "Token jest nieprawidłowy lub wygasł",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Update user password
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      console.error("Password update error:", updateError);
      return new Response(
        JSON.stringify({
          error: "Nie udało się ustawić hasła",
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
        message: "Hasło zostało pomyślnie ustawione",
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
    console.error("Set password error:", error);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas ustawiania hasła",
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
