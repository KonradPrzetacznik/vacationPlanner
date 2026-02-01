/**
 * Mock Data for Vacation Requests
 * Provides realistic test data for vacation request-related unit tests
 */

import type {
  VacationRequestListItemDTO,
  VacationRequestDetailsDTO,
  CreateVacationRequestDTO,
  CreateVacationRequestResponseDTO,
} from "@/types";

export const mockVacationRequests = {
  submitted: {
    id: "vacation-request-1-id",
    userId: "employee-1-id",
    startDate: "2026-02-02",
    endDate: "2026-02-06",
    businessDaysCount: 5,
    status: "SUBMITTED" as const,
    createdAt: "2026-01-30T10:00:00Z",
    updatedAt: "2026-01-30T10:00:00Z",
  },

  approved: {
    id: "vacation-request-2-id",
    userId: "employee-2-id",
    startDate: "2026-02-09",
    endDate: "2026-02-13",
    businessDaysCount: 5,
    status: "APPROVED" as const,
    createdAt: "2026-01-29T10:00:00Z",
    updatedAt: "2026-01-31T10:00:00Z",
  },

  rejected: {
    id: "vacation-request-3-id",
    userId: "employee-1-id",
    startDate: "2026-03-02",
    endDate: "2026-03-06",
    businessDaysCount: 5,
    status: "REJECTED" as const,
    rejectionReason: "Team occupancy threshold exceeded",
    createdAt: "2026-01-28T10:00:00Z",
    updatedAt: "2026-01-30T10:00:00Z",
  },

  cancelled: {
    id: "vacation-request-4-id",
    userId: "employee-2-id",
    startDate: "2026-02-16",
    endDate: "2026-02-20",
    businessDaysCount: 5,
    status: "CANCELLED" as const,
    createdAt: "2026-01-27T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  },
} as const;

export const mockCreateVacationRequestDTO: CreateVacationRequestDTO = {
  startDate: "2026-02-02",
  endDate: "2026-02-06",
};

export const mockCreateVacationRequestResponse: CreateVacationRequestResponseDTO = {
  id: "new-vacation-request-id",
  userId: "employee-1-id",
  startDate: "2026-02-02",
  endDate: "2026-02-06",
  businessDaysCount: 5,
  status: "SUBMITTED",
  createdAt: "2026-02-02T10:00:00Z",
};

/**
 * Mock vacation request with detailed user info
 */
export const mockVacationRequestDetails: Record<string, VacationRequestDetailsDTO> = {
  submitted: {
    ...mockVacationRequests.submitted,
    user: {
      id: "employee-1-id",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
    },
  },

  approved: {
    ...mockVacationRequests.approved,
    user: {
      id: "employee-2-id",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@example.com",
    },
    approvedBy: {
      id: "hr-user-id",
      firstName: "HR",
      lastName: "Manager",
      email: "hr@example.com",
    },
    approvedAt: "2026-01-31T10:00:00Z",
  },
};

/**
 * Mock RPC responses for vacation requests
 */
export const mockVacationRequestRpcResponse = [
  mockVacationRequests.submitted,
  mockVacationRequests.approved,
  mockVacationRequests.rejected,
  mockVacationRequests.cancelled,
];

/**
 * Mock threshold warning response
 */
export const mockThresholdWarning = {
  exceedsThreshold: true,
  currentOccupancy: 75,
  threshold: 50,
  affectedMembers: [
    {
      id: "employee-1-id",
      firstName: "John",
      lastName: "Doe",
    },
    {
      id: "employee-2-id",
      firstName: "Jane",
      lastName: "Smith",
    },
  ],
};
