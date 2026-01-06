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

type Users = Database["public"]["Tables"]["users"]["Row"];
type Vacations = Database["public"]["Tables"]["vacations"]["Row"];
type UserVacations = Database["public"]["Tables"]["user_vacations"]["Row"];
type VacationRequests = Database["public"]["Tables"]["vacation_requests"]["Row"];
type Notifications = Database["public"]["Tables"]["notifications"]["Row"];
type AuditLogs = Database["public"]["Tables"]["audit_logs"]["Row"];

// Insert types for creating new records
type UsersInsert = Database["public"]["Tables"]["users"]["Insert"];
type VacationsInsert = Database["public"]["Tables"]["vacations"]["Insert"];
type UserVacationsInsert = Database["public"]["Tables"]["user_vacations"]["Insert"];
type VacationRequestsInsert = Database["public"]["Tables"]["vacation_requests"]["Insert"];
type NotificationsInsert = Database["public"]["Tables"]["notifications"]["Insert"];

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
 */
export type UserDTO = Pick<Users, "id" | "email" | "full_name" | "role" | "created_at" | "updated_at">;

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
 */
export interface AuthResponseDTO {
  user: UserDTO;
  session: SessionDTO;
}

// ============================================================================
// Vacation DTOs
// ============================================================================

/**
 * Create vacation command
 * Based on VacationsInsert, used for creating new vacations
 */
export interface CreateVacationDTO {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location?: string;
  max_participants?: number;
}

/**
 * Update vacation command
 * Partial version allows updating individual fields
 */
export type UpdateVacationDTO = Partial<CreateVacationDTO>;

/**
 * Basic vacation DTO
 * Derived from Vacations entity with additional computed fields
 */
export type VacationDTO = Vacations & {
  participants_count: number;
  user_status?: "pending" | "approved" | "rejected" | "none";
};

/**
 * Vacation list item DTO
 * Simplified version for list views, optimized for performance
 */
export type VacationListItemDTO = Pick<
  Vacations,
  "id" | "name" | "start_date" | "end_date" | "location" | "status" | "created_by"
> & {
  participants_count: number;
  user_status?: "pending" | "approved" | "rejected" | "none";
};

/**
 * Vacation details DTO
 * Extended version with full participant information
 */
export type VacationDetailsDTO = VacationDTO & {
  participants: UserVacationDTO[];
  created_by_user?: Pick<Users, "id" | "full_name" | "email">;
};

// ============================================================================
// Vacation Request DTOs
// ============================================================================

/**
 * Create vacation request command
 * Used when user requests to join a vacation
 */
export interface CreateVacationRequestDTO {
  vacation_id: string;
}

/**
 * Update vacation request command
 * Used by admin to approve/reject requests
 */
export interface UpdateVacationRequestDTO {
  status: "pending" | "approved" | "rejected";
  admin_notes?: string;
}

/**
 * Vacation request DTO
 * Derived from VacationRequests with denormalized user and vacation names
 */
export type VacationRequestDTO = VacationRequests & {
  user_name: string;
  vacation_name: string;
};

/**
 * Vacation request details DTO
 * Extended version with full user and vacation objects
 */
export type VacationRequestDetailsDTO = VacationRequests & {
  user: Pick<Users, "id" | "full_name" | "email">;
  vacation: Pick<Vacations, "id" | "name" | "start_date" | "end_date" | "status">;
  reviewed_by_user?: Pick<Users, "id" | "full_name" | "email">;
};

// ============================================================================
// User Vacation DTOs
// ============================================================================

/**
 * User vacation DTO
 * Represents the many-to-many relationship between users and vacations
 * with denormalized names for convenience
 */
export type UserVacationDTO = UserVacations & {
  user_name: string;
  vacation_name: string;
};

/**
 * Create user vacation command
 * Used to directly add a user to a vacation (admin action)
 */
export interface CreateUserVacationDTO {
  vacation_id: string;
  user_id: string;
  role?: "participant" | "organizer";
}

/**
 * Update user vacation command
 * Allows changing role or status
 */
export interface UpdateUserVacationDTO {
  role?: "participant" | "organizer";
  status?: "active" | "cancelled" | "completed";
}

// ============================================================================
// Notification DTOs
// ============================================================================

/**
 * Notification DTO
 * Direct mapping from Notifications entity
 */
export type NotificationDTO = Notifications;

/**
 * Create notification command
 * Omits auto-generated fields (id, timestamps)
 */
export type CreateNotificationDTO = Omit<NotificationsInsert, "id" | "created_at" | "read_at">;

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
export type AuditLogDTO = AuditLogs & {
  user_email?: string;
};

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

