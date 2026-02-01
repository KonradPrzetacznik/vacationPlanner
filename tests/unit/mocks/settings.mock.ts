/**
 * Mock Data for Settings
 * Provides realistic test data for settings-related unit tests
 */

import type { SettingDTO } from "@/types";

export const mockSettings = {
  defaultVacationDays: {
    key: "default_vacation_days",
    value: 26,
    description: "Default number of vacation days per year",
    updatedAt: "2026-01-01T00:00:00Z",
  },

  teamOccupancyThreshold: {
    key: "team_occupancy_threshold",
    value: 50,
    description: "Percentage threshold (0-100) for maximum team members on vacation simultaneously",
    updatedAt: "2026-01-01T00:00:00Z",
  },

  minRequestAdvanceNotice: {
    key: "min_request_advance_notice_days",
    value: 7,
    description: "Minimum number of days in advance to request vacation",
    updatedAt: "2026-01-01T00:00:00Z",
  },
} as const;

/**
 * All settings for list response
 */
export const mockAllSettings: SettingDTO[] = [
  mockSettings.defaultVacationDays as SettingDTO,
  mockSettings.teamOccupancyThreshold as SettingDTO,
  mockSettings.minRequestAdvanceNotice as SettingDTO,
];

/**
 * Mock RPC response for getting all settings
 */
export const mockSettingsRpcResponse = mockAllSettings.map((setting) => ({
  key: setting.key,
  value: setting.value,
  description: setting.description,
  updated_at: setting.updatedAt,
}));

/**
 * Mock bulk update request
 */
export const mockBulkUpdateRequest = [
  { key: "default_vacation_days", value: 28 },
  { key: "team_occupancy_threshold", value: 60 },
];

/**
 * Mock settings after bulk update
 */
export const mockSettingsAfterUpdate = mockAllSettings.map((setting) => {
  const update = mockBulkUpdateRequest.find((u) => u.key === setting.key);
  if (update) {
    return {
      ...setting,
      value: update.value,
      updatedAt: "2026-02-02T10:00:00Z",
    };
  }
  return setting;
});
