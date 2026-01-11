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
  year: z.coerce.number()
    .int("Year must be an integer")
    .min(2000, "Year must be at least 2000")
    .max(2100, "Year must be at most 2100"),
});

/**
 * Year query parameter validation (optional)
 * Used for filtering allowances by year
 */
export const yearQuerySchema = z.object({
  year: z.coerce.number()
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
  year: z.coerce.number()
    .int("Year must be an integer")
    .min(2000, "Year must be at least 2000")
    .max(2100, "Year must be at most 2100"),
});

