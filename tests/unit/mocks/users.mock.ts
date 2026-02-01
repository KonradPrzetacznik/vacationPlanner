/**
 * Mock Data for Users
 * Provides realistic test data for user-related unit tests
 */

import type { UserListItemDTO, UserDetailsDTO, CreateUserDTO, CreateUserResponseDTO } from "@/types";

export const mockUsers = {
  admin: {
    id: "admin-user-id",
    firstName: "Admin",
    lastName: "User",
    email: "admin@example.com",
    role: "ADMINISTRATOR" as const,
    deletedAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },

  hr: {
    id: "hr-user-id",
    firstName: "HR",
    lastName: "Manager",
    email: "hr@example.com",
    role: "HR" as const,
    deletedAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },

  employee1: {
    id: "employee-1-id",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    role: "EMPLOYEE" as const,
    deletedAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },

  employee2: {
    id: "employee-2-id",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    role: "EMPLOYEE" as const,
    deletedAt: null,
    createdAt: "2026-01-02T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  },

  deletedEmployee: {
    id: "deleted-employee-id",
    firstName: "Deleted",
    lastName: "Employee",
    email: "deleted@example.com",
    role: "EMPLOYEE" as const,
    deletedAt: "2026-01-15T00:00:00Z",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-15T00:00:00Z",
  },
} as const;

export const mockUserDetails: Record<string, UserDetailsDTO> = {
  admin: {
    ...mockUsers.admin,
    teams: [
      {
        id: "team-1-id",
        name: "Engineering",
      },
      {
        id: "team-2-id",
        name: "Product",
      },
    ],
  },

  employee1: {
    ...mockUsers.employee1,
    teams: [
      {
        id: "team-1-id",
        name: "Engineering",
      },
    ],
  },

  employee2: {
    ...mockUsers.employee2,
    teams: [
      {
        id: "team-2-id",
        name: "Product",
      },
    ],
  },
};

export const mockCreateUserDTO: CreateUserDTO = {
  firstName: "New",
  lastName: "User",
  email: "newuser@example.com",
  role: "EMPLOYEE",
  temporaryPassword: "TempPassword123!",
};

export const mockCreateUserResponse: CreateUserResponseDTO = {
  id: "new-user-id",
  firstName: "New",
  lastName: "User",
  email: "newuser@example.com",
  role: "EMPLOYEE",
  requiresPasswordReset: true,
  createdAt: "2026-02-02T10:00:00Z",
};

/**
 * Mock RPC response from get_users_with_emails function
 */
export const mockGetUsersRpcResponse = [
  {
    id: mockUsers.admin.id,
    first_name: mockUsers.admin.firstName,
    last_name: mockUsers.admin.lastName,
    email: mockUsers.admin.email,
    role: mockUsers.admin.role,
    deleted_at: mockUsers.admin.deletedAt,
    created_at: mockUsers.admin.createdAt,
    updated_at: mockUsers.admin.updatedAt,
    total_count: 3,
  },
  {
    id: mockUsers.employee1.id,
    first_name: mockUsers.employee1.firstName,
    last_name: mockUsers.employee1.lastName,
    email: mockUsers.employee1.email,
    role: mockUsers.employee1.role,
    deleted_at: mockUsers.employee1.deletedAt,
    created_at: mockUsers.employee1.createdAt,
    updated_at: mockUsers.employee1.updatedAt,
    total_count: 3,
  },
  {
    id: mockUsers.employee2.id,
    first_name: mockUsers.employee2.firstName,
    last_name: mockUsers.employee2.lastName,
    email: mockUsers.employee2.email,
    role: mockUsers.employee2.role,
    deleted_at: mockUsers.employee2.deletedAt,
    created_at: mockUsers.employee2.createdAt,
    updated_at: mockUsers.employee2.updatedAt,
    total_count: 3,
  },
];
