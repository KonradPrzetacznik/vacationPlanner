/**
 * Unit Tests for Vacation Allowances Service
 * Tests: getVacationAllowances, getVacationAllowanceByYear, createVacationAllowance, updateVacationAllowance
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getVacationAllowances,
  getVacationAllowanceByYear,
  createVacationAllowance,
  updateVacationAllowance,
} from "@/lib/services/vacation-allowances.service";
import type { SupabaseClient } from "@/db/supabase.client";
import { createMockSupabaseClient } from "./mocks/supabase.mock";
import {
  mockVacationAllowances,
  mockCreateAllowanceDTO,
  mockUpdateAllowanceDTO,
} from "./mocks/vacation-allowances.mock";
import { mockUsers } from "./mocks/users.mock";

describe("Vacation Allowances Service", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getVacationAllowances", () => {
    it("should retrieve allowances for user as ADMINISTRATOR", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockUsers.employee1.id, deleted_at: null },
          error: null,
        }),
      };

      const mockAllowanceBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: [mockVacationAllowances.employee1],
            error: null,
          }),
        }),
      };

      const mockRequestsBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({
          data: [
            {
              start_date: "2026-02-02",
              end_date: "2026-02-06",
              business_days_count: 5,
              status: "APPROVED",
            },
          ],
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUserBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockAllowanceBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockRequestsBuilder as any);

      // Chain all methods
      mockUserBuilder.eq.mockReturnValue(mockUserBuilder);
      mockAllowanceBuilder.select.mockReturnValue(mockAllowanceBuilder);
      mockAllowanceBuilder.eq.mockReturnValue(mockAllowanceBuilder);
      mockRequestsBuilder.eq.mockReturnValue(mockRequestsBuilder);
      mockRequestsBuilder.gte.mockReturnValue(mockRequestsBuilder);
      mockRequestsBuilder.lte.mockReturnValue(mockRequestsBuilder);

      // Act
      const result = await getVacationAllowances(
        mockSupabase,
        mockUsers.admin.id,
        "ADMINISTRATOR",
        mockUsers.employee1.id
      );

      // Assert
      expect(result.userId).toBe(mockUsers.employee1.id);
      expect(result.allowances).toHaveLength(0);
    });

    it("should restrict EMPLOYEE to own allowances", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockUsers.employee1.id, deleted_at: null },
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockUserBuilder as any);

      // Act & Assert
      await expect(
        getVacationAllowances(mockSupabase, mockUsers.employee1.id, "EMPLOYEE", mockUsers.employee2.id)
      ).rejects.toThrow("only view your own");
    });

    it("should throw error when user not found", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found" },
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockUserBuilder as any);

      // Act & Assert
      await expect(
        getVacationAllowances(mockSupabase, mockUsers.admin.id, "ADMINISTRATOR", "invalid-user-id")
      ).rejects.toThrow("not found");
    });

    it("should prevent HR from accessing deleted user allowances", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockUsers.deletedEmployee.id, deleted_at: mockUsers.deletedEmployee.deletedAt },
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockUserBuilder as any);

      // Act & Assert
      await expect(
        getVacationAllowances(mockSupabase, mockUsers.hr.id, "HR", mockUsers.deletedEmployee.id)
      ).rejects.toThrow("deleted user");
    });

    it("should allow ADMINISTRATOR to access deleted user allowances", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockUsers.deletedEmployee.id, deleted_at: mockUsers.deletedEmployee.deletedAt },
          error: null,
        }),
      };

      const mockAllowanceBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUserBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockAllowanceBuilder as any);

      // Act
      const result = await getVacationAllowances(
        mockSupabase,
        mockUsers.admin.id,
        "ADMINISTRATOR",
        mockUsers.deletedEmployee.id
      );

      // Assert
      expect(result.allowances).toHaveLength(0);
    });

    it("should return empty allowances when none found", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockUsers.employee1.id, deleted_at: null },
          error: null,
        }),
      };

      const mockAllowanceBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUserBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockAllowanceBuilder as any);

      // Chain all methods
      mockUserBuilder.eq.mockReturnValue(mockUserBuilder);
      mockAllowanceBuilder.select.mockReturnValue(mockAllowanceBuilder);
      mockAllowanceBuilder.eq.mockReturnValue(mockAllowanceBuilder);

      // Act
      const result = await getVacationAllowances(
        mockSupabase,
        mockUsers.admin.id,
        "ADMINISTRATOR",
        mockUsers.employee1.id
      );

      // Assert
      expect(result.allowances).toHaveLength(0);
    });
  });

  describe("getVacationAllowanceByYear", () => {
    it("should retrieve specific year allowance", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockUsers.employee1.id, deleted_at: null },
          error: null,
        }),
      };

      // Create mock data with user_id instead of userId
      const mockAllowanceData = {
        id: mockVacationAllowances.employee1.id,
        user_id: mockUsers.employee1.id,
        year: 2026,
        total_days: 26,
        carryover_days: 2,
        created_at: mockVacationAllowances.employee1.createdAt,
        updated_at: mockVacationAllowances.employee1.updatedAt,
      };

      const mockAllowanceBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockAllowanceData,
            error: null,
          }),
        }),
      };

      const mockRequestsBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUserBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockAllowanceBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockRequestsBuilder as any);

      mockUserBuilder.eq.mockReturnValue(mockUserBuilder);
      mockRequestsBuilder.eq.mockReturnValue(mockRequestsBuilder);
      mockRequestsBuilder.gte.mockReturnValue(mockRequestsBuilder);
      mockRequestsBuilder.lte.mockReturnValue(mockRequestsBuilder);

      // Act
      const result = await getVacationAllowanceByYear(
        mockSupabase,
        mockUsers.admin.id,
        "ADMINISTRATOR",
        mockUsers.employee1.id,
        2026
      );

      // Assert
      expect(result.data.year).toBe(2026);
      expect(result.data.userId).toBe(mockUsers.employee1.id);
    });

    it("should throw error when allowance not found for year", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockUsers.employee1.id, deleted_at: null },
          error: null,
        }),
      };

      const mockAllowanceBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Not found" },
          }),
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUserBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockAllowanceBuilder as any);

      mockUserBuilder.eq.mockReturnValue(mockUserBuilder);

      // Act & Assert
      await expect(
        getVacationAllowanceByYear(mockSupabase, mockUsers.admin.id, "ADMINISTRATOR", mockUsers.employee1.id, 2025)
      ).rejects.toThrow("not found");
    });
  });

  describe("createVacationAllowance", () => {
    it("should create vacation allowance successfully", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockCreateAllowanceDTO.userId, deleted_at: null },
          error: null,
        }),
      };

      const mockCheckBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockCheckBuilder.eq.mockReturnValue(mockCheckBuilder);

      const mockInsertBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "new-allowance-id",
            user_id: mockCreateAllowanceDTO.userId,
            year: mockCreateAllowanceDTO.year,
            total_days: mockCreateAllowanceDTO.totalDays,
            carryover_days: mockCreateAllowanceDTO.carryoverDays,
            created_at: "2026-02-02T10:00:00Z",
          },
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUserBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockCheckBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockInsertBuilder as any);

      // Act
      const result = await createVacationAllowance(mockSupabase, mockUsers.hr.id, "HR", mockCreateAllowanceDTO);

      // Assert
      expect(result.id).toBe("new-allowance-id");
      expect(result.userId).toBe(mockCreateAllowanceDTO.userId);
      expect(result.year).toBe(mockCreateAllowanceDTO.year);
    });

    it("should throw error on insufficient permissions", async () => {
      // Act & Assert
      await expect(
        createVacationAllowance(mockSupabase, mockUsers.employee1.id, "EMPLOYEE", mockCreateAllowanceDTO)
      ).rejects.toThrow("Only HR users");
    });

    it("should throw error when user not found", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found" },
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockUserBuilder as any);

      // Act & Assert
      await expect(
        createVacationAllowance(mockSupabase, mockUsers.hr.id, "HR", mockCreateAllowanceDTO)
      ).rejects.toThrow("not found");
    });

    it("should throw error for deleted user", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockUsers.deletedEmployee.id, deleted_at: mockUsers.deletedEmployee.deletedAt },
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockUserBuilder as any);

      // Act & Assert
      await expect(
        createVacationAllowance(mockSupabase, mockUsers.hr.id, "HR", mockCreateAllowanceDTO)
      ).rejects.toThrow("deleted user");
    });

    it("should throw error on duplicate allowance", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockCreateAllowanceDTO.userId, deleted_at: null },
          error: null,
        }),
      };

      const mockCheckBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: "existing-allowance-id" },
          error: null,
        }),
      };

      mockCheckBuilder.eq.mockReturnValue(mockCheckBuilder);

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUserBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockCheckBuilder as any);

      // Act & Assert
      await expect(
        createVacationAllowance(mockSupabase, mockUsers.hr.id, "HR", mockCreateAllowanceDTO)
      ).rejects.toThrow("already exists");
    });
  });

  describe("updateVacationAllowance", () => {
    it("should update vacation allowance successfully", async () => {
      // Arrange
      const mockCheckBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "allowance-id", user_id: mockUsers.employee1.id, year: 2026 },
          error: null,
        }),
      };

      const mockUpdateBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "allowance-id",
            user_id: mockUsers.employee1.id,
            year: 2026,
            total_days: mockUpdateAllowanceDTO.totalDays,
            carryover_days: mockUpdateAllowanceDTO.carryoverDays,
            updated_at: "2026-02-02T11:00:00Z",
          },
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockCheckBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUpdateBuilder as any);

      // Act
      const result = await updateVacationAllowance(
        mockSupabase,
        mockUsers.hr.id,
        "HR",
        "allowance-id",
        mockUpdateAllowanceDTO
      );

      // Assert
      expect(result.id).toBe("allowance-id");
      expect(result.totalDays).toBe(mockUpdateAllowanceDTO.totalDays);
    });

    it("should throw error on insufficient permissions", async () => {
      // Act & Assert
      await expect(
        updateVacationAllowance(
          mockSupabase,
          mockUsers.employee1.id,
          "EMPLOYEE",
          "allowance-id",
          mockUpdateAllowanceDTO
        )
      ).rejects.toThrow("Only HR users");
    });

    it("should throw error when allowance not found", async () => {
      // Arrange
      const mockCheckBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found" },
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockCheckBuilder as any);

      // Act & Assert
      await expect(
        updateVacationAllowance(mockSupabase, mockUsers.hr.id, "HR", "invalid-id", mockUpdateAllowanceDTO)
      ).rejects.toThrow("not found");
    });
  });
});
