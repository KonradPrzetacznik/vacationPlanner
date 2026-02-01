/**
 * Mock Data for Vacation Allowances
 * Provides realistic test data for vacation allowance-related unit tests
 */

import type { VacationAllowanceDTO, CreateVacationAllowanceDTO, UpdateVacationAllowanceDTO } from "@/types";

export const mockVacationAllowances = {
  employee1: {
    id: "allowance-1-id",
    userId: "employee-1-id",
    year: 2026,
    daysGranted: 26,
    totalDays: 26,
    daysUsed: 5,
    daysCarriedOver: 2,
    carryoverDays: 2,
    daysRemaining: 23,
    remainingDays: 23,
    usedCarryoverDays: 0,
    usedCurrentYearDays: 5,
    usedDays: 5,
    carryoverExpiresAt: "2026-03-31",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },

  employee2: {
    id: "allowance-2-id",
    userId: "employee-2-id",
    year: 2026,
    daysGranted: 26,
    totalDays: 26,
    daysUsed: 10,
    daysCarriedOver: 0,
    carryoverDays: 0,
    daysRemaining: 16,
    remainingDays: 16,
    usedCarryoverDays: 0,
    usedCurrentYearDays: 10,
    usedDays: 10,
    carryoverExpiresAt: "2026-03-31",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-20T00:00:00Z",
  },

  newEmployee: {
    id: "allowance-3-id",
    userId: "new-employee-id",
    year: 2026,
    daysGranted: 13,
    totalDays: 13,
    daysUsed: 0,
    daysCarriedOver: 0,
    carryoverDays: 0,
    daysRemaining: 13,
    remainingDays: 13,
    usedCarryoverDays: 0,
    usedCurrentYearDays: 0,
    usedDays: 0,
    carryoverExpiresAt: "2026-03-31",
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
  },
} as const;

export const mockCreateAllowanceDTO: CreateVacationAllowanceDTO = {
  userId: "employee-1-id",
  year: 2026,
  daysGranted: 26,
  daysCarriedOver: 0,
};

export const mockUpdateAllowanceDTO: UpdateVacationAllowanceDTO = {
  daysGranted: 28,
  daysUsed: 5,
};

/**
 * Mock RPC response for calculating used days
 */
export const mockCalculateUsedDaysResponse = {
  daysUsed: 5,
  approvedDates: [
    {
      id: "vacation-request-1-id",
      startDate: "2026-02-02",
      endDate: "2026-02-06",
      businessDaysCount: 5,
    },
  ],
};

/**
 * Mock aggregated allowances with user details
 */
export const mockAllowancesWithUsers = [
  {
    ...mockVacationAllowances.employee1,
    user: {
      id: "employee-1-id",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
    },
  },
  {
    ...mockVacationAllowances.employee2,
    user: {
      id: "employee-2-id",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@example.com",
    },
  },
];
