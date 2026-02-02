/**
 * Unit Tests for Teams Service
 * Tests: getTeams, getTeamById, createTeam, updateTeam, deleteTeam, addMembers, removeMember, getCalendar
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addMembers,
  removeMember,
  getCalendar,
} from "@/lib/services/teams.service";
import type { SupabaseClient } from "@/db/supabase.client";
import { createMockSupabaseClient, setupRpcCall } from "./mocks/supabase.mock";
import { mockTeams, mockCreateTeamDTO } from "./mocks/teams.mock";
import { mockUsers } from "./mocks/users.mock";

describe("Teams Service", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getTeams", () => {
    it("should return all teams with pagination for ADMINISTRATOR", async () => {
      // Arrange
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockTeams.engineering, mockTeams.product, mockTeams.sales],
          error: null,
          count: 3,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await getTeams(mockSupabase, mockUsers.admin.id, "ADMINISTRATOR", {
        limit: 50,
        offset: 0,
      });

      // Assert
      expect(result.data).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.data[0].name).toBe(mockTeams.engineering.name);
    });

    it("should filter teams for EMPLOYEE by membership", async () => {
      // Arrange
      const mockMembershipsBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ team_id: mockTeams.engineering.id }],
          error: null,
        }),
      };

      const mockTeamsBuilder = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockTeams.engineering],
          error: null,
          count: 1,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockMembershipsBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockTeamsBuilder as any);

      // Act
      const result = await getTeams(mockSupabase, mockUsers.employee1.id, "EMPLOYEE", {
        limit: 50,
        offset: 0,
      });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(mockTeams.engineering.id);
    });

    it("should return empty list for EMPLOYEE not in any team", async () => {
      // Arrange
      const mockMembershipsBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockMembershipsBuilder as any);

      // Act
      const result = await getTeams(mockSupabase, mockUsers.employee1.id, "EMPLOYEE", {
        limit: 50,
        offset: 0,
      });

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it("should include member counts when requested", async () => {
      // Arrange
      const mockTeamsBuilder = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockTeams.engineering, mockTeams.product],
          error: null,
          count: 2,
        }),
      };

      const mockMembersBuilder = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [
            { team_id: mockTeams.engineering.id },
            { team_id: mockTeams.engineering.id },
            { team_id: mockTeams.product.id },
          ],
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockTeamsBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockMembersBuilder as any);

      // Act
      const result = await getTeams(mockSupabase, mockUsers.admin.id, "ADMINISTRATOR", {
        limit: 50,
        offset: 0,
        includeMemberCount: true,
      });

      // Assert
      expect(result.data).toHaveLength(2);
      expect((result.data[0] as any).memberCount).toBe(2);
      expect((result.data[1] as any).memberCount).toBe(1);
    });
  });

  describe("getTeamById", () => {
    it("should retrieve team with members", async () => {
      // Arrange
      const mockTeamBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockTeams.engineering,
          error: null,
        }),
      };

      const mockMembersBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({
          data: [
            {
              created_at: "2026-01-01T00:00:00Z",
              user_id: mockUsers.employee1.id,
              profiles: {
                id: mockUsers.employee1.id,
                first_name: mockUsers.employee1.firstName,
                last_name: mockUsers.employee1.lastName,
                role: mockUsers.employee1.role,
              },
            },
          ],
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockTeamBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockMembersBuilder as any);

      // Mock RPC for emails
      setupRpcCall(mockSupabase, "get_user_emails", [{ id: mockUsers.employee1.id, email: mockUsers.employee1.email }]);

      // Act
      const result = await getTeamById(mockSupabase, mockTeams.engineering.id, mockUsers.admin.id, "ADMINISTRATOR");

      // Assert
      expect(result.data.id).toBe(mockTeams.engineering.id);
      expect(result.data.members).toHaveLength(1);
      expect(result.data.members[0].firstName).toBe(mockUsers.employee1.firstName);
    });

    it("should restrict EMPLOYEE access to their own teams", async () => {
      // Arrange
      const mockTeamBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockTeams.engineering,
          error: null,
        }),
      };

      const mockMembershipBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockTeamBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockMembershipBuilder as any);

      // Act & Assert
      await expect(
        getTeamById(mockSupabase, mockTeams.engineering.id, mockUsers.employee1.id, "EMPLOYEE")
      ).rejects.toThrow("Not a member");
    });

    it("should throw error when team not found", async () => {
      // Arrange
      const mockTeamBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found" },
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockTeamBuilder as any);

      // Act & Assert
      await expect(getTeamById(mockSupabase, "invalid-team-id", mockUsers.admin.id, "ADMINISTRATOR")).rejects.toThrow(
        "Team not found"
      );
    });
  });

  describe("createTeam", () => {
    it("should create new team with valid data", async () => {
      // Arrange
      const mockCheckBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      const mockInsertBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "new-team-id",
            name: "New Team",
            created_at: "2026-02-02T10:00:00Z",
          },
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockCheckBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockInsertBuilder as any);

      mockCheckBuilder.eq.mockReturnValue(mockCheckBuilder);

      // Act
      const result = await createTeam(mockSupabase, mockCreateTeamDTO);

      // Assert
      expect(result.id).toBe("new-team-id");
      expect(result.name).toBe(mockCreateTeamDTO.name);
    });

    it("should throw error on duplicate team name", async () => {
      // Arrange
      const mockCheckBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: mockTeams.engineering.id },
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockCheckBuilder as any);

      // Act & Assert
      await expect(createTeam(mockSupabase, { name: mockTeams.engineering.name })).rejects.toThrow("already exists");
    });

    it("should trim whitespace from team name", async () => {
      // Arrange
      const dataWithWhitespace = { name: "  New Team  " };

      const mockCheckBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      const mockInsertBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockTeams.engineering, name: "New Team" },
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockCheckBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockInsertBuilder as any);

      // Act
      const result = await createTeam(mockSupabase, dataWithWhitespace);

      // Assert
      expect(result.name).toBe("New Team");
    });
  });

  describe("updateTeam", () => {
    it("should update team name successfully", async () => {
      // Arrange
      const mockFetchBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockTeams.engineering,
          error: null,
        }),
      };

      const mockCheckBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      const mockUpdateBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockTeams.engineering, name: "New Name" },
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockFetchBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockCheckBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUpdateBuilder as any);

      // Act
      const result = await updateTeam(mockSupabase, mockTeams.engineering.id, { name: "New Name" });

      // Assert
      expect(result.name).toBe("New Name");
    });

    it("should throw error when team not found", async () => {
      // Arrange
      const mockFetchBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found" },
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockFetchBuilder as any);

      // Act & Assert
      await expect(updateTeam(mockSupabase, "invalid-id", { name: "New Name" })).rejects.toThrow("not found");
    });
  });

  describe("deleteTeam", () => {
    it("should delete team successfully", async () => {
      // Arrange
      const mockFetchBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockTeams.engineering,
          error: null,
        }),
      };

      const mockDeleteBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockFetchBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockDeleteBuilder as any);

      // Act
      const result = await deleteTeam(mockSupabase, mockTeams.engineering.id);

      // Assert
      expect(result.message).toContain("deleted");
      expect(result.id).toBe(mockTeams.engineering.id);
    });

    it("should throw error when team not found", async () => {
      // Arrange
      const mockFetchBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found" },
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockFetchBuilder as any);

      // Act & Assert
      await expect(deleteTeam(mockSupabase, "invalid-id")).rejects.toThrow("not found");
    });
  });

  describe("addMembers", () => {
    it("should add multiple members to team", async () => {
      // Arrange
      const mockTeamBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockTeams.engineering.id },
          error: null,
        }),
      };

      const mockUsersBuilder = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [
            { id: mockUsers.employee1.id, deleted_at: null },
            { id: mockUsers.employee2.id, deleted_at: null },
          ],
          error: null,
        }),
      };

      const mockExistingBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockInsertBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [
            {
              id: "membership-1",
              user_id: mockUsers.employee1.id,
              team_id: mockTeams.engineering.id,
              created_at: "2026-02-02T10:00:00Z",
            },
            {
              id: "membership-2",
              user_id: mockUsers.employee2.id,
              team_id: mockTeams.engineering.id,
              created_at: "2026-02-02T10:00:00Z",
            },
          ],
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockTeamBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUsersBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockExistingBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockInsertBuilder as any);

      // Act
      const result = await addMembers(mockSupabase, mockTeams.engineering.id, [
        mockUsers.employee1.id,
        mockUsers.employee2.id,
      ]);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe(mockUsers.employee1.id);
    });

    it("should throw error when user already member", async () => {
      // Arrange
      const mockTeamBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockTeams.engineering.id },
          error: null,
        }),
      };

      const mockUsersBuilder = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [{ id: mockUsers.employee1.id, deleted_at: null }],
          error: null,
        }),
      };

      const mockExistingBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [{ user_id: mockUsers.employee1.id }],
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockTeamBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUsersBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockExistingBuilder as any);

      // Act & Assert
      await expect(addMembers(mockSupabase, mockTeams.engineering.id, [mockUsers.employee1.id])).rejects.toThrow(
        "already a member"
      );
    });
  });

  describe("removeMember", () => {
    it("should remove member from team", async () => {
      // Arrange
      const mockTeamBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockTeams.engineering.id },
          error: null,
        }),
      };

      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockUsers.employee1.id },
          error: null,
        }),
      };

      const mockMembershipBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: "membership-1" },
          error: null,
        }),
      };

      const mockDeleteBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockTeamBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUserBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockMembershipBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockDeleteBuilder as any);

      mockTeamBuilder.eq.mockReturnValue(mockTeamBuilder);
      mockUserBuilder.eq.mockReturnValue(mockUserBuilder);
      mockMembershipBuilder.eq.mockReturnValue(mockMembershipBuilder);

      // Act & Assert
      await expect(removeMember(mockSupabase, mockTeams.engineering.id, mockUsers.employee1.id)).resolves.not.toThrow();
    });

    it("should throw error when membership does not exist", async () => {
      // Arrange
      const mockTeamBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockTeams.engineering.id },
          error: null,
        }),
      };

      const mockUserBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockUsers.employee1.id },
          error: null,
        }),
      };

      const mockMembershipBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockTeamBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockUserBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockMembershipBuilder as any);

      // Act & Assert
      await expect(removeMember(mockSupabase, mockTeams.engineering.id, mockUsers.employee1.id)).rejects.toThrow(
        "not a member"
      );
    });
  });

  describe("getCalendar", () => {
    it("should retrieve team calendar with vacation requests", async () => {
      // Arrange
      const mockTeamBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockTeams.engineering,
          error: null,
        }),
      };

      const mockMembersBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({
          data: [
            {
              user_id: mockUsers.employee1.id,
              profiles: {
                id: mockUsers.employee1.id,
                first_name: mockUsers.employee1.firstName,
                last_name: mockUsers.employee1.lastName,
              },
            },
          ],
          error: null,
        }),
      };

      const mockVacationsBuilder = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: "vacation-1",
              user_id: mockUsers.employee1.id,
              start_date: "2026-02-02",
              end_date: "2026-02-06",
              business_days_count: 5,
              status: "APPROVED",
            },
          ],
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockTeamBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockMembersBuilder as any);
      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockVacationsBuilder as any);

      // Act
      const result = await getCalendar(mockSupabase, mockUsers.admin.id, "ADMINISTRATOR", mockTeams.engineering.id, {});

      // Assert
      expect(result.teamId).toBe(mockTeams.engineering.id);
      expect(result.members).toHaveLength(1);
      expect(result.members[0].vacations).toHaveLength(1);
    });
  });
});
