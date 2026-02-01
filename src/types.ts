/**
 * DTO (Data Transfer Object) and Command Model Type Definitions
 *
 * This file contains all DTOs used for API communication, derived from database entities.
 * Each DTO is connected to one or more database entities from database.types.ts
 */

import type { Database } from "./db/database.types";

// ============================================================================
// Database Entity Type Aliases
// ============================================================================

// Note: Some legacy table types are commented out as they don't exist in current schema
// type Users = Database["public"]["Tables"]["users"]["Row"];
// type Vacations = Database["public"]["Tables"]["vacations"]["Row"];
// type UserVacations = Database["public"]["Tables"]["user_vacations"]["Row"];
type VacationRequests = Database["public"]["Tables"]["vacation_requests"]["Row"];
// type Notifications = Database["public"]["Tables"]["notifications"]["Row"];
// type AuditLogs = Database["public"]["Tables"]["audit_logs"]["Row"];

// Insert types for creating new records
// type UsersInsert = Database["public"]["Tables"]["users"]["Insert"];
// type VacationsInsert = Database["public"]["Tables"]["vacations"]["Insert"];
// type UserVacationsInsert = Database["public"]["Tables"]["user_vacations"]["Insert"];
type VacationRequestsInsert = Database["public"]["Tables"]["vacation_requests"]["Insert"];
// type NotificationsInsert = Database["public"]["Tables"]["notifications"]["Insert"];

// ============================================================================
// Common/Shared DTOs
// ============================================================================

/**
 * Generic API response wrapper
 * Used to standardize all API responses
 */
export interface ApiResponseDTO<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Pagination metadata
 * Used in paginated list responses
 */
export interface PaginationMetaDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Generic paginated response wrapper
 * Combines data array with pagination metadata
 */
export interface PaginatedResponseDTO<T> {
  data: T[];
  meta: PaginationMetaDTO;
}

// ============================================================================
// Authentication DTOs
// ============================================================================

/**
 * Login request payload
 * Used for user authentication
 */
export interface LoginRequestDTO {
  email: string;
  password: string;
}

/**
 * Registration request payload
 * Extends login with additional user information
 */
export interface RegisterRequestDTO {
  email: string;
  password: string;
  full_name: string;
  role?: "user" | "admin";
}

/**
 * User DTO - Public user information
 * Derived from Users entity, excludes sensitive fields
 * NOTE: Legacy type - commented out as Users table doesn't exist in current schema
 */
// export type UserDTO = Pick<Users, "id" | "email" | "full_name" | "role" | "created_at" | "updated_at">;

/**
 * Session information
 * Returned after successful authentication
 */
