/**
 * Zod validation schemas for user management endpoints
 *
 * These schemas validate input data for user creation, updates, and ID parameters.
 * They ensure data integrity and provide clear validation error messages.
 */

import { z } from "zod";

/**
 * Schema for creating a new user
 * Validates all required fields for user creation
 */
export const createUserSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be at most 100 characters")
    .trim(),

  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be at most 100 characters")
    .trim(),

  email: z
    .string()
    .email("Invalid email format")
    .toLowerCase()
    .trim(),

  role: z
    .enum(["ADMINISTRATOR", "HR", "EMPLOYEE"])
    .optional()
    .default("EMPLOYEE"),

  temporaryPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters"),
});

/**
 * Schema for updating user information
 * All fields are optional, but at least one must be provided
 */
export const updateUserSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name cannot be empty")
      .max(100, "First name must be at most 100 characters")
      .trim()
      .optional(),

    lastName: z
      .string()
      .min(1, "Last name cannot be empty")
      .max(100, "Last name must be at most 100 characters")
      .trim()
      .optional(),

    role: z
      .enum(["ADMINISTRATOR", "HR", "EMPLOYEE"])
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

/**
 * Schema for validating user ID parameter
 * Ensures the ID is a valid UUID
 */
export const userIdSchema = z.string().uuid("Invalid user ID format");

/**
 * Type exports for use in handlers and services
 */
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

