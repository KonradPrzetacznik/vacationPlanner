/**
 * Login API Endpoint
 * Handles user authentication with email and password
 * POST /api/auth/login
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "@/db/supabase.client";

// Disable prerendering for this API route
export const prerender = false;

// Request body validation schema
const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu e-mail"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

/**
 * POST handler for login
 * Authenticates user and sets session cookies
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

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

    const { email, password } = validationResult.data;

    // Create Supabase client with SSR support
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt to sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Return authentication error
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy e-mail lub hasło",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Check if user has profile in database
    const { data: profile } = await supabase.from("profiles").select("id, role").eq("id", data.user.id).single();

    if (!profile) {
      // If profile doesn't exist, sign out and return error
      await supabase.auth.signOut();
      return new Response(
        JSON.stringify({
          error: "Konto użytkownika nie zostało poprawnie skonfigurowane. Skontaktuj się z administratorem.",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Success - return user data
    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
          role: profile.role,
        },
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
        error: "Wystąpił błąd podczas logowania",
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