export interface SessionDTO {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

/**
 * Complete authentication response
 * Combines user information with session tokens
 * NOTE: Legacy type - commented out as UserDTO doesn't exist
 */
// export interface AuthResponseDTO {
//   user: UserDTO;
//   session: SessionDTO;
// }

// ============================================================================
// Vacation DTOs (LEGACY - tables don't exist in current schema)
// ============================================================================

/**
 * Create vacation command
 * Based on VacationsInsert, used for creating new vacations
 * NOTE: Legacy type - Vacations table doesn't exist in current schema
 */
// export interface CreateVacationDTO {
//   name: string;
//   description: string;
//   start_date: string;
//   end_date: string;
//   location?: string;
//   max_participants?: number;
// }

/**
 * Update vacation command
 * Partial version allows updating individual fields
 * NOTE: Legacy type
 */
// export type UpdateVacationDTO = Partial<CreateVacationDTO>;

/**
 * Basic vacation DTO
 * Derived from Vacations entity with additional computed fields
 * NOTE: Legacy type - Vacations table doesn't exist in current schema
 */
// export type VacationDTO = Vacations & {
//   participants_count: number;
//   user_status?: "pending" | "approved" | "rejected" | "none";
// };

/**
 * Vacation list item DTO
 * Simplified version for list views, optimized for performance
 * NOTE: Legacy type
 */
// export type VacationListItemDTO = Pick<
//   Vacations,
//   "id" | "name" | "start_date" | "end_date" | "location" | "status" | "created_by"
// > & {
//   participants_count: number;
//   user_status?: "pending" | "approved" | "rejected" | "none";
// };

/**
 * Vacation details DTO
 * Extended version with full participant information
 * NOTE: Legacy type
 */
// export type VacationDetailsDTO = VacationDTO & {
//   participants: UserVacationDTO[];
//   created_by_user?: Pick<Users, "id" | "full_name" | "email">;
// };

// ============================================================================
// Vacation Request DTOs (LEGACY - old schema)
// ============================================================================

/**
 * Create vacation request command
 * Used when user requests to join a vacation
 * NOTE: Legacy type - old vacation_requests schema
 */
// export interface CreateVacationRequestDTO {
//   vacation_id: string;
// }

/**
 * Update vacation request command
 * Used by admin to approve/reject requests
 * NOTE: Legacy type
 */
// export interface UpdateVacationRequestDTO {
//   status: "pending" | "approved" | "rejected";
//   admin_notes?: string;
// }

/**
 * Vacation request DTO
 * Derived from VacationRequests with denormalized user and vacation names
 * NOTE: Legacy type
 */
// export type VacationRequestDTO = VacationRequests & {
//   user_name: string;
//   vacation_name: string;
// };


// ============================================================================
// User Vacation DTOs (LEGACY - tables don't exist)
// ============================================================================

/**
 * User vacation DTO
 * Represents the many-to-many relationship between users and vacations
 * with denormalized names for convenience
 * NOTE: Legacy type
 */
// export type UserVacationDTO = UserVacations & {
//   user_name: string;
//   vacation_name: string;
// };

/**
 * Create user vacation command
 * Used to directly add a user to a vacation (admin action)
 * NOTE: Legacy type
 */
// export interface CreateUserVacationDTO {
//   vacation_id: string;
//   user_id: string;
//   role?: "participant" | "organizer";
// }

/**
 * Update user vacation command
 * Allows changing role or status
 * NOTE: Legacy type
 */
// export interface UpdateUserVacationDTO {
//   role?: "participant" | "organizer";
//   status?: "active" | "cancelled" | "completed";
// }

// ============================================================================
// Notification DTOs (LEGACY - tables don't exist)
// ============================================================================

/**
 * Notification DTO
 * Direct mapping from Notifications entity
 * NOTE: Legacy type
 */
// export type NotificationDTO = Notifications;

/**
 * Create notification command
 * Omits auto-generated fields (id, timestamps)
 * NOTE: Legacy type
 */
// export type CreateNotificationDTO = Omit<NotificationsInsert, "id" | "created_at" | "read_at">;

/**
 * Mark notification as read command
 */
export interface MarkNotificationReadDTO {
  notification_id: string;
}

/**
 * Bulk mark notifications as read command
 */
export interface MarkAllNotificationsReadDTO {
  user_id: string;
}

// ============================================================================
// Audit Log DTOs
// ============================================================================

/**
 * Audit log DTO
 * Derived from AuditLogs with user email for easier reading
 */
// export type AuditLogDTO = AuditLogs & {
//   user_email?: string;
// };

/**
 * Audit log filter DTO
 * Used for filtering and pagination in audit log queries
 */
export interface AuditLogFilterDTO {
  user_id?: string;
  action?: string;
  entity_type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// Statistics DTOs
// ============================================================================

/**
 * User statistics DTO
 * Aggregated statistics for a user
 */
export interface UserStatisticsDTO {
  user_id: string;
  total_vacations: number;
  active_vacations: number;
  completed_vacations: number;
  cancelled_vacations: number;
  pending_requests: number;
}

/**
 * Vacation statistics DTO
 * Aggregated statistics for a vacation
 */
export interface VacationStatisticsDTO {
  vacation_id: string;
  total_participants: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  available_slots?: number;
}

/**
 * System statistics DTO
 * Overall system statistics (admin view)
 */
export interface SystemStatisticsDTO {
  total_users: number;
  total_vacations: number;
  active_vacations: number;
  draft_vacations: number;
  completed_vacations: number;
  cancelled_vacations: number;
  total_requests: number;
  pending_requests: number;
}

// ============================================================================
// Filter and Query DTOs
// ============================================================================

/**
 * Vacation filter DTO
 * Used for filtering vacation lists
 */
export interface VacationFilterDTO {
  status?: "draft" | "published" | "ongoing" | "completed" | "cancelled";
  start_date_from?: string;
  start_date_to?: string;
  end_date_from?: string;
  end_date_to?: string;
  location?: string;
  created_by?: string;
  has_available_slots?: boolean;
  page?: number;
  limit?: number;
  sort_by?: "start_date" | "end_date" | "created_at" | "name";
  sort_order?: "asc" | "desc";
}

/**
 * User filter DTO
 * Used for filtering user lists (admin)
 */
export interface UserFilterDTO {
  role?: "user" | "admin";
  search?: string; // Search in email or full_name
  page?: number;
  limit?: number;
  sort_by?: "created_at" | "full_name" | "email";
  sort_order?: "asc" | "desc";
}

/**
 * Vacation request filter DTO
 * Used for filtering vacation request lists
 */
export interface VacationRequestFilterDTO {
  vacation_id?: string;
  user_id?: string;
  status?: "pending" | "approved" | "rejected";
  page?: number;
  limit?: number;
  sort_by?: "created_at" | "reviewed_at";
  sort_order?: "asc" | "desc";
}

// ============================================================================
// Error DTOs
// ============================================================================

/**
 * Validation error detail
 * Used in validation error responses
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
}

/**
 * Validation error DTO
 * Extended error response for validation failures
 */
export interface ValidationErrorDTO {
  success: false;
  error: string;
  validation_errors: ValidationErrorDetail[];
}

// ============================================================================
// Health Check DTO
// ============================================================================

/**
 * Health check response DTO
 * Used for system health monitoring
 */
export interface HealthCheckDTO {
  status: "ok" | "error";
  timestamp: string;
  services: {
    database: "ok" | "error";
    auth: "ok" | "error";
  };
}

// ============================================================================
// Users List DTOs
// ============================================================================

/**
 * Get users query parameters DTO
 * Used for filtering and paginating user lists
 */
export interface GetUsersQueryDTO {
  limit?: number;
  offset?: number;
  role?: "ADMINISTRATOR" | "HR" | "EMPLOYEE";
  includeDeleted?: boolean;
  teamId?: string;
}

/**
 * User list item DTO
 * Derived from profiles table, represents a single user in the list
 * Connected to: Database['public']['Tables']['profiles']['Row']
 */
export interface UserListItemDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMINISTRATOR" | "HR" | "EMPLOYEE";
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Pagination metadata for users list
 */
export interface UsersPaginationDTO {
  total: number;
  limit: number;
  offset: number;
}

/**
 * Get users response DTO
 * Complete response with data and pagination
 */
export interface GetUsersResponseDTO {
  data: UserListItemDTO[];
  pagination: UsersPaginationDTO;
}

/**
 * Team reference DTO
 * Simplified team information for user details
 */
export interface TeamReferenceDTO {
  id: string;
  name: string;
}

/**
 * User details DTO
 * Extended user information with team memberships
 * Connected to: Database['public']['Tables']['profiles']['Row']
 * Connected to: Database['public']['Tables']['teams']['Row'] (through team_members)
 */
export interface UserDetailsDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMINISTRATOR" | "HR" | "EMPLOYEE";
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  teams: TeamReferenceDTO[];
}

/**
 * Get user by ID response DTO
 * Complete response with user details
 */
export interface GetUserByIdResponseDTO {
  data: UserDetailsDTO;
}

/**
 * Create user command DTO
 * Used by administrators to create new users
 * Connected to: Database['public']['Tables']['profiles']['Insert']
 */
export interface CreateUserDTO {
  firstName: string;
  lastName: string;
  email: string;
  role?: "ADMINISTRATOR" | "HR" | "EMPLOYEE";
  temporaryPassword: string;
}

/**
 * Create user response DTO
 * Returned after successful user creation
 */
export interface CreateUserResponseDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMINISTRATOR" | "HR" | "EMPLOYEE";
  requiresPasswordReset: boolean;
  createdAt: string;
}

