/**
 * Authentication form validation schemas
 * Used for client-side validation of login, forgot password, and set password forms
 */

import { z } from "zod";

/**
 * Schema for login form validation
 */
export const loginFormSchema = z.object({
  email: z
    .string({
      required_error: "Adres e-mail jest wymagany",
    })
    .email("Nieprawidłowy format adresu e-mail"),

  password: z
    .string({
      required_error: "Hasło jest wymagane",
    })
    .min(1, "Hasło jest wymagane"),
});

/**
 * Schema for forgot password form validation
 */
export const forgotPasswordFormSchema = z.object({
  email: z
    .string({
      required_error: "Adres e-mail jest wymagany",
    })
    .email("Nieprawidłowy format adresu e-mail"),
});

/**
 * Schema for set password form validation
 */
export const setPasswordFormSchema = z
  .object({
    password: z
      .string({
        required_error: "Hasło jest wymagane",
      })
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Hasło musi zawierać co najmniej jedną małą literę, jedną wielką literę i jedną cyfrę"
      ),

    confirmPassword: z.string({
      required_error: "Potwierdzenie hasła jest wymagane",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

/**
 * Schema for register form validation
 */
export const registerFormSchema = z
  .object({
    firstName: z
      .string({
        required_error: "Imię jest wymagane",
      })
      .min(2, "Imię musi mieć co najmniej 2 znaki")
      .max(50, "Imię może mieć maksymalnie 50 znaków"),

    lastName: z
      .string({
        required_error: "Nazwisko jest wymagane",
      })
      .min(2, "Nazwisko musi mieć co najmniej 2 znaki")
      .max(50, "Nazwisko może mieć maksymalnie 50 znaków"),

    email: z
      .string({
        required_error: "Adres e-mail jest wymagany",
      })
      .email("Nieprawidłowy format adresu e-mail"),

    password: z
      .string({
        required_error: "Hasło jest wymagane",
      })
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Hasło musi zawierać co najmniej jedną małą literę, jedną wielką literę i jedną cyfrę"
      ),

    confirmPassword: z.string({
      required_error: "Potwierdzenie hasła jest wymagane",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

/**
 * Type inferences from schemas
 */
export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;
export type SetPasswordFormValues = z.infer<typeof setPasswordFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
