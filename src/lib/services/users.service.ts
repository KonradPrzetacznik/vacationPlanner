/**
 * Users Service
 * Handles business logic for user management operations
 */

import type { SupabaseClient } from "@/db/supabase.client";
import { supabaseAdminClient } from "@/db/supabase.client";
import type {
  GetUsersQueryDTO,
  GetUsersResponseDTO,
  UserListItemDTO,
  UserDetailsDTO,
  TeamReferenceDTO,
  CreateUserDTO,
  CreateUserResponseDTO,
  UpdateUserDTO,
  UpdateUserResponseDTO,
  DeleteUserResponseDTO,
} from "@/types";

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
    p_role: role || undefined,
    p_include_deleted: includeDeleted,
    p_team_id: teamId || undefined,
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

/**
 * Get single user by ID with team memberships
 *
 * @param supabase - Supabase client from context.locals
 * @param currentUserId - ID of the current user (for RBAC)
 * @param currentUserRole - Role of the current user (for RBAC)
 * @param userId - ID of the user to retrieve
 * @returns Promise with user details including teams
 * @throws Error if user not found or insufficient permissions
 */
export async function getUserById(
  supabase: SupabaseClient,
  currentUserId: string,
  currentUserRole: "ADMINISTRATOR" | "HR" | "EMPLOYEE",
  userId: string
): Promise<UserDetailsDTO> {
  // Call RPC function to get user with teams
  const { data, error } = await supabase.rpc("get_user_by_id_with_teams", {
    p_user_id: userId,
    p_current_user_id: currentUserId,
    p_current_user_role: currentUserRole,
  });

  if (error) {
    console.error("[UsersService] Failed to fetch user:", error);
    throw new Error("Failed to fetch user");
  }

  // Check if user was found (RPC returns empty array if no access or user doesn't exist)
  if (!data || data.length === 0) {
    throw new Error("User not found");
  }

  const user = data[0];

  // Map result to DTO (snake_case to camelCase)
  return {
    id: user.id,
    firstName: user.first_name ?? "",
    lastName: user.last_name ?? "",
    email: user.email ?? "",
    role: (user.role ?? "EMPLOYEE") as "ADMINISTRATOR" | "HR" | "EMPLOYEE",
    deletedAt: user.deleted_at ?? null,
    createdAt: user.created_at ?? new Date().toISOString(),
    updatedAt: user.updated_at ?? new Date().toISOString(),
    teams: (user.teams as unknown as TeamReferenceDTO[]) ?? [],
  };
}

/**
 * Create a new user
 *
 * @param supabase - Supabase client from context.locals
 * @param data - User creation data
 * @returns Promise with created user details
 * @throws Error if email already exists or creation fails
 *
 * NOTE: Uses Supabase Admin API to invite user by email
 */
export async function createUser(
  supabase: SupabaseClient,
  data: CreateUserDTO
): Promise<CreateUserResponseDTO> {
  const { firstName, lastName, email, role = "EMPLOYEE" } = data;

  // 1. First create profile in profiles table
  // Generate a temporary UUID for the profile
  const tempUserId = crypto.randomUUID();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: tempUserId,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.toLowerCase(),
      role: role,
    })
    .select()
    .single();

  if (profileError) {
    console.error("[UsersService] Failed to create profile:", profileError);

    // Check if error is due to duplicate email
    if (profileError.code === "23505" || profileError.message.includes("duplicate")) {
      throw new Error("User with this email already exists");
    }

    throw new Error("Failed to create user profile");
  }

  // 2. Invite user via Supabase Auth using admin API
  // This will send an email with a link to set their password
  const { data: authUser, error: authError } = await supabaseAdminClient.auth.admin.inviteUserByEmail(
    email.toLowerCase(),
    {
      redirectTo: `${import.meta.env.PROD ? "https://vacationplanner.com" : "http://localhost:3000"}/set-password`,
    }
  );

  if (authError || !authUser.user) {
    console.error("[UsersService] Failed to invite user:", {
      message: authError?.message,
      code: authError?.code,
      status: authError?.status,
    });

    // Clean up profile if auth invite failed
    await supabase.from("profiles").delete().eq("id", tempUserId);

    // Check if error is due to duplicate email
    const errorMsg = authError?.message?.toLowerCase() || "";
    const errorCode = authError?.code?.toLowerCase() || "";

    if (
      errorMsg.includes("already registered") ||
      errorMsg.includes("email already exists") ||
      errorMsg.includes("user already exists") ||
      errorMsg.includes("duplicate") ||
      errorCode === "user_already_exists" ||
      errorCode === "email_exists"
    ) {
      throw new Error("User with this email already exists");
    }

    throw new Error("Failed to send invitation email");
  }

  // 3. Update profile with actual auth user ID
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ id: authUser.user.id })
    .eq("id", tempUserId);

  if (updateError) {
    console.error("[UsersService] Failed to update profile with auth ID:", updateError);
    // Try to clean up
    await supabaseAdminClient.auth.admin.deleteUser(authUser.user.id);
    await supabase.from("profiles").delete().eq("id", tempUserId);
    throw new Error("Failed to complete user creation");
  }

  // 4. Return formatted response
  return {
    id: authUser.user.id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: email.toLowerCase(),
    role: profile.role as "ADMINISTRATOR" | "HR" | "EMPLOYEE",
    requiresPasswordReset: true,
    createdAt: profile.created_at,
  };
}

