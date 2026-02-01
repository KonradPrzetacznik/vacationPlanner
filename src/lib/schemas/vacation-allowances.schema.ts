/**
 * Zod validation schemas for vacation allowances endpoints
 *
 * Schemas for:
 * - GET /api/users/:userId/vacation-allowances
 * - GET /api/users/:userId/vacation-allowances/:year
 */

import { z } from "zod";

/**
 * User ID path parameter validation
 * Must be a valid UUID
 */
export const userIdParamSchema = z.object({
  userId: z.string().uuid("Invalid UUID format"),
});

/**
 * Year path parameter validation
 * Must be an integer between 2000 and 2100
 */
export const yearParamSchema = z.object({
  year: z.coerce
    .number()
    .int("Year must be an integer")
    .min(2000, "Year must be at least 2000")
    .max(2100, "Year must be at most 2100"),
});

/**
 * Year query parameter validation (optional)
 * Used for filtering allowances by year
 */
export const yearQuerySchema = z.object({
  year: z.coerce
    .number()
    .int("Year must be an integer")
    .min(2000, "Year must be at least 2000")
    .max(2100, "Year must be at most 2100")
    .optional(),
});

/**
 * Combined schema for GET /api/users/:userId/vacation-allowances
 * Validates both path and query parameters
 */
export const getVacationAllowancesParamsSchema = userIdParamSchema;
export const getVacationAllowancesQuerySchema = yearQuerySchema;

/**
 * Combined schema for GET /api/users/:userId/vacation-allowances/:year
 * Validates both userId and year path parameters
 */
export const getVacationAllowanceByYearParamsSchema = z.object({
  userId: z.string().uuid("Invalid UUID format"),
  year: z.coerce
    .number()
    .int("Year must be an integer")
    .min(2000, "Year must be at least 2000")
    .max(2100, "Year must be at most 2100"),
});

/**
 * Vacation allowance ID path parameter validation
 * Used for PATCH /api/vacation-allowances/:id
 */
export const vacationAllowanceIdParamSchema = z.object({
  id: z.string().uuid("Invalid UUID format"),
});

/**
 * Create vacation allowance request body validation
 * Used for POST /api/vacation-allowances
 */
export const createVacationAllowanceSchema = z.object({
  userId: z.string().uuid("User ID must be a valid UUID"),
  year: z
    .number()
    .int("Year must be an integer")
    .min(2000, "Year must be at least 2000")
    .max(2100, "Year must be at most 2100"),
  totalDays: z.number().int("Total days must be an integer").min(0, "Total days cannot be negative"),
  carryoverDays: z.number().int("Carryover days must be an integer").min(0, "Carryover days cannot be negative"),
});

/**
 * Update vacation allowance request body validation
 * Used for PATCH /api/vacation-allowances/:id
 * At least one field must be provided
 */
export const updateVacationAllowanceSchema = z
  .object({
    totalDays: z.number().int("Total days must be an integer").min(0, "Total days cannot be negative").optional(),
    carryoverDays: z
      .number()
      .int("Carryover days must be an integer")
      .min(0, "Carryover days cannot be negative")
      .optional(),
  })
  .refine((data) => data.totalDays !== undefined || data.carryoverDays !== undefined, {
    message: "At least one field (totalDays or carryoverDays) must be provided",
  });
