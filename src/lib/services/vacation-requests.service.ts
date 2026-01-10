/**
 * Vacation Requests Service
 * Handles business logic for vacation requests operations
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type {
  GetVacationRequestsQueryDTO,
  GetVacationRequestsResponseDTO,
  VacationRequestListItemDTO,
} from "@/types";

/**
 * Get vacation requests list with pagination and filtering
 * Implements RBAC (Role-Based Access Control):
 * - EMPLOYEE: Can only view their own vacation requests
 * - HR: Can view requests from team members
 * - ADMINISTRATOR: Can view all requests
 *
 * @param supabase - Supabase client from context.locals
 * @param currentUserId - ID of the current user
 * @param query - Query parameters for filtering and pagination
 * @returns Promise with vacation requests data and pagination metadata
 * @throws Error if validation fails or user lacks permissions
 */
export async function getVacationRequests(
  supabase: SupabaseClient,
  currentUserId: string,
  query: GetVacationRequestsQueryDTO
): Promise<GetVacationRequestsResponseDTO> {
  const {
    limit = 50,
    offset = 0,
    status,
    userId,
    teamId,
    startDate,
    endDate,
  } = query;

  // 1. Get current user's role for RBAC
  const { data: currentUser, error: userError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUserId)
    .single();

  if (userError || !currentUser) {
    console.error("[VacationRequestsService] Failed to fetch current user:", userError);
    throw new Error("Failed to verify user permissions");
  }

  const userRole = currentUser.role as "ADMINISTRATOR" | "HR" | "EMPLOYEE";

  // 2. Apply RBAC rules
  let effectiveUserId: string | undefined = userId;
  let effectiveTeamIds: string[] | undefined = undefined;

  if (userRole === "EMPLOYEE") {
    // EMPLOYEE can only view their own requests
    if (userId && userId !== currentUserId) {
      throw new Error("You can only view your own vacation requests");
    }
    effectiveUserId = currentUserId;
  } else if (userRole === "HR") {
    // HR can view requests from their team members
    // Get teams where user is a member
    const { data: userTeams, error: teamsError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", currentUserId);

    if (teamsError) {
      console.error("[VacationRequestsService] Failed to fetch user teams:", teamsError);
      throw new Error("Failed to fetch user teams");
    }

    const userTeamIds = (userTeams || []).map((tm) => tm.team_id);

    if (teamId) {
      // Check if HR is member of requested team
      if (!userTeamIds.includes(teamId)) {
        throw new Error("You are not a member of this team");
      }
      effectiveTeamIds = [teamId];
    } else {
      // Filter by all HR's teams
      effectiveTeamIds = userTeamIds;
    }

    // If HR has no teams, they can't see any requests (unless userId is specified)
    if (effectiveTeamIds.length === 0 && !userId) {
      return {
        data: [],
        pagination: {
          total: 0,
          limit,
          offset,
        },
      };
    }
  } else if (userRole === "ADMINISTRATOR") {
    // ADMINISTRATOR has no restrictions
    if (teamId) {
      // Validate team exists
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("id")
        .eq("id", teamId)
        .single();

      if (teamError || !team) {
        throw new Error("Team not found");
      }
      effectiveTeamIds = [teamId];
    }
  }

  // 3. Build the query
  let queryBuilder = supabase
    .from("vacation_requests")
    .select(
      `
      id,
      user_id,
      start_date,
      end_date,
      business_days_count,
      status,
      processed_by_user_id,
      processed_at,
      created_at,
      updated_at,
      profiles!vacation_requests_user_id_fkey (
        id,
        first_name,
        last_name
      )
    `,
      { count: "exact" }
    );

  // Apply filters
  if (effectiveUserId) {
    queryBuilder = queryBuilder.eq("user_id", effectiveUserId);
  }

  if (effectiveTeamIds && effectiveTeamIds.length > 0) {
    // For HR: filter by users who are members of their teams
    const { data: teamMembers, error: teamMembersError } = await supabase
      .from("team_members")
      .select("user_id")
      .in("team_id", effectiveTeamIds);

    if (teamMembersError) {
      console.error("[VacationRequestsService] Failed to fetch team members:", teamMembersError);
      throw new Error("Failed to fetch team members");
    }

    const memberUserIds = [...new Set((teamMembers || []).map((tm) => tm.user_id))];

    if (memberUserIds.length === 0) {
      // No members in teams, return empty result
      return {
        data: [],
        pagination: {
          total: 0,
          limit,
          offset,
        },
      };
    }

    queryBuilder = queryBuilder.in("user_id", memberUserIds);
  }

  if (status && status.length > 0) {
    queryBuilder = queryBuilder.in("status", status);
  }

  if (startDate) {
    queryBuilder = queryBuilder.gte("start_date", startDate);
  }

  if (endDate) {
    queryBuilder = queryBuilder.lte("end_date", endDate);
  }

  // Apply sorting, pagination
  queryBuilder = queryBuilder
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // 4. Execute query
  const { data: vacationRequests, error: queryError, count } = await queryBuilder;

  if (queryError) {
    console.error("[VacationRequestsService] Failed to fetch vacation requests:", queryError);
    throw new Error("Failed to fetch vacation requests");
  }

  // 5. Map results to DTOs (snake_case to camelCase)
  const requestsList: VacationRequestListItemDTO[] = (vacationRequests || []).map((vr) => {
    // Extract profile data
    const profile = Array.isArray(vr.profiles) ? vr.profiles[0] : vr.profiles;

    return {
      id: vr.id,
      userId: vr.user_id,
      user: {
        id: profile?.id || vr.user_id,
        firstName: profile?.first_name || "",
        lastName: profile?.last_name || "",
      },
      startDate: vr.start_date,
      endDate: vr.end_date,
      businessDaysCount: vr.business_days_count,
      status: vr.status as "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED",
      processedByUserId: vr.processed_by_user_id,
      processedAt: vr.processed_at,
      createdAt: vr.created_at,
      updatedAt: vr.updated_at,
    };
  });

  // 6. Return response with pagination
  return {
    data: requestsList,
    pagination: {
      total: count || 0,
      limit,
      offset,
    },
  };
}

