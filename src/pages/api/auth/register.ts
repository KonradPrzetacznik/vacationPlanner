/**
 * Register API Endpoint
 * Handles user registration
 * POST /api/auth/register
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "@/db/supabase.client";

// Disable prerendering for this API route
export const prerender = false;

// Request body validation schema
const registerSchema = z.object({
  firstName: z.string().min(2, "Imię musi mieć co najmniej 2 znaki").max(50, "Imię może mieć maksymalnie 50 znaków"),
  lastName: z
    .string()
    .min(2, "Nazwisko musi mieć co najmniej 2 znaki")
    .max(50, "Nazwisko może mieć maksymalnie 50 znaków"),
  email: z.string().email("Nieprawidłowy format adresu e-mail"),
  password: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Hasło musi zawierać co najmniej jedną małą literę, jedną wielką literę i jedną cyfrę"
    ),
});

/**
 * POST handler for registration
 * Creates a new user account and sends confirmation email
 */
export const POST: APIRoute = async ({ request, cookies, url }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

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

    const { firstName, lastName, email, password } = validationResult.data;

    // Create Supabase client with SSR support
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Get the base URL for the redirect
    const baseUrl = url.origin;
    const redirectTo = `${baseUrl}/set-password`;

    // Attempt to sign up user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      // Handle specific error cases
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        return new Response(
          JSON.stringify({
            error: "Użytkownik z tym adresem e-mail już istnieje",
          }),
          {
            status: 409,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Generic error
      return new Response(
        JSON.stringify({
          error: error.message || "Wystąpił błąd podczas rejestracji",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Check if user was created successfully
    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: "Nie udało się utworzyć konta",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create profile in profiles table
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.toLowerCase(),
      role: "EMPLOYEE", // Default role for self-registered users
    });

    if (profileError) {
      // If profile creation fails, we should clean up the auth user
      // However, we cannot delete the user from auth.users without admin privileges
      // The user will exist in auth.users but won't be able to use the system without a profile
      // Log the error for monitoring
      return new Response(
        JSON.stringify({
          error: "Nie udało się utworzyć profilu użytkownika. Skontaktuj się z administratorem.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Success - return success message
    return new Response(
      JSON.stringify({
        message: "Konto zostało utworzone. Sprawdź swoją skrzynkę e-mail, aby potwierdzić adres.",
        user: {
          id: data.user.id,
          email: data.user.email,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        },
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch {
    // Handle unexpected errors
    return new Response(
      JSON.stringify({
        error: "Wystąpił nieoczekiwany błąd podczas rejestracji",
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
