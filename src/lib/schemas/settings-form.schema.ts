/**
 * Settings form validation schema
 * Used for client-side validation of settings form
 */

import { z } from "zod";

/**
 * Schema for settings form validation
 * Validates default_vacation_days (1-365) and team_occupancy_threshold (0-100)
 */
export const settingsFormSchema = z.object({
  default_vacation_days: z
    .number({
      required_error: "Domyślna liczba dni urlopowych jest wymagana",
      invalid_type_error: "Wartość musi być liczbą",
    })
    .int("Wartość musi być liczbą całkowitą")
    .min(1, "Wartość musi być większa lub równa 1")
    .max(365, "Wartość musi być mniejsza lub równa 365"),

  team_occupancy_threshold: z
    .number({
      required_error: "Próg obłożenia zespołu jest wymagany",
      invalid_type_error: "Wartość musi być liczbą",
    })
    .int("Wartość musi być liczbą całkowitą")
    .min(0, "Wartość musi być większa lub równa 0")
    .max(100, "Wartość musi być mniejsza lub równa 100"),
});

/**
 * Type inference from schema
 */
export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
