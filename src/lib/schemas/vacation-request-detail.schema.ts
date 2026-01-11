/**
 * Zod validation schemas for vacation request detail endpoints
 * Includes schemas for GET /api/vacation-requests/:id and POST /api/vacation-requests
 */

import { z } from "zod";

/**
 * Schema for validating UUID format in vacation request ID parameter
 */
export const getVacationRequestByIdParamsSchema = z.object({
  id: z.string().uuid("Invalid vacation request ID format"),
});

/**
 * Helper function to check if a date is a weekend (Saturday or Sunday)
 */
const isWeekend = (dateString: string): boolean => {
  const date = new Date(dateString);
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
};

/**
 * Helper function to check if a date is in the past
 */
const isInPast = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Schema for validating vacation request creation payload
 * Validates date formats, business rules and constraints
 */
export const createVacationRequestSchema = z
  .object({
    startDate: z
      .string({
        required_error: "Start date is required",
        invalid_type_error: "Start date must be a string",
      })
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Start date must be in YYYY-MM-DD format"
      )
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Start date must be a valid date",
      })
      .refine((date) => !isInPast(date), {
        message: "Start date cannot be in the past",
      })
      .refine((date) => !isWeekend(date), {
        message: "Start date cannot fall on a weekend",
      }),
    endDate: z
      .string({
        required_error: "End date is required",
        invalid_type_error: "End date must be a string",
      })
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "End date must be in YYYY-MM-DD format"
      )
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "End date must be a valid date",
      })
      .refine((date) => !isWeekend(date), {
        message: "End date cannot fall on a weekend",
      }),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  });

/**
 * Type inference for validated create vacation request data
 */
export type CreateVacationRequestInput = z.infer<typeof createVacationRequestSchema>;

/**
 * Type inference for validated vacation request ID param
 */
export type GetVacationRequestByIdParams = z.infer<typeof getVacationRequestByIdParamsSchema>;