/**
 * Update user command DTO
 * Used to update user profile information
 * All fields are optional, but at least one must be provided
 */
export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  role?: "ADMINISTRATOR" | "HR" | "EMPLOYEE";
}

/**
 * Update user response DTO
 * Returned after successful user update
 */
export interface UpdateUserResponseDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMINISTRATOR" | "HR" | "EMPLOYEE";
  updatedAt: string;
}

/**
 * Delete user response DTO
 * Returned after successful user deletion (soft-delete)
 */
export interface DeleteUserResponseDTO {
  message: string;
  id: string;
  deletedAt: string;
  cancelledVacations: number;
}

// ============================================================================
// Teams DTOs
// ============================================================================

/**
 * Get teams query parameters DTO
 * Used for filtering and paginating teams lists
 */
export interface GetTeamsQueryDTO {
  limit?: number;
  offset?: number;
  includeMemberCount?: boolean;
}

/**
 * Team list item DTO
 * Derived from teams table, represents a single team in the list
 * Connected to: Database['public']['Tables']['teams']['Row']
 */
export interface TeamListItemDTO {
  id: string;
  name: string;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Pagination metadata for teams list
 */
export interface TeamsPaginationDTO {
  total: number;
  limit: number;
  offset: number;
}

/**
 * Get teams response DTO
 * Complete response with data and pagination
 */
export interface GetTeamsResponseDTO {
  data: TeamListItemDTO[];
  pagination: TeamsPaginationDTO;
}

/**
 * Team member DTO
 * Simplified user information for team details
 * Connected to: Database['public']['Tables']['profiles']['Row']
 * Connected to: Database['public']['Tables']['team_members']['Row']
 */
export interface TeamMemberDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMINISTRATOR" | "HR" | "EMPLOYEE";
  joinedAt: string;
}

