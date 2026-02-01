/**
 * Zod schemas for vacation requests API validation
 */
import { z } from "zod";

/**
 * Vacation request status enum
 */
export const VacationRequestStatusSchema = z.enum(["SUBMITTED", "APPROVED", "REJECTED", "CANCELLED"]);

/**
 * Date string validation (YYYY-MM-DD format)
 */
export const DateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD")
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, "Invalid date");

/**
 * UUID validation
 */
export const UuidSchema = z.string().uuid("Invalid UUID format");

/**
 * Schema for GET /api/vacation-requests query parameters
 */
export const GetVacationRequestsQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must be at most 100")
    .default(50)
    .optional(),
  offset: z.coerce.number().int().min(0, "Offset must be non-negative").default(0).optional(),
  status: z
    .union([VacationRequestStatusSchema, z.array(VacationRequestStatusSchema)])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .optional(),
  userId: UuidSchema.optional(),
  teamId: UuidSchema.optional(),
  startDate: DateStringSchema.optional(),
  endDate: DateStringSchema.optional(),
});

export type GetVacationRequestsQuerySchemaType = z.infer<typeof GetVacationRequestsQuerySchema>;

/**
 * Schema for vacation request ID parameter
 */
export const VacationRequestIdParamSchema = z.object({
  id: UuidSchema,
});

export type VacationRequestIdParamSchemaType = z.infer<typeof VacationRequestIdParamSchema>;

/**
 * Schema for POST /api/vacation-requests/:id/approve body
 */
export const ApproveVacationRequestSchema = z.object({
  acknowledgeThresholdWarning: z.boolean().optional().default(false),
});

export type ApproveVacationRequestSchemaType = z.infer<typeof ApproveVacationRequestSchema>;

/**
 * Schema for POST /api/vacation-requests/:id/reject body
 */
export const RejectVacationRequestSchema = z.object({
  reason: z.string().min(1, "Reason is required").max(500, "Reason must be at most 500 characters"),
});

export type RejectVacationRequestSchemaType = z.infer<typeof RejectVacationRequestSchema>;
