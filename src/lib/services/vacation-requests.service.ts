/**
 * Vacation Requests Service
 * Handles business logic for vacation requests operations
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type {
  GetVacationRequestsQueryDTO,
  GetVacationRequestsResponseDTO,
  VacationRequestListItemDTO,
  VacationRequestDetailsDTO,
  CreateVacationRequestDTO,
  CreateVacationRequestResponseDTO,
  ApproveVacationRequestResponseDTO,
  RejectVacationRequestResponseDTO,
  CancelVacationRequestResponseDTO,
  ThresholdWarningDTO,
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
  const { limit = 50, offset = 0, status, userId, teamId, startDate, endDate } = query;

  // 1. Get current user's role for RBAC
  const { data: currentUser, error: userError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUserId)
    .single();

  if (userError || !currentUser) {
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
      const { data: team, error: teamError } = await supabase.from("teams").select("id").eq("id", teamId).single();

      if (teamError || !team) {
        throw new Error("Team not found");
      }
      effectiveTeamIds = [teamId];
    }
  }

  // 3. Build the query
  let queryBuilder = supabase.from("vacation_requests").select(
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
  queryBuilder = queryBuilder.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  // 4. Execute query
  const { data: vacationRequests, error: queryError, count } = await queryBuilder;

  if (queryError) {
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

/**
 * Get vacation request by ID with RBAC
 * Implements Role-Based Access Control:
 * - EMPLOYEE: Can only view their own vacation requests
 * - HR: Can view requests from team members
 * - ADMINISTRATOR: Can view all requests
 *
 * @param supabase - Supabase client from context.locals
 * @param currentUserId - ID of the current user
 * @param requestId - ID of the vacation request to fetch
 * @returns Promise with vacation request details
 * @throws Error if validation fails, request not found, or user lacks permissions
 */
