/**
 * Mock Data for Teams
 * Provides realistic test data for team-related unit tests
 */

import type { TeamListItemDTO, GetTeamByIdResponseDTO, CreateTeamDTO, CreateTeamResponseDTO } from "@/types";

export const mockTeams = {
  engineering: {
    id: "team-1-id",
    name: "Engineering",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },

  product: {
    id: "team-2-id",
    name: "Product",
    createdAt: "2026-01-02T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  },

  sales: {
    id: "team-3-id",
    name: "Sales",
    createdAt: "2026-01-03T00:00:00Z",
    updatedAt: "2026-01-03T00:00:00Z",
  },

  deletedTeam: {
    id: "deleted-team-id",
    name: "Archived Team",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-15T00:00:00Z",
    deletedAt: "2026-01-15T00:00:00Z",
  },
} as const;

export const mockTeamDetailsWithMembers: Record<string, GetTeamByIdResponseDTO> = {
  engineering: {
    ...mockTeams.engineering,
    members: [
      {
        id: "employee-1-id",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
      },
      {
        id: "employee-2-id",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
      },
    ],
  },

  product: {
    ...mockTeams.product,
    members: [
      {
        id: "employee-2-id",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
      },
    ],
  },

  sales: {
    ...mockTeams.sales,
    members: [],
  },
};

export const mockCreateTeamDTO: CreateTeamDTO = {
  name: "New Team",
};

export const mockCreateTeamResponse: CreateTeamResponseDTO = {
  id: "new-team-id",
  name: "New Team",
  createdAt: "2026-02-02T10:00:00Z",
};

/**
 * Mock team memberships
 */
export const mockTeamMemberships = [
  {
    id: "membership-1-id",
    team_id: mockTeams.engineering.id,
    user_id: "employee-1-id",
    joined_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "membership-2-id",
    team_id: mockTeams.engineering.id,
    user_id: "employee-2-id",
    joined_at: "2026-01-02T00:00:00Z",
  },
  {
    id: "membership-3-id",
    team_id: mockTeams.product.id,
    user_id: "employee-2-id",
    joined_at: "2026-01-02T00:00:00Z",
  },
];

/**
 * Mock team member count aggregate
 */
export const mockTeamMemberCounts = [
  {
    id: mockTeams.engineering.id,
    name: mockTeams.engineering.name,
    member_count: 2,
  },
  {
    id: mockTeams.product.id,
    name: mockTeams.product.name,
    member_count: 1,
  },
  {
    id: mockTeams.sales.id,
    name: mockTeams.sales.name,
    member_count: 0,
  },
];