/**
 * Team details DTO
 * Extended team information with members list
 * Connected to: Database['public']['Tables']['teams']['Row']
 */
export interface TeamDetailsDTO {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMemberDTO[];
}

/**
 * Get team by ID response DTO
 * Complete response with team details
 */
export interface GetTeamByIdResponseDTO {
  data: TeamDetailsDTO;
}

/**
 * Create team command DTO
 * Used by HR to create new teams
 * Connected to: Database['public']['Tables']['teams']['Insert']
 */
export interface CreateTeamDTO {
  name: string;
}

/**
 * Create team response DTO
 * Returned after successful team creation
 */
export interface CreateTeamResponseDTO {
  id: string;
  name: string;
  createdAt: string;
}

/**
 * Update team command DTO
 * Used to update team information
 */
export interface UpdateTeamDTO {
  name: string;
}

/**
 * Update team response DTO
 * Returned after successful team update
 */
export interface UpdateTeamResponseDTO {
  id: string;
  name: string;
  updatedAt: string;
}

/**
 * Delete team response DTO
 * Returned after successful team deletion
 */
export interface DeleteTeamResponseDTO {
  message: string;
  id: string;
}

// ============================================================================
// Team Members DTOs
// ============================================================================

/**
 * Add team members command DTO
 * Used by HR to add multiple users to a team
 * Connected to: Database['public']['Tables']['team_members']['Insert']
 */
export interface AddTeamMembersDTO {
  userIds: string[];
}

/**
 * Team membership DTO
 * Represents a single team membership record
 * Connected to: Database['public']['Tables']['team_members']['Row']
 */
export interface TeamMembershipDTO {
  id: string;
  userId: string;
  teamId: string;
  createdAt: string;
}

/**
 * Add team members response DTO
 * Returned after successfully adding members to team
 */
export interface AddTeamMembersResponseDTO {
  message: string;
  added: TeamMembershipDTO[];
}

/**
 * Remove team member response DTO
 * Returned after successfully removing a member from team
 */
export interface RemoveTeamMemberResponseDTO {
  message: string;
}

// ============================================================================
// Team Calendar DTOs
// ============================================================================

/**
 * Get team calendar query parameters DTO
 * Used for filtering team vacation calendar
 */
export interface GetTeamCalendarQueryDTO {
  startDate?: string; // ISO date format YYYY-MM-DD
  endDate?: string; // ISO date format YYYY-MM-DD
  month?: string; // Format YYYY-MM
  includeStatus?: ("SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED")[];
}

/**
 * Team calendar vacation DTO
 * Represents a vacation period for a team member
 * Connected to: Database['public']['Tables']['vacation_requests']['Row']
 */
export interface TeamCalendarVacationDTO {
  id: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  businessDaysCount: number;
  status: "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";
}

/**
 * Team calendar member DTO
 * Represents a team member with their vacations
 * Connected to: Database['public']['Tables']['profiles']['Row']
 * Connected to: Database['public']['Tables']['vacation_requests']['Row']
 */
export interface TeamCalendarMemberDTO {
  id: string;
  firstName: string;
  lastName: string;
  vacations: TeamCalendarVacationDTO[];
}