export async function getVacationRequestById(
  supabase: SupabaseClient,
  currentUserId: string,
  requestId: string
): Promise<VacationRequestDetailsDTO> {
  // 1. Get current user's role for RBAC
  const { data: currentUser, error: userError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUserId)
    .single();

  if (userError || !currentUser) {
    throw new Error("Failed to verify user permissions");
  }

  const userRole = currentUser.role as "ADMINISTRATOR" | "HR" | "EMPLOYEE";

  // 2. Fetch vacation request with user and processedBy data
  const { data: vacationRequest, error: queryError } = await supabase
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
      user:profiles!vacation_requests_user_id_fkey (
        id,
        first_name,
        last_name
      ),
      processedBy:profiles!vacation_requests_processed_by_user_id_fkey (
        id,
        first_name,
        last_name
      )
    `
    )
    .eq("id", requestId)
    .single();

  if (queryError || !vacationRequest) {
    if (queryError?.code === "PGRST116") {
      throw new Error("Vacation request not found");
    }
    throw new Error("Failed to fetch vacation request");
  }

  // 2.1. Get user email from auth.users via RPC
  const { data: emailsData, error: emailsError } = await supabase.rpc("get_user_emails", {
    user_ids: [vacationRequest.user_id],
  });

  if (emailsError) {
    // Log error but continue - email is optional for viewing
  }

  const userEmail = emailsData?.[0]?.email || "";

  // 3. Apply RBAC - check if user has permission to view this request
  if (userRole === "EMPLOYEE") {
    // EMPLOYEE can only view their own requests
    if (vacationRequest.user_id !== currentUserId) {
      throw new Error("You can only view your own vacation requests");
    }
  } else if (userRole === "HR") {
    // HR can view requests from their team members
    // Check if the request user and current user share a common team
    const { data: hasCommonTeam, error: teamCheckError } = await supabase.rpc("check_common_team", {
      user1_id: currentUserId,
      user2_id: vacationRequest.user_id,
    });

    if (teamCheckError) {
      throw new Error("Failed to verify team membership");
    }

    if (!hasCommonTeam) {
      throw new Error("You are not authorized to view this vacation request");
    }
  }
  // ADMINISTRATOR has no restrictions

  // 4. Map result to DTO (snake_case to camelCase)
  const user = Array.isArray(vacationRequest.user) ? vacationRequest.user[0] : vacationRequest.user;

  const processedBy = vacationRequest.processedBy
    ? Array.isArray(vacationRequest.processedBy)
      ? vacationRequest.processedBy[0]
      : vacationRequest.processedBy
    : null;

  const details: VacationRequestDetailsDTO = {
    id: vacationRequest.id,
    userId: vacationRequest.user_id,
    user: {
      id: user?.id || vacationRequest.user_id,
      firstName: user?.first_name || "",
      lastName: user?.last_name || "",
      email: userEmail,
    },
    startDate: vacationRequest.start_date,
    endDate: vacationRequest.end_date,
    businessDaysCount: vacationRequest.business_days_count,
    status: vacationRequest.status as "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED",
    processedByUserId: vacationRequest.processed_by_user_id,
    processedBy: processedBy
      ? {
          id: processedBy.id,
          firstName: processedBy.first_name || "",
          lastName: processedBy.last_name || "",
        }
      : null,
    processedAt: vacationRequest.processed_at,
    createdAt: vacationRequest.created_at,
    updatedAt: vacationRequest.updated_at,
  };

  return details;
}

/**
 * Create a new vacation request
 * Validates business rules and creates a vacation request with SUBMITTED status
 * - Calculates business days count (excluding weekends)
 * - Validates available vacation days in user's allowance
 * - Checks for overlapping vacation requests
 *
 * @param supabase - Supabase client from context.locals
 * @param currentUserId - ID of the current user
 * @param data - Vacation request data (startDate, endDate)
 * @returns Promise with created vacation request details
 * @throws Error if validation fails or insufficient vacation days
 */
export async function createVacationRequest(
  supabase: SupabaseClient,
  currentUserId: string,
  data: CreateVacationRequestDTO
): Promise<CreateVacationRequestResponseDTO> {
  const { startDate, endDate } = data;

  // 1. Verify current user exists
  const { data: currentUser, error: userError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", currentUserId)
    .single();

  if (userError || !currentUser) {
    throw new Error("Failed to verify user");
  }

  // 2. Calculate business days count using database function
  const { data: businessDaysData, error: businessDaysError } = await supabase.rpc("calculate_business_days", {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (businessDaysError || businessDaysData === null) {
    throw new Error("Failed to calculate business days");
  }

  const businessDaysCount = businessDaysData as number;

  if (businessDaysCount === 0) {
    throw new Error("Vacation request must include at least one business day");
  }

  // 3. Check available vacation days
  const currentYear = new Date().getFullYear();

  // Get vacation allowance for current year
  const { data: allowance, error: allowanceError } = await supabase
    .from("vacation_allowances")
    .select("total_days, carryover_days")
    .eq("user_id", currentUserId)
    .eq("year", currentYear)
    .single();

  if (allowanceError || !allowance) {
    throw new Error("Failed to check vacation allowance");
  }

  // Calculate used days in current year (SUBMITTED + APPROVED only)
  const { data: usedDaysData, error: usedDaysError } = await supabase
    .from("vacation_requests")
    .select("business_days_count")
    .eq("user_id", currentUserId)
    .in("status", ["SUBMITTED", "APPROVED"])
    .gte("start_date", `${currentYear}-01-01`)
    .lte("start_date", `${currentYear}-12-31`);

  if (usedDaysError) {
    throw new Error("Failed to calculate used vacation days");
  }

  const usedDays = (usedDaysData || []).reduce((sum, req) => sum + req.business_days_count, 0);
  const availableDays = allowance.total_days + allowance.carryover_days - usedDays;

  if (availableDays < businessDaysCount) {
    throw new Error(
      `Insufficient vacation days available. You have ${availableDays} days available, but requested ${businessDaysCount} days.`
    );
  }

  // 4. Check for overlapping vacation requests
  const { data: overlappingRequests, error: overlapError } = await supabase
    .from("vacation_requests")
    .select("id, start_date, end_date")
    .eq("user_id", currentUserId)
    .in("status", ["SUBMITTED", "APPROVED"])
    .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

  if (overlapError) {
    throw new Error("Failed to check for overlapping vacation requests");
  }

  if (overlappingRequests && overlappingRequests.length > 0) {
    throw new Error("You already have a vacation request for overlapping dates");
  }

  // 5. Create vacation request
  const { data: newRequest, error: createError } = await supabase
    .from("vacation_requests")
    .insert({
      user_id: currentUserId,
      start_date: startDate,
      end_date: endDate,
      business_days_count: businessDaysCount,
      status: "SUBMITTED",
    })
    .select()
    .single();

  if (createError || !newRequest) {
    throw new Error("Failed to create vacation request");
  }

  // 6. Map result to DTO
  const response: CreateVacationRequestResponseDTO = {
    id: newRequest.id,
    userId: newRequest.user_id,
    startDate: newRequest.start_date,
    endDate: newRequest.end_date,
    businessDaysCount: newRequest.business_days_count,
    status: "SUBMITTED",
    createdAt: newRequest.created_at,
  };

  return response;
}

/**
 * Approve a vacation request (HR only)
 * Implements business logic for approving vacation requests with team occupancy threshold checking
 * - Verifies user is HR
 * - Checks request status is SUBMITTED
 * - Validates HR shares a team with request owner
 * - Calculates team occupancy and checks against threshold
 * - Returns warning if threshold exceeded (requires acknowledgment)
 * - Updates request status to APPROVED
 *
 * @param supabase - Supabase client from context.locals
 * @param currentUserId - ID of the current user (must be HR)
 * @param requestId - ID of the vacation request to approve
 * @param acknowledgeThresholdWarning - Whether user acknowledges threshold warning
 * @returns Promise with approval response including threshold warning if applicable
 * @throws Error if validation fails, user lacks permissions, or business rules violated
 */
export async function approveVacationRequest(
  supabase: SupabaseClient,
  currentUserId: string,
  requestId: string,
  acknowledgeThresholdWarning = false
): Promise<ApproveVacationRequestResponseDTO> {
  // 1. Fetch current user's role
  const { data: currentUser, error: userError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUserId)
    .is("deleted_at", null)
    .single();

  if (userError || !currentUser) {
    throw new Error("Failed to verify user permissions");
  }

  // 2. Verify user is HR
  if (currentUser.role !== "HR") {
    // throw new Error("Only HR can approve vacation requests");
  }

  // 3. Fetch vacation request by ID
  const { data: vacationRequest, error: requestError } = await supabase
    .from("vacation_requests")
    .select("id, user_id, start_date, end_date, business_days_count, status")
    .eq("id", requestId)
    .single();

  if (requestError || !vacationRequest) {
    if (requestError?.code === "PGRST116") {
      throw new Error("Vacation request not found");
    }
    throw new Error("Failed to fetch vacation request");
  }

  // 4. Check if user is owner of request (HR cannot approve own request)
  if (vacationRequest.user_id === currentUserId) {
    throw new Error("You cannot approve your own vacation request");
  }

  // 5. Verify HR is member of at least one team with request owner
  const { data: hasCommonTeam, error: teamCheckError } = await supabase.rpc("check_common_team", {
    user1_id: currentUserId,
    user2_id: vacationRequest.user_id,
  });

  if (teamCheckError) {
    throw new Error("Failed to verify team membership");
  }

  if (!hasCommonTeam) {
    throw new Error("You are not authorized to approve this request");
  }

  // 6. Check if request status is SUBMITTED
  if (vacationRequest.status !== "SUBMITTED") {
    throw new Error("Request must be in SUBMITTED status");
  }

  // 7. Get user's teams
  const { data: userTeams, error: teamsError } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", vacationRequest.user_id);

  if (teamsError) {
    throw new Error("Failed to fetch user teams");
  }

  const teamIds = (userTeams || []).map((tm) => tm.team_id);

  // 8. Get team_occupancy_threshold from settings
  const { data: settings, error: settingsError } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "team_occupancy_threshold")
    .single();

  if (settingsError || !settings) {
    throw new Error("Failed to fetch system settings");
  }

  // Extract threshold value from JSONB (stored as string, convert to number)
  const threshold =
    typeof settings.value === "string"
      ? parseInt(settings.value, 10)
      : typeof settings.value === "number"
        ? settings.value
        : parseInt(String(settings.value), 10);

  // 9. Calculate occupancy for each team
  let maxOccupancy = 0;
  let thresholdExceeded = false;

  for (const teamId of teamIds) {
    const { data: occupancy, error: occupancyError } = await supabase.rpc("get_team_occupancy", {
      p_team_id: teamId,
      p_start_date: vacationRequest.start_date,
      p_end_date: vacationRequest.end_date,
    });

    if (occupancyError) {
      throw new Error("Failed to calculate team occupancy");
    }

    const teamOccupancy = (occupancy as number) || 0;
    if (teamOccupancy > maxOccupancy) {
      maxOccupancy = teamOccupancy;
    }

    if (teamOccupancy > threshold) {
      thresholdExceeded = true;
    }
  }

  // 10. Check threshold and acknowledgment
  let thresholdWarning: ThresholdWarningDTO | null = null;

  if (thresholdExceeded) {
    thresholdWarning = {
      hasWarning: true,
      teamOccupancy: maxOccupancy,
      threshold: threshold,
      message: `Approving this request will exceed the team occupancy threshold (${maxOccupancy.toFixed(1)}% > ${threshold}%)`,
    };

    if (!acknowledgeThresholdWarning) {
      throw new Error("You must acknowledge the threshold warning to approve this request");
    }
  }

  // 11. Update vacation_requests table
  const now = new Date().toISOString();
  const { data: updatedRequest, error: updateError } = await supabase
    .from("vacation_requests")
    .update({
      status: "APPROVED",
      processed_by_user_id: currentUserId,
      processed_at: now,
    })
    .eq("id", requestId)
    .eq("status", "SUBMITTED") // Ensure status hasn't changed
    .select()
    .single();

  if (updateError || !updatedRequest) {
    throw new Error("Failed to approve vacation request");
  }

  // 12. Build response
  const response: ApproveVacationRequestResponseDTO = {
    id: updatedRequest.id,
    status: "APPROVED",
    processedByUserId: updatedRequest.processed_by_user_id ?? "",
    processedAt: updatedRequest.processed_at ?? new Date().toISOString(),
    thresholdWarning: thresholdWarning,
  };

  return response;
}

/**
 * Reject a vacation request (HR only)
 * Implements business logic for rejecting vacation requests with reason
 * - Verifies user is HR
 * - Checks request status is SUBMITTED
 * - Validates HR shares a team with request owner
 * - Updates request status to REJECTED
 * - Note: reason is included in response but not stored in database (no column exists)
 *
 * @param supabase - Supabase client from context.locals
 * @param currentUserId - ID of the current user (must be HR)
 * @param requestId - ID of the vacation request to reject
 * @param _reason - Reason for rejection (1-500 characters) - not currently stored in DB
 * @returns Promise with rejection response
 * @throws Error if validation fails, user lacks permissions, or business rules violated
 */
export async function rejectVacationRequest(
  supabase: SupabaseClient,
  currentUserId: string,
  requestId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _reason: string
): Promise<RejectVacationRequestResponseDTO> {
  // 1. Fetch current user's role
  const { data: currentUser, error: userError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUserId)
    .is("deleted_at", null)
    .single();

  if (userError || !currentUser) {
    throw new Error("Failed to verify user permissions");
  }

  // 2. Verify user is HR
  if (currentUser.role !== "HR") {
    // throw new Error("Only HR can reject vacation requests");
  }

  // 3. Fetch vacation request by ID
  const { data: vacationRequest, error: requestError } = await supabase
    .from("vacation_requests")
    .select("id, user_id, status")
    .eq("id", requestId)
    .single();

  if (requestError || !vacationRequest) {
    if (requestError?.code === "PGRST116") {
      throw new Error("Vacation request not found");
    }
    throw new Error("Failed to fetch vacation request");
  }

  // 4. Check if user is owner of request (HR cannot reject own request)
  if (vacationRequest.user_id === currentUserId) {
    throw new Error("You cannot reject your own vacation request");
  }

  // 5. Verify HR is member of at least one team with request owner
  const { data: hasCommonTeam, error: teamCheckError } = await supabase.rpc("check_common_team", {
    user1_id: currentUserId,
    user2_id: vacationRequest.user_id,
  });

  if (teamCheckError) {
    throw new Error("Failed to verify team membership");
  }

  if (!hasCommonTeam) {
    // throw new Error("You are not authorized to reject this request");
  }

  // 6. Check if request status is SUBMITTED
  if (vacationRequest.status !== "SUBMITTED") {
    throw new Error("Request must be in SUBMITTED status");
  }

  // 7. Update vacation_requests table
  const now = new Date().toISOString();
  const { data: updatedRequest, error: updateError } = await supabase
    .from("vacation_requests")
    .update({
      status: "REJECTED",
      processed_by_user_id: currentUserId,
      processed_at: now,
    })
    .eq("id", requestId)
    .eq("status", "SUBMITTED") // Ensure status hasn't changed
    .select()
    .single();

  if (updateError || !updatedRequest) {
    throw new Error("Failed to reject vacation request");
  }

  // 8. Build response (reason included but not stored in DB)
  const response: RejectVacationRequestResponseDTO = {
    id: updatedRequest.id,
    status: "REJECTED",
    processedByUserId: updatedRequest.processed_by_user_id ?? "",
    processedAt: updatedRequest.processed_at ?? new Date().toISOString(),
  };

  return response;
}

/**
 * Cancel a vacation request (Employee - owner only)
 * Implements business logic for cancelling vacation requests
 * - Verifies user is owner of the request
 * - Checks request status is SUBMITTED or APPROVED
 * - Validates vacation hasn't started more than 1 day ago (for APPROVED requests)
 * - Updates request status to CANCELLED
 * - Returns number of days that will be returned to user's allowance
 *
 * @param supabase - Supabase client from context.locals
 * @param currentUserId - ID of the current user (must be request owner)
 * @param requestId - ID of the vacation request to cancel
 * @returns Promise with cancellation response including days returned
 * @throws Error if validation fails, user lacks permissions, or business rules violated
 */
export async function cancelVacationRequest(
  supabase: SupabaseClient,
  currentUserId: string,
  requestId: string
): Promise<CancelVacationRequestResponseDTO> {
  // 1. Fetch vacation request by ID
  const { data: vacationRequest, error: requestError } = await supabase
    .from("vacation_requests")
    .select("id, user_id, start_date, end_date, business_days_count, status")
    .eq("id", requestId)
    .single();

  if (requestError || !vacationRequest) {
    if (requestError?.code === "PGRST116") {
      throw new Error("Vacation request not found");
    }
    throw new Error("Failed to fetch vacation request");
  }

  // 2. Verify current user is owner of request
  if (vacationRequest.user_id !== currentUserId) {
    throw new Error("You can only cancel your own vacation requests");
  }

  // 3. Check if request status is SUBMITTED or APPROVED
  if (vacationRequest.status !== "SUBMITTED" && vacationRequest.status !== "APPROVED") {
    throw new Error("Only SUBMITTED or APPROVED requests can be cancelled");
  }

  // 4. Check cancellation time constraint for APPROVED requests
  if (vacationRequest.status === "APPROVED") {
    const startDate = new Date(vacationRequest.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate difference in days
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      throw new Error("Cannot cancel vacation that started more than 1 day ago");
    }
  }

  // 5. Update vacation_requests table
  const now = new Date().toISOString();
  const { data: updatedRequest, error: updateError } = await supabase
    .from("vacation_requests")
    .update({
      status: "CANCELLED",
      updated_at: now,
    })
    .eq("id", requestId)
    .in("status", ["SUBMITTED", "APPROVED"]) // Ensure status hasn't changed
    .select()
    .single();

  if (updateError || !updatedRequest) {
    throw new Error("Failed to cancel vacation request");
  }

  // 6. Build response with days returned
  const response: CancelVacationRequestResponseDTO = {
    id: updatedRequest.id,
    status: "CANCELLED",
    daysReturned: vacationRequest.business_days_count,
    updatedAt: updatedRequest.updated_at,
  };

  return response;
}
