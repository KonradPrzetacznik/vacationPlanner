/**
 * Settings Service
 * Handles business logic for global settings operations
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type {
  GetAllSettingsResponseDTO,
  GetSettingResponseDTO,
  UpdateSettingDTO,
  UpdateSettingResponseDTO,
  SettingDTO,
} from "@/types";

/**
 * Helper function to map database row to DTO
 * Converts snake_case to camelCase and JSONB to number
 */
function mapToSettingDTO(row: {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
}): SettingDTO {
  // Parse JSONB value to number
  let numericValue: number;

  if (typeof row.value === "number") {
    numericValue = row.value;
  } else if (typeof row.value === "string") {
    numericValue = parseInt(row.value, 10);
    if (isNaN(numericValue)) {
      throw new Error(`Invalid numeric value for setting ${row.key}`);
    }
  } else {
    throw new Error(`Invalid value type for setting ${row.key}`);
  }

  return {
    key: row.key,
    value: numericValue,
    description: row.description,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all global settings
 *
 * @param supabase - Supabase client from context.locals
 * @returns Promise with all settings
 * @throws Error if database query fails
 */
export async function getAllSettings(
  supabase: SupabaseClient
): Promise<GetAllSettingsResponseDTO> {
  // Fetch all settings ordered by key
  const { data: settings, error: queryError } = await supabase
    .from("settings")
    .select("*")
    .order("key", { ascending: true });

  if (queryError) {
    console.error("[SettingsService] Failed to fetch settings:", queryError);
    throw new Error("Failed to fetch settings");
  }

  if (!settings || settings.length === 0) {
    // Return empty array if no settings found
    return { data: [] };
  }

  // Map to DTOs
  const settingsList: SettingDTO[] = settings.map(mapToSettingDTO);

  return { data: settingsList };
}

/**
 * Get specific setting by key
 *
 * @param supabase - Supabase client from context.locals
 * @param key - Setting key
 * @returns Promise with setting data
 * @throws Error if setting not found or query fails
 */
export async function getSettingByKey(
  supabase: SupabaseClient,
  key: string
): Promise<GetSettingResponseDTO> {
  // Fetch setting by primary key
  const { data: setting, error: queryError } = await supabase
    .from("settings")
    .select("*")
    .eq("key", key)
    .single();

  if (queryError) {
    // Check if error is "not found"
    if (queryError.code === "PGRST116") {
      throw new Error("Setting not found");
    }
    console.error("[SettingsService] Failed to fetch setting:", queryError);
    throw new Error("Failed to fetch setting");
  }

  if (!setting) {
    throw new Error("Setting not found");
  }

  // Map to DTO
  return mapToSettingDTO(setting);
}

/**
 * Update setting value
 * Only HR users can update settings
 * Additional validation for team_occupancy_threshold (must be 0-100)
 *
 * @param supabase - Supabase client from context.locals
 * @param currentUserRole - Role of the current user (for RBAC)
 * @param key - Setting key to update
 * @param data - Update data (value)
 * @returns Promise with updated setting
 * @throws Error if unauthorized, not found, invalid value, or query fails
 */
export async function updateSetting(
  supabase: SupabaseClient,
  currentUserRole: "ADMINISTRATOR" | "HR" | "EMPLOYEE",
  key: string,
  data: UpdateSettingDTO
): Promise<UpdateSettingResponseDTO> {
  // 1. Authorization: Only HR can update settings
  if (currentUserRole !== "HR") {
    throw new Error("Only HR users can update settings");
  }

  // 2. Check if setting exists
  const { data: existingSetting, error: fetchError } = await supabase
    .from("settings")
    .select("*")
    .eq("key", key)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      throw new Error("Setting not found");
    }
    console.error("[SettingsService] Failed to fetch setting:", fetchError);
    throw new Error("Failed to fetch setting");
  }

  if (!existingSetting) {
    throw new Error("Setting not found");
  }

  // 3. Additional validation based on setting key
  if (key === "team_occupancy_threshold") {
    if (data.value < 0 || data.value > 100) {
      throw new Error(
        "Invalid value for team_occupancy_threshold: must be between 0 and 100"
      );
    }
  }

  // 4. Update setting value
  const { data: updatedSetting, error: updateError } = await supabase
    .from("settings")
    .update({
      value: data.value,
      updated_at: new Date().toISOString(),
    })
    .eq("key", key)
    .select("*")
    .single();

  if (updateError) {
    console.error("[SettingsService] Failed to update setting:", updateError);
    throw new Error("Failed to update setting");
  }

  if (!updatedSetting) {
    throw new Error("Failed to update setting");
  }

  // 5. Map to DTO and return
  return mapToSettingDTO(updatedSetting);
}

