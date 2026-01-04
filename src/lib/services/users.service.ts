/**
 * Users Service
 * Handles business logic for user management operations
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type { GetUsersQueryDTO, GetUsersResponseDTO, UserListItemDTO } from "@/types";

/**
 * Get users list with pagination and filtering
 *
 * @param supabase - Supabase client from context.locals
 * @param currentUserId - ID of the current user (for future use with full auth)
 * @param query - Query parameters for filtering and pagination
 * @returns Promise with users data and pagination metadata
 * @throws Error if validation fails
 *
 * NOTE: Currently uses DEFAULT_USER_ID (admin) - full RBAC will be implemented with auth
 */
export async function getUsers(
  supabase: SupabaseClient,
  currentUserId: string,
  query: GetUsersQueryDTO
): Promise<GetUsersResponseDTO> {
  const { limit = 50, offset = 0, role, includeDeleted = false, teamId } = query;

  // 1. If teamId is provided, validate that the team exists
  if (teamId) {
    const { data: team, error: teamError } = await supabase.from("teams").select("id").eq("id", teamId).single();

    if (teamError || !team) {
      throw new Error("Team not found");
    }
  }

  // 2. Call RPC function to get users with emails
  // This function securely joins profiles with auth.users
  const { data: users, error: queryError } = await supabase.rpc("get_users_with_emails", {
    p_limit: limit,
    p_offset: offset,
    p_role: role || null,
    p_include_deleted: includeDeleted,
    p_team_id: teamId || null,
  });

  if (queryError) {
    console.error("[UsersService] Failed to fetch users:", queryError);
    throw new Error("Failed to fetch users");
  }

  // 3. Map results to DTOs (snake_case to camelCase)
  const usersList: UserListItemDTO[] = (users || []).map((user) => ({
    id: user.id,
    firstName: user.first_name ?? "",
    lastName: user.last_name ?? "",
    email: user.email ?? "",
    role: (user.role ?? "EMPLOYEE") as "ADMINISTRATOR" | "HR" | "EMPLOYEE",
    deletedAt: user.deleted_at ?? null,
    createdAt: user.created_at ?? new Date().toISOString(),
    updatedAt: user.updated_at ?? new Date().toISOString(),
  }));

  // 4. Extract total count from first row (or use 0 if no results)
  const totalCount = users && users.length > 0 ? Number(users[0].total_count) : 0;

  // 5. Return response with pagination
  return {
    data: usersList,
    pagination: {
      total: totalCount,
      limit,
      offset,
    },
  };
}
