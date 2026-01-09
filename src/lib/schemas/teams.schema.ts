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

// ============================================================================
// Team Members Schemas
// ============================================================================

/**
 * Schema for validating Add Team Members request body
 * Validates array of user IDs (min 1, max 100 UUIDs)
 */
export const addTeamMembersSchema = z.object({
  userIds: z
    .array(z.string().uuid("Each user ID must be a valid UUID"))
    .min(1, "At least one user ID is required")
    .max(100, "Cannot add more than 100 members at once"),
});

/**
 * Schema for validating Remove Team Member URL parameters
 * Validates team ID and user ID in URL
 */
export const removeTeamMemberParamsSchema = z.object({
  id: z.string().uuid("Team ID must be a valid UUID"),
  userId: z.string().uuid("User ID must be a valid UUID"),
});

// ============================================================================
// Team Calendar Schemas
// ============================================================================

/**
 * Enum for vacation request statuses
 */
const vacationStatusEnum = z.enum(['SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED']);

/**
 * Schema for validating Get Team Calendar query parameters
 * Validates date ranges, month filter, and status filters
 */
export const getTeamCalendarQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD")
    .optional(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Invalid month format. Expected YYYY-MM")
    .optional(),
  includeStatus: z
    .union([
      vacationStatusEnum,
      z.array(vacationStatusEnum)
    ])
    .transform((val) => Array.isArray(val) ? val : [val])
    .optional()
})
.refine(data => {
  // month and startDate/endDate are mutually exclusive
  if (data.month && (data.startDate || data.endDate)) {
    return false;
  }
  return true;
}, {
  message: "Cannot use 'month' together with 'startDate' or 'endDate'"
})
.refine(data => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
  }
  return true;
}, {
  message: "Start date must be before or equal to end date"
})
.refine(data => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 365;
  }
  return true;
}, {
  message: "Date range cannot exceed 1 year"
});

