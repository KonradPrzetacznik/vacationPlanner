import { z } from "zod";

// ============================================================================
// Query Parameters Schemas
// ============================================================================

/**
 * Schema for validating Get Teams query parameters
 * Validates limit, offset, and includeMemberCount parameters
 */
export const getTeamsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().int().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0)),
  includeMemberCount: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .pipe(z.boolean()),
});

// ============================================================================
// Request Body Schemas
// ============================================================================

/**
 * Schema for validating Create Team request body
 * Validates team name (required, non-empty, max 100 characters)
 */
export const createTeamSchema = z.object({
  name: z
    .string()
    .min(1, "Team name is required")
    .max(100, "Team name must not exceed 100 characters")
    .trim(),
});

/**
 * Schema for validating Update Team request body
 * Validates team name (required, non-empty, max 100 characters)
 */
export const updateTeamSchema = z.object({
  name: z
    .string()
    .min(1, "Team name is required")
    .max(100, "Team name must not exceed 100 characters")
    .trim(),
});

// ============================================================================
// URL Parameters Schemas
// ============================================================================

/**
 * Schema for validating team ID in URL parameters
 * Validates UUID format
 */
export const teamIdParamSchema = z.object({
  id: z.string().uuid("Invalid team ID format"),
});

