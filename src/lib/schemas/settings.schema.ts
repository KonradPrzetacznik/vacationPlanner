import { z } from "zod";

/**
 * Setting key path parameter validation
 */
export const settingKeyParamSchema = z.object({
  key: z.string().min(1, "Setting key cannot be empty"),
});

/**
 * Update setting request body validation
 * Value must be a non-negative integer
 */
export const updateSettingSchema = z.object({
  value: z.number().int("Value must be an integer").nonnegative("Value must be non-negative"),
});