/**
 * Get team calendar response DTO
 * Complete calendar view for a team
 */
export interface GetTeamCalendarResponseDTO {
  teamId: string;
  teamName: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  members: TeamCalendarMemberDTO[];
}

// ============================================================================
// Vacation Requests DTOs
// ============================================================================

/**
 * Get vacation requests query parameters DTO
 * Used for filtering and paginating vacation requests list
 */
export interface GetVacationRequestsQueryDTO {
  limit?: number;
  offset?: number;
  status?: ("SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED")[];
  userId?: string;
  teamId?: string;
  startDate?: string; // ISO date format YYYY-MM-DD
  endDate?: string; // ISO date format YYYY-MM-DD
}

/**
 * Vacation request list item DTO
 * Represents a single vacation request in the list
 * Connected to: Database['public']['Tables']['vacation_requests']['Row']
 * Connected to: Database['public']['Tables']['profiles']['Row']
 */
export interface VacationRequestListItemDTO {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  startDate: string; // ISO date
  endDate: string; // ISO date
  businessDaysCount: number;
  status: "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";
  processedByUserId: string | null;
  processedAt: string | null; // ISO datetime
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

/**
 * Pagination metadata for vacation requests list
 */
export interface VacationRequestsPaginationDTO {
  total: number;
  limit: number;
  offset: number;
}

/**
 * Get vacation requests response DTO
 * Complete response with data and pagination
 */
export interface GetVacationRequestsResponseDTO {
  data: VacationRequestListItemDTO[];
  pagination: VacationRequestsPaginationDTO;
}

/**
 * Vacation request details DTO
 * Extended version with full user and processedBy information
 * Connected to: Database['public']['Tables']['vacation_requests']['Row']
 * Connected to: Database['public']['Tables']['profiles']['Row']
 */
export interface VacationRequestDetailsDTO {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  startDate: string; // ISO date
  endDate: string; // ISO date
  businessDaysCount: number;
  status: "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";
  processedByUserId: string | null;
  processedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  processedAt: string | null; // ISO datetime
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

/**
 * Get vacation request by ID response DTO
 */
export interface GetVacationRequestByIdResponseDTO {
  data: VacationRequestDetailsDTO;
}

/**
 * Create vacation request command DTO
 * Used by employees to submit new vacation requests
 */
export interface CreateVacationRequestDTO {
  startDate: string; // ISO date format YYYY-MM-DD
  endDate: string; // ISO date format YYYY-MM-DD
}

/**
 * Create vacation request response DTO
 * Returned after successful vacation request creation
 */
export interface CreateVacationRequestResponseDTO {
  id: string;
  userId: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  businessDaysCount: number;
  status: "SUBMITTED";
  createdAt: string; // ISO datetime
}

// ============================================================================
// Vacation Request Actions DTOs
// ============================================================================

/**
 * Approve vacation request command DTO
 * Used by HR to approve vacation requests with threshold warning acknowledgment
 */
export interface ApproveVacationRequestDTO {
  acknowledgeThresholdWarning?: boolean;
}

/**
 * Threshold warning DTO
 * Information about team occupancy threshold status
 */
export interface ThresholdWarningDTO {
  hasWarning: boolean;
  teamOccupancy: number;
  threshold: number;
  message: string;
}

/**
 * Approve vacation request response DTO
 * Returned after approval attempt (with or without warning)
 */
export interface ApproveVacationRequestResponseDTO {
  id: string;
  status: "APPROVED";
  processedByUserId: string;
  processedAt: string; // ISO datetime
  thresholdWarning: ThresholdWarningDTO | null;
}

/**
 * Reject vacation request command DTO
 * Used by HR to reject vacation requests with reason
 */
export interface RejectVacationRequestDTO {
  reason: string;
}

/**
 * Reject vacation request response DTO
 * Returned after successful rejection
 */
export interface RejectVacationRequestResponseDTO {
  id: string;
  status: "REJECTED";
  processedByUserId: string;
  processedAt: string; // ISO datetime
}

/**
 * Cancel vacation request response DTO
 * Returned after successful cancellation by employee
 */
export interface CancelVacationRequestResponseDTO {
  id: string;
  status: "CANCELLED";
  daysReturned: number;
  updatedAt: string; // ISO datetime
}

// ============================================================================
// Vacation Allowances DTOs
// ============================================================================

/**
 * Get vacation allowances query parameters DTO
 * Used for filtering allowances by year
 */
export interface GetVacationAllowancesQueryDTO {
  year?: number; // Optional filter by specific year (2000-2100)
}

/**
 * Vacation allowance DTO with computed fields
 * Connected to: Database['public']['Tables']['vacation_allowances']['Row']
 * Connected to: Database['public']['Tables']['vacation_requests']['Row'] (for calculations)
 */
export interface VacationAllowanceDTO {
  id: string;
  userId: string;
  year: number;
  totalDays: number;
  carryoverDays: number;