/**
 * Update user profile
 *
 * @param supabase - Supabase client from context.locals
 * @param userId - ID of the user to update
 * @param data - User update data
 * @param requestingUserId - ID of the user making the request
 * @param requestingUserRole - Role of the user making the request
 * @returns Promise with updated user details
 * @throws Error if user not found, insufficient permissions, or update fails
 */
export async function updateUser(
  supabase: SupabaseClient,
  userId: string,
  data: UpdateUserDTO,
  requestingUserId: string,
  requestingUserRole: "ADMINISTRATOR" | "HR" | "EMPLOYEE"
): Promise<UpdateUserResponseDTO> {
  // 1. Check if user exists and is not deleted
  const { data: existingUser, error: fetchError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .eq("id", userId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !existingUser) {
    throw new Error("User not found");
  }

  // 2. Validate permissions
  if (requestingUserRole === "EMPLOYEE") {
    // Employees can only edit themselves
    if (requestingUserId !== userId) {
      throw new Error("Insufficient permissions: Cannot edit other users");
    }
    // Employees cannot change role
    if (data.role !== undefined) {
      throw new Error("Insufficient permissions: Cannot change user role");
    }
  }

  // 3. Administrators cannot change their own role
  if (requestingUserRole === "ADMINISTRATOR" && requestingUserId === userId && data.role !== undefined) {
    throw new Error("Cannot change your own role");
  }

  // 4. Prepare update data (only fields that are provided)
  const updateData: Record<string, unknown> = {};
  if (data.firstName !== undefined) {
    updateData.first_name = data.firstName.trim();
  }
  if (data.lastName !== undefined) {
    updateData.last_name = data.lastName.trim();
  }
  if (data.role !== undefined && requestingUserRole === "ADMINISTRATOR") {
    updateData.role = data.role;
  }

  // 5. Update profile
  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", userId)
    .select("id, first_name, last_name, role, updated_at")
    .single();

  if (updateError || !updatedProfile) {
    console.error("[UsersService] Failed to update user:", updateError);
    throw new Error("Failed to update user");
  }

  // 6. Get email from auth.users
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const email = authUser.user?.email || "";

  // 7. Return formatted response
  return {
    id: updatedProfile.id,
    firstName: updatedProfile.first_name,
    lastName: updatedProfile.last_name,
    email: email,
    role: updatedProfile.role as "ADMINISTRATOR" | "HR" | "EMPLOYEE",
    updatedAt: updatedProfile.updated_at,
  };
}

/**
 * Soft-delete user and cancel their future vacation requests
 *
 * @param supabase - Supabase client from context.locals
 * @param userId - ID of the user to delete
 * @returns Promise with deletion summary
 * @throws Error if user not found or deletion fails
 */
export async function deleteUser(
  supabase: SupabaseClient,
  userId: string
): Promise<DeleteUserResponseDTO> {
  // 1. Check if user exists and is not already deleted
  const { data: existingUser, error: fetchError } = await supabase
    .from("profiles")
    .select("id, deleted_at")
    .eq("id", userId)
    .single();

  if (fetchError || !existingUser) {
    throw new Error("User not found");
  }

  if (existingUser.deleted_at !== null) {
    throw new Error("User already deleted");
  }

  // 2. Perform soft-delete and cancel future vacations in a transaction-like sequence
  // Note: Supabase doesn't support true transactions via the JS client,
  // but we can do sequential operations and handle rollback manually if needed

  // 2a. Soft-delete the user
  const now = new Date().toISOString();
  const { error: deleteError } = await supabase
    .from("profiles")
    .update({ deleted_at: now })
    .eq("id", userId);

  if (deleteError) {
    console.error("[UsersService] Failed to delete user:", deleteError);
    throw new Error("Failed to delete user");
  }

  // 2b. Find and cancel future vacation requests
  const { data: futureRequests, error: selectError } = await supabase
    .from("vacation_requests")
    .select("id")
    .eq("user_id", userId)
    .gt("start_date", new Date().toISOString())
    .neq("status", "CANCELLED");

  if (selectError) {
    console.error("[UsersService] Failed to fetch vacation requests:", selectError);
    // Don't rollback user deletion, just log the error
  }

  let cancelledCount = 0;
  if (futureRequests && futureRequests.length > 0) {
    const requestIds = futureRequests.map((r) => r.id);

    const { error: cancelError } = await supabase
      .from("vacation_requests")
      .update({ status: "CANCELLED" })
      .in("id", requestIds);

    if (cancelError) {
      console.error("[UsersService] Failed to cancel vacation requests:", cancelError);
      // Don't rollback, just log
    } else {
      cancelledCount = requestIds.length;
    }
  }

  // 3. Return deletion summary
  return {
    message: "User deleted successfully",
    id: userId,
    deletedAt: now,
    cancelledVacations: cancelledCount,
  };
}

