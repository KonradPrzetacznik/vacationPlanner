/**
 * Unit Tests for Settings Service
 * Tests: getAllSettings, getSettingByKey, updateSetting
 *
 * Note: These are partial unit tests that test the core logic.
 * Additional tests from bash API tests in /tests/api/ have been refactored
 * into these service-level unit tests.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAllSettings, getSettingByKey, updateSetting } from "@/lib/services/settings.service";
import type { SupabaseClient } from "@/db/supabase.client";

// Mock Supabase client
const createMockSupabaseClient = () => {
  return {
    from: vi.fn(),
  } as unknown as SupabaseClient;
};

describe("Settings Service - getAllSettings", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  it("should return all settings successfully", async () => {
    // Arrange
    const mockSettings = [
      {
        key: "default_vacation_days",
        value: 26,
        description: "Default number of vacation days per year",
        updated_at: "2026-01-11T21:25:34.236524+00:00",
      },
      {
        key: "team_occupancy_threshold",
        value: 50,
        description: "Percentage threshold (0-100) for maximum team members on vacation simultaneously",
        updated_at: "2026-01-11T21:25:34.236524+00:00",
      },
    ];

    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockResolvedValue({
      data: mockSettings,
      error: null,
    });

    vi.mocked(mockSupabase.from).mockReturnValue({
      select: mockSelect,
      order: mockOrder,
    } as any);

    mockSelect.mockReturnValue({
      order: mockOrder,
    });

    // Act
    const result = await getAllSettings(mockSupabase);

    // Assert
    expect(mockSupabase.from).toHaveBeenCalledWith("settings");
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockOrder).toHaveBeenCalledWith("key", { ascending: true });

    expect(result).toEqual({
      data: [
        {
          key: "default_vacation_days",
          value: 26,
          description: "Default number of vacation days per year",
          updatedAt: "2026-01-11T21:25:34.236524+00:00",
        },
        {
          key: "team_occupancy_threshold",
          value: 50,
          description: "Percentage threshold (0-100) for maximum team members on vacation simultaneously",
          updatedAt: "2026-01-11T21:25:34.236524+00:00",
        },
      ],
    });
  });

  it("should return empty array when no settings exist", async () => {
    // Arrange
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    vi.mocked(mockSupabase.from).mockReturnValue({
      select: mockSelect,
      order: mockOrder,
    } as any);

    mockSelect.mockReturnValue({
      order: mockOrder,
    });

    // Act
    const result = await getAllSettings(mockSupabase);

    // Assert
    expect(result).toEqual({
      data: [],
    });
  });

  it("should throw error when database query fails", async () => {
    // Arrange
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Database connection failed", code: "DB_ERROR" },
    });

    vi.mocked(mockSupabase.from).mockReturnValue({
      select: mockSelect,
      order: mockOrder,
    } as any);

    mockSelect.mockReturnValue({
      order: mockOrder,
    });

    // Act & Assert
    await expect(getAllSettings(mockSupabase)).rejects.toThrow("Failed to fetch settings");
  });

  it("should handle numeric value as string", async () => {
    // Arrange
    const mockSettings = [
      {
        key: "default_vacation_days",
        value: "26", // String instead of number
        description: "Default number of vacation days per year",
        updated_at: "2026-01-11T21:25:34.236524+00:00",
      },
    ];

    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockResolvedValue({
      data: mockSettings,
      error: null,
    });

    vi.mocked(mockSupabase.from).mockReturnValue({
      select: mockSelect,
      order: mockOrder,
    } as any);

    mockSelect.mockReturnValue({
      order: mockOrder,
    });

    // Act
    const result = await getAllSettings(mockSupabase);

    // Assert
    expect(result.data[0].value).toBe(26);
    expect(typeof result.data[0].value).toBe("number");
  });

  it("should verify setting structure has all required fields", async () => {
    // Arrange
    const mockSettings = [
      {
        key: "default_vacation_days",
        value: 26,
        description: "Default number of vacation days per year",
        updated_at: "2026-01-11T21:25:34.236524+00:00",
      },
    ];

    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockResolvedValue({
      data: mockSettings,
      error: null,
    });

    vi.mocked(mockSupabase.from).mockReturnValue({
      select: mockSelect,
      order: mockOrder,
    } as any);

    mockSelect.mockReturnValue({
      order: mockOrder,
    });

    // Act
    const result = await getAllSettings(mockSupabase);

    // Assert
    const setting = result.data[0];
    expect(setting).toHaveProperty("key");
    expect(setting).toHaveProperty("value");
    expect(setting).toHaveProperty("description");
    expect(setting).toHaveProperty("updatedAt");

    expect(typeof setting.key).toBe("string");
    expect(typeof setting.value).toBe("number");
    expect(typeof setting.updatedAt).toBe("string");
  });
});

describe("Settings Service - getSettingByKey", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  it("should return specific setting by key", async () => {
    // Arrange
    const mockSetting = {
      key: "default_vacation_days",
      value: 26,
      description: "Default number of vacation days per year",
      updated_at: "2026-01-11T21:25:34.236524+00:00",
    };

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: mockSetting,
      error: null,
    });

    vi.mocked(mockSupabase.from).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    } as any);

    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      single: mockSingle,
    });

    // Act
    const result = await getSettingByKey(mockSupabase, "default_vacation_days");

    // Assert
    expect(mockSupabase.from).toHaveBeenCalledWith("settings");
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockEq).toHaveBeenCalledWith("key", "default_vacation_days");

    expect(result).toEqual({
      key: "default_vacation_days",
      value: 26,
      description: "Default number of vacation days per year",
      updatedAt: "2026-01-11T21:25:34.236524+00:00",
    });
  });

  it("should throw error when setting not found", async () => {
    // Arrange
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "Not found" },
    });

    vi.mocked(mockSupabase.from).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    } as any);

    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      single: mockSingle,
    });

    // Act & Assert
    await expect(getSettingByKey(mockSupabase, "non_existent_key")).rejects.toThrow("Setting not found");
  });
});

describe("Settings Service - updateSetting", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  it("should update setting successfully", async () => {
    // Arrange
    const existingSetting = {
      key: "default_vacation_days",
      value: 26,
      description: "Default number of vacation days per year",
      updated_at: "2026-01-11T21:25:34.236524+00:00",
    };

    const updatedSetting = {
      key: "default_vacation_days",
      value: 30,
      description: "Default number of vacation days per year",
      updated_at: "2026-02-01T10:00:00.000000+00:00",
    };

    // Mock from - będzie wywołany 2 razy (raz dla check, raz dla update)
    const mockFrom = vi.fn();
    mockSupabase.from = mockFrom;

    // Mock łańcucha dla sprawdzenia istnienia (pierwsze wywołanie from)
    const mockSelectCheck = vi.fn().mockReturnThis();
    const mockEqCheck = vi.fn().mockReturnThis();
    const mockSingleCheck = vi.fn().mockResolvedValue({
      data: existingSetting,
      error: null,
    });

    mockEqCheck.mockReturnValue({
      single: mockSingleCheck,
    });

    mockSelectCheck.mockReturnValue({
      eq: mockEqCheck,
    });

    // Mock łańcucha dla update (drugie wywołanie from)
    const mockUpdate = vi.fn().mockReturnThis();
    const mockEqUpdate = vi.fn().mockReturnThis();
    const mockSelectUpdate = vi.fn().mockReturnThis();
    const mockSingleUpdate = vi.fn().mockResolvedValue({
      data: updatedSetting,
      error: null,
    });

    mockSelectUpdate.mockReturnValue({
      single: mockSingleUpdate,
    });

    mockEqUpdate.mockReturnValue({
      select: mockSelectUpdate,
    });

    mockUpdate.mockReturnValue({
      eq: mockEqUpdate,
    });

    // Pierwsze wywołanie from - sprawdzenie istnienia
    // Drugie wywołanie from - update
    mockFrom
      .mockReturnValueOnce({
        select: mockSelectCheck,
      })
      .mockReturnValueOnce({
        update: mockUpdate,
      });

    // Act
    const result = await updateSetting(mockSupabase, "HR", "default_vacation_days", { value: 30 });

    // Assert
    expect(result).toEqual({
      key: "default_vacation_days",
      value: 30,
      description: "Default number of vacation days per year",
      updatedAt: "2026-02-01T10:00:00.000000+00:00",
    });
  });

  it("should throw error when user is not authorized", async () => {
    // Act & Assert
    await expect(updateSetting(mockSupabase, "EMPLOYEE", "default_vacation_days", { value: 30 })).rejects.toThrow(
      "Only HR and ADMINISTRATOR users can update settings"
    );
  });

  it("should throw error when update fails", async () => {
    // Arrange
    const existingSetting = {
      key: "default_vacation_days",
      value: 26,
      description: "Default number of vacation days per year",
      updated_at: "2026-01-11T21:25:34.236524+00:00",
    };

    // Mock from - będzie wywołany 2 razy
    const mockFrom = vi.fn();
    mockSupabase.from = mockFrom;

    // Mock łańcucha dla sprawdzenia istnienia (pierwsze wywołanie from) - sukces
    const mockSelectCheck = vi.fn().mockReturnThis();
    const mockEqCheck = vi.fn().mockReturnThis();
    const mockSingleCheck = vi.fn().mockResolvedValue({
      data: existingSetting,
      error: null,
    });

    mockEqCheck.mockReturnValue({
      single: mockSingleCheck,
    });

    mockSelectCheck.mockReturnValue({
      eq: mockEqCheck,
    });

    // Mock łańcucha dla update (drugie wywołanie from) - błąd
    const mockUpdate = vi.fn().mockReturnThis();
    const mockEqUpdate = vi.fn().mockReturnThis();
    const mockSelectUpdate = vi.fn().mockReturnThis();
    const mockSingleUpdate = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Update failed", code: "DB_ERROR" },
    });

    mockSelectUpdate.mockReturnValue({
      single: mockSingleUpdate,
    });

    mockEqUpdate.mockReturnValue({
      select: mockSelectUpdate,
    });

    mockUpdate.mockReturnValue({
      eq: mockEqUpdate,
    });

    // Pierwsze wywołanie from - sprawdzenie istnienia
    // Drugie wywołanie from - update
    mockFrom
      .mockReturnValueOnce({
        select: mockSelectCheck,
      })
      .mockReturnValueOnce({
        update: mockUpdate,
      });

    // Act & Assert
    await expect(updateSetting(mockSupabase, "HR", "default_vacation_days", { value: 30 })).rejects.toThrow(
      "Failed to update setting"
    );
  });
});
