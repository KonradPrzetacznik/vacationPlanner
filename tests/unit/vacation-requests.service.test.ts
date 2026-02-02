/**
 * Unit Tests for Vacation Requests Service
 * Tests: getVacationRequests, getVacationRequestById, createVacationRequest, approveVacationRequest, rejectVacationRequest, cancelVacationRequest
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getVacationRequests,
  getVacationRequestById,
  createVacationRequest,
  approveVacationRequest,
  rejectVacationRequest,
  cancelVacationRequest,
} from "@/lib/services/vacation-requests.service";
import type { SupabaseClient } from "@/db/supabase.client";
import { createMockSupabaseClient, setupRpcCall } from "./mocks/supabase.mock";
import { mockVacationRequests, mockCreateVacationRequestDTO } from "./mocks/vacation-requests.mock";
import { mockUsers } from "./mocks/users.mock";
import { mockTeams } from "./mocks/teams.mock";

describe("Vacation Requests Service", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getVacationRequests", () => {
    it("should return vacation requests with pagination for ADMINISTRATOR", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: "ADMINISTRATOR" },
          error: null,
        }),
      };

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [
            {
              id: mockVacationRequests.submitted.id,
              user_id: mockVacationRequests.submitted.userId,
              start_date: mockVacationRequests.submitted.startDate,
              end_date: mockVacationRequests.submitted.endDate,
              business_days_count: mockVacationRequests.submitted.businessDaysCount,
              status: mockVacationRequests.submitted.status,
              created_at: mockVacationRequests.submitted.createdAt,
              updated_at: mockVacationRequests.submitted.updatedAt,
              processed_by_user_id: null,
              processed_at: null,
              profiles: {
                id: mockUsers.employee1.id,
                first_name: mockUsers.employee1.firstName,
                last_name: mockUsers.employee1.lastName,
              },
            },
          ],
          error: null,
          count: 1,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUserBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockQueryBuilder as any);

      // Chain all methods to return the builder
      mockUserBuilder.eq.mockReturnValue(mockUserBuilder);
      mockQueryBuilder.eq.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.in.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.gte.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.lte.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.order.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await getVacationRequests(mockSupabase, mockUsers.admin.id, { limit: 50, offset: 0 });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it("should filter requests by status for ADMINISTRATOR", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: "ADMINISTRATOR" },
          error: null,
        }),
      };

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [
            {
              id: mockVacationRequests.approved.id,
              user_id: mockVacationRequests.approved.userId,
              start_date: mockVacationRequests.approved.startDate,
              end_date: mockVacationRequests.approved.endDate,
              business_days_count: mockVacationRequests.approved.businessDaysCount,
              status: mockVacationRequests.approved.status,
              created_at: mockVacationRequests.approved.createdAt,
              updated_at: mockVacationRequests.approved.updatedAt,
              processed_by_user_id: mockUsers.hr.id,
              processed_at: "2026-01-31T10:00:00Z",
              profiles: {
                id: mockUsers.employee2.id,
                first_name: mockUsers.employee2.firstName,
                last_name: mockUsers.employee2.lastName,
              },
            },
          ],
          error: null,
          count: 1,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUserBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockQueryBuilder as any);

      // Chain all methods
      mockUserBuilder.eq.mockReturnValue(mockUserBuilder);
      mockQueryBuilder.eq.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.in.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.gte.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.lte.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.order.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await getVacationRequests(mockSupabase, mockUsers.admin.id, {
        status: ["APPROVED"],
      });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe("APPROVED");
    });

    it("should restrict EMPLOYEE to view only own requests", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: "EMPLOYEE" },
          error: null,
        }),
      };

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUserBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockQueryBuilder as any);

      // Act & Assert
      await expect(
        getVacationRequests(mockSupabase, mockUsers.employee1.id, { userId: mockUsers.employee2.id })
      ).rejects.toThrow("only view your own");
    });

    it("should throw error when RPC fails", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Failed to fetch" },
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockUserBuilder as any);

      // Act & Assert
      await expect(getVacationRequests(mockSupabase, mockUsers.admin.id, {})).rejects.toThrow(
        "verify user permissions"
      );
    });
  });

  describe("getVacationRequestById", () => {
    it("should retrieve vacation request with user details", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: "ADMINISTRATOR" },
          error: null,
        }),
      };

      const mockRequestBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockVacationRequests.submitted.id,
            user_id: mockVacationRequests.submitted.userId,
            start_date: mockVacationRequests.submitted.startDate,
            end_date: mockVacationRequests.submitted.endDate,
            business_days_count: mockVacationRequests.submitted.businessDaysCount,
            status: mockVacationRequests.submitted.status,
            processed_by_user_id: null,
            processed_at: null,
            created_at: mockVacationRequests.submitted.createdAt,
            updated_at: mockVacationRequests.submitted.updatedAt,
            user: {
              id: mockUsers.employee1.id,
              first_name: mockUsers.employee1.firstName,
              last_name: mockUsers.employee1.lastName,
            },
            processedBy: null,
          },
          error: null,
        }),
      };

      setupRpcCall(mockSupabase, "get_user_emails", [{ id: mockUsers.employee1.id, email: mockUsers.employee1.email }]);

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUserBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockRequestBuilder as any);

      // Act
      const result = await getVacationRequestById(mockSupabase, mockUsers.admin.id, mockVacationRequests.submitted.id);

      // Assert
      expect(result.id).toBe(mockVacationRequests.submitted.id);
      expect(result.user.firstName).toBe(mockUsers.employee1.firstName);
    });

    it("should restrict EMPLOYEE to own requests", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: "EMPLOYEE" },
          error: null,
        }),
      };

      const mockRequestBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockVacationRequests.submitted.id,
            user_id: mockUsers.employee2.id,
            start_date: mockVacationRequests.submitted.startDate,
            end_date: mockVacationRequests.submitted.endDate,
            business_days_count: mockVacationRequests.submitted.businessDaysCount,
            status: mockVacationRequests.submitted.status,
            created_at: mockVacationRequests.submitted.createdAt,
            updated_at: mockVacationRequests.submitted.updatedAt,
            processed_by_user_id: null,
            processed_at: null,
            user: {
              id: mockUsers.employee2.id,
              first_name: mockUsers.employee2.firstName,
              last_name: mockUsers.employee2.lastName,
            },
            processedBy: null,
          },
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUserBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockRequestBuilder as any);

      setupRpcCall(mockSupabase, "get_user_emails", [{ id: mockUsers.employee2.id, email: mockUsers.employee2.email }]);

      // Chain methods
      mockUserBuilder.eq.mockReturnValue(mockUserBuilder);
      mockRequestBuilder.eq.mockReturnValue(mockRequestBuilder);

      // Act & Assert
      await expect(
        getVacationRequestById(mockSupabase, mockUsers.employee1.id, mockVacationRequests.submitted.id)
      ).rejects.toThrow("only view your own");
    });

    it("should throw error when vacation request not found", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: "ADMINISTRATOR" },
          error: null,
        }),
      };

      const mockRequestBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116" },
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUserBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockRequestBuilder as any);

      // Act & Assert
      await expect(getVacationRequestById(mockSupabase, mockUsers.admin.id, "invalid-id")).rejects.toThrow("not found");
    });
  });

  describe("createVacationRequest", () => {
    it("should create vacation request with valid data", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockUsers.employee1.id },
          error: null,
        }),
      };

      setupRpcCall(mockSupabase, "calculate_business_days", 5);

      const mockAllowanceBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            total_days: 26,
            carryover_days: 5,
          },
          error: null,
        }),
      };

      const mockUsedDaysBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockOverlapBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockInsertBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "new-vacation-id",
            user_id: mockUsers.employee1.id,
            start_date: mockCreateVacationRequestDTO.startDate,
            end_date: mockCreateVacationRequestDTO.endDate,
            business_days_count: 5,
            status: "SUBMITTED",
            created_at: "2026-02-02T10:00:00Z",
          },
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUserBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockAllowanceBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUsedDaysBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockOverlapBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockInsertBuilder as any);

      // Act
      const result = await createVacationRequest(mockSupabase, mockUsers.employee1.id, mockCreateVacationRequestDTO);

      // Assert
      expect(result.id).toBe("new-vacation-id");
      expect(result.status).toBe("SUBMITTED");
      expect(result.businessDaysCount).toBe(5);
    });

    it("should throw error on insufficient vacation days", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockUsers.employee1.id },
          error: null,
        }),
      };

      setupRpcCall(mockSupabase, "calculate_business_days", 30);

      const mockAllowanceBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            total_days: 26,
            carryover_days: 0,
          },
          error: null,
        }),
      };

      const mockUsedDaysBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUserBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockAllowanceBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUsedDaysBuilder as any);

      // Act & Assert
      await expect(
        createVacationRequest(mockSupabase, mockUsers.employee1.id, mockCreateVacationRequestDTO)
      ).rejects.toThrow("Insufficient vacation days");
    });

    it("should throw error on overlapping vacation requests", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockUsers.employee1.id },
          error: null,
        }),
      };

      setupRpcCall(mockSupabase, "calculate_business_days", 5);

      const mockAllowanceBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { total_days: 26, carryover_days: 2 },
          error: null,
        }),
      };

      const mockUsedDaysBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockOverlapBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue({
          data: [{ id: "existing-vacation-id" }],
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUserBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockAllowanceBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUsedDaysBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockOverlapBuilder as any);

      // Act & Assert
      await expect(
        createVacationRequest(mockSupabase, mockUsers.employee1.id, mockCreateVacationRequestDTO)
      ).rejects.toThrow("overlapping");
    });
  });

  describe("approveVacationRequest", () => {
    it("should approve vacation request successfully", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: "HR" },
          error: null,
        }),
      };

      const mockRequestBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockVacationRequests.submitted.id,
            user_id: mockUsers.employee1.id,
            start_date: mockVacationRequests.submitted.startDate,
            end_date: mockVacationRequests.submitted.endDate,
            business_days_count: mockVacationRequests.submitted.businessDaysCount,
            status: "SUBMITTED",
          },
          error: null,
        }),
      };

      setupRpcCall(mockSupabase, "check_common_team", true);

      const mockTeamBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ team_id: mockTeams.engineering.id }],
          error: null,
        }),
      };

      const mockSettingsBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { value: 50 },
          error: null,
        }),
      };

      setupRpcCall(mockSupabase, "get_team_occupancy", 30);

      const mockUpdateBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockVacationRequests.submitted.id,
            status: "APPROVED",
            processed_by_user_id: mockUsers.hr.id,
            processed_at: "2026-02-02T11:00:00Z",
          },
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUserBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockRequestBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockTeamBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockSettingsBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUpdateBuilder as any);

      // Act
      const result = await approveVacationRequest(mockSupabase, mockUsers.hr.id, mockVacationRequests.submitted.id);

      // Assert
      expect(result.status).toBe("APPROVED");
      expect(result.processedByUserId).toBe(mockUsers.hr.id);
    });

    it("should throw error when approving own request", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: "HR" },
          error: null,
        }),
      };

      const mockRequestBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            ...mockVacationRequests.submitted,
            user_id: mockUsers.hr.id,
            status: "SUBMITTED",
          },
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUserBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockRequestBuilder as any);

      // Act & Assert
      await expect(
        approveVacationRequest(mockSupabase, mockUsers.hr.id, mockVacationRequests.submitted.id)
      ).rejects.toThrow("cannot approve your own");
    });

    it("should throw error when request not SUBMITTED", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: "HR" },
          error: null,
        }),
      };

      const mockRequestBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockVacationRequests.approved.id,
            user_id: mockUsers.employee1.id,
            start_date: mockVacationRequests.approved.startDate,
            end_date: mockVacationRequests.approved.endDate,
            business_days_count: mockVacationRequests.approved.businessDaysCount,
            status: "APPROVED",
          },
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUserBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockRequestBuilder as any);

      setupRpcCall(mockSupabase, "check_common_team", true);

      // Chain methods
      mockUserBuilder.eq.mockReturnValue(mockUserBuilder);
      mockUserBuilder.is.mockReturnValue(mockUserBuilder);
      mockRequestBuilder.eq.mockReturnValue(mockRequestBuilder);

      // Act & Assert
      await expect(
        approveVacationRequest(mockSupabase, mockUsers.hr.id, mockVacationRequests.approved.id)
      ).rejects.toThrow("SUBMITTED status");
    });
  });

  describe("rejectVacationRequest", () => {
    it("should reject vacation request successfully", async () => {
      // Arrange
      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: "HR" },
          error: null,
        }),
      };

      const mockRequestBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockVacationRequests.submitted.id,
            user_id: mockUsers.employee1.id,
            status: "SUBMITTED",
          },
          error: null,
        }),
      };

      setupRpcCall(mockSupabase, "check_common_team", true);

      const mockUpdateBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockVacationRequests.submitted.id,
            status: "REJECTED",
            processed_by_user_id: mockUsers.hr.id,
            processed_at: "2026-02-02T11:00:00Z",
          },
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUserBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockRequestBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUpdateBuilder as any);

      // Act
      const result = await rejectVacationRequest(
        mockSupabase,
        mockUsers.hr.id,
        mockVacationRequests.submitted.id,
        "Too many requests"
      );

      // Assert
      expect(result.status).toBe("REJECTED");
      expect(result.processedByUserId).toBe(mockUsers.hr.id);
    });
  });

  describe("cancelVacationRequest", () => {
    it("should cancel submitted vacation request", async () => {
      // Arrange
      const mockRequestBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockVacationRequests.submitted.id,
            user_id: mockUsers.employee1.id,
            start_date: mockVacationRequests.submitted.startDate,
            end_date: mockVacationRequests.submitted.endDate,
            business_days_count: mockVacationRequests.submitted.businessDaysCount,
            status: "SUBMITTED",
          },
          error: null,
        }),
      };

      const mockUpdateBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockVacationRequests.cancelled.id,
            status: "CANCELLED",
            updated_at: "2026-02-02T12:00:00Z",
          },
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockRequestBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUpdateBuilder as any);

      // Act
      const result = await cancelVacationRequest(
        mockSupabase,
        mockUsers.employee1.id,
        mockVacationRequests.submitted.id
      );

      // Assert
      expect(result.status).toBe("CANCELLED");
      expect(result.daysReturned).toBe(mockVacationRequests.submitted.businessDaysCount);
    });

    it("should throw error when user not owner", async () => {
      // Arrange
      const mockRequestBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            ...mockVacationRequests.submitted,
            user_id: mockUsers.employee2.id,
            status: "SUBMITTED",
          },
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockRequestBuilder as any);

      // Act & Assert
      await expect(
        cancelVacationRequest(mockSupabase, mockUsers.employee1.id, mockVacationRequests.submitted.id)
      ).rejects.toThrow("only cancel your own");
    });

    it("should throw error when request not SUBMITTED or APPROVED", async () => {
      // Arrange
      const mockRequestBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            ...mockVacationRequests.rejected,
            user_id: mockUsers.employee1.id,
            status: "REJECTED",
          },
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockRequestBuilder as any);

      // Act & Assert
      await expect(
        cancelVacationRequest(mockSupabase, mockUsers.employee1.id, mockVacationRequests.rejected.id)
      ).rejects.toThrow("SUBMITTED or APPROVED");
    });
  });
});