  // Computed fields - calculated from vacation_requests
  usedDays: number; // Total used days (carryover + current year)
  usedCarryoverDays: number; // Used days from carryover
  usedCurrentYearDays: number; // Used days from current year
  remainingDays: number; // Total remaining days
  remainingCarryoverDays: number; // Remaining carryover days
  remainingCurrentYearDays: number; // Remaining current year days

  carryoverExpiresAt: string; // ISO date (YYYY-MM-DD) - always March 31st of the year
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

/**
 * Get vacation allowances response DTO
 * Returns list of allowances for user
 */
export interface GetVacationAllowancesResponseDTO {
  userId: string;
  allowances: VacationAllowanceDTO[];
}

/**
 * Get vacation allowance by year response DTO
 * Returns single allowance for specific year
 */
export interface GetVacationAllowanceByYearResponseDTO {
  data: VacationAllowanceDTO;
}

/**
 * Create vacation allowance command DTO
 * Used by HR to create new vacation allowances for users
 * Connected to: Database['public']['Tables']['vacation_allowances']['Insert']
 */
export interface CreateVacationAllowanceDTO {
  userId: string;
  year: number;
  totalDays: number;
  carryoverDays: number;
}

/**
 * Create vacation allowance response DTO
 * Returned after successful vacation allowance creation
 */
export interface CreateVacationAllowanceResponseDTO {
  id: string;
  userId: string;
  year: number;
  totalDays: number;
  carryoverDays: number;
  createdAt: string;
}

/**
 * Update vacation allowance command DTO
 * Used by HR to update existing vacation allowances
 * At least one field must be provided
 */
export interface UpdateVacationAllowanceDTO {
  totalDays?: number;
  carryoverDays?: number;
}

/**
 * Update vacation allowance response DTO
 * Returned after successful vacation allowance update
 */
export interface UpdateVacationAllowanceResponseDTO {
  id: string;
  userId: string;
  year: number;
  totalDays: number;
  carryoverDays: number;
  updatedAt: string;
}

// ============================================================================
// Settings DTOs
// ============================================================================

/**
 * Setting DTO
 * Represents a single global setting
 * Connected to: Database['public']['Tables']['settings']['Row']
 */
export interface SettingDTO {
  key: string;
  value: number;
  description: string | null;
  updatedAt: string; // ISO datetime
}

/**
 * Get all settings response DTO
 * Complete response with all settings
 */
export interface GetAllSettingsResponseDTO {
  data: SettingDTO[];
}

/**
 * Get setting by key response DTO
 * Response for single setting
 */
export interface GetSettingResponseDTO extends SettingDTO {}

/**
 * Update setting command DTO
 * Used by HR to update setting values
 */
export interface UpdateSettingDTO {
  value: number;
}

/**
 * Update setting response DTO
 * Returned after successful setting update
 */
export interface UpdateSettingResponseDTO extends SettingDTO {}

// ============================================================================
// Calendar View Models (Frontend-specific types)
// ============================================================================

/**
 * Vacation Request View Model for Calendar
 * Frontend representation of vacation request for calendar display
 * Based on VacationRequestListItemDTO and TeamCalendarVacationDTO
 */
export interface VacationRequestViewModel {
  id: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  businessDaysCount: number;
  status: "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Team Member View Model for Calendar
 * Frontend representation of team member with their vacations
 * Based on TeamCalendarMemberDTO
 */
export interface TeamMemberViewModel {
  id: string;
  firstName: string;
  lastName: string;
  vacations: VacationRequestViewModel[];
}

/**
 * Team Calendar View Model
 * Complete calendar data for displaying team vacations
 * Based on GetTeamCalendarResponseDTO
 */
export interface TeamCalendarViewModel {
  teamId: string;
  teamName: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  members: TeamMemberViewModel[];
}

