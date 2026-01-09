/**
 * Teams Service
 * Handles business logic for team management operations
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type {
  GetTeamsQueryDTO,
  GetTeamsResponseDTO,
  TeamListItemDTO,
  TeamDetailsDTO,
  TeamMemberDTO,
  GetTeamByIdResponseDTO,
  CreateTeamDTO,
  CreateTeamResponseDTO,
  UpdateTeamDTO,
  UpdateTeamResponseDTO,
  DeleteTeamResponseDTO,
} from "@/types";

/**
 * Get teams list with pagination and optional member count
 *
 * @param supabase - Supabase client from context.locals
 * @param userId - ID of the current user
 * @param userRole - Role of the current user (ADMINISTRATOR, HR, EMPLOYEE)
 * @param query - Query parameters for filtering and pagination
 * @returns Promise with teams data and pagination metadata
 * @throws Error if validation fails
 */
export async function getTeams(
  supabase: SupabaseClient,
  userId: string,
  userRole: "ADMINISTRATOR" | "HR" | "EMPLOYEE",
  query: GetTeamsQueryDTO
): Promise<GetTeamsResponseDTO> {
  const { limit = 50, offset = 0, includeMemberCount = false } = query;

  // 1. If EMPLOYEE: get team IDs where user is a member
  let teamIds: string[] | null = null;
  if (userRole === "EMPLOYEE") {
    const { data: memberships, error: membershipError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId);

    if (membershipError) {
      console.error("[TeamsService] Failed to fetch user team memberships:", membershipError);
      throw new Error("Failed to fetch teams");
    }

    teamIds = memberships.map((m) => m.team_id);

    // If employee is not in any team, return empty result
    if (teamIds.length === 0) {
      return {
        data: [],
        pagination: {
          total: 0,
          limit,
          offset,
        },
      };
    }
  }

  // 2. Build base query for teams
  let teamsQuery = supabase
    .from("teams")
    .select("id, name, created_at, updated_at", { count: "exact" });

  // Apply team filter for EMPLOYEE
  if (teamIds !== null) {
    teamsQuery = teamsQuery.in("id", teamIds);
  }

  // Apply pagination
  teamsQuery = teamsQuery.range(offset, offset + limit - 1).order("name", { ascending: true });

  const { data: teams, error: teamsError, count } = await teamsQuery;

  if (teamsError) {
    console.error("[TeamsService] Failed to fetch teams:", teamsError);
    throw new Error("Failed to fetch teams");
  }

  if (!teams) {
    return {
      data: [],
      pagination: {
        total: 0,
        limit,
        offset,
      },
    };
  }

  // 3. If includeMemberCount, fetch member counts for all teams
  const teamListItems: TeamListItemDTO[] = [];

  if (includeMemberCount) {
    // Get member counts for all teams in a single query
    const teamIdsToCount = teams.map((t) => t.id);
    const { data: memberCounts, error: countError } = await supabase
      .from("team_members")
      .select("team_id")
      .in("team_id", teamIdsToCount);

    if (countError) {
      console.error("[TeamsService] Failed to fetch member counts:", countError);
      throw new Error("Failed to fetch member counts");
    }

    // Count members per team
    const countsMap = new Map<string, number>();
    memberCounts?.forEach((m) => {
      countsMap.set(m.team_id, (countsMap.get(m.team_id) || 0) + 1);
    });

    // Map to DTOs with member counts
    teams.forEach((team) => {
      teamListItems.push({
        id: team.id,
        name: team.name,
        memberCount: countsMap.get(team.id) || 0,
        createdAt: team.created_at,
        updatedAt: team.updated_at,
      });
    });
  } else {
    // Map to DTOs without member counts
    teams.forEach((team) => {
      teamListItems.push({
        id: team.id,
        name: team.name,
        createdAt: team.created_at,
        updatedAt: team.updated_at,
      });
    });
  }

  // 4. Return response with pagination
  return {
    data: teamListItems,
    pagination: {
      total: count || 0,
      limit,
      offset,
    },
  };
}

/**
 * Get team by ID with members list
 *
 * @param supabase - Supabase client from context.locals
 * @param teamId - ID of the team to retrieve
 * @param userId - ID of the current user
 * @param userRole - Role of the current user (ADMINISTRATOR, HR, EMPLOYEE)
 * @returns Promise with team details including members
 * @throws Error if team not found or user lacks permission
 */
export async function getTeamById(
  supabase: SupabaseClient,
  teamId: string,
  userId: string,
  userRole: "ADMINISTRATOR" | "HR" | "EMPLOYEE"
): Promise<GetTeamByIdResponseDTO> {
  // 1. Query team by ID
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, name, created_at, updated_at")
    .eq("id", teamId)
    .single();

  if (teamError || !team) {
    throw new Error("Team not found");
  }

  // 2. If EMPLOYEE: check membership in team_members
  if (userRole === "EMPLOYEE") {
    const { data: membership, error: membershipError } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .maybeSingle();

    if (membershipError) {
      console.error("[TeamsService] Failed to check team membership:", membershipError);
      throw new Error("Failed to verify team access");
    }

    if (!membership) {
      throw new Error("Not a member of this team");
    }
  }

  // 3. Query team members with profile information
  // Join team_members with profiles to get user details
  const { data: membersData, error: membersError } = await supabase
    .from("team_members")
    .select(
      `
      created_at,
      user_id,
      profiles!inner (
        id,
        first_name,
        last_name,
        role
      )
    `
    )
    .eq("team_id", teamId)
    .is("profiles.deleted_at", null) // Exclude soft-deleted users
    .order("profiles.first_name", { ascending: true });

  if (membersError) {
    console.error("[TeamsService] Failed to fetch team members:", membersError);
    throw new Error("Failed to fetch team members");
  }

  // 4. Get emails for team members using RPC (similar to users service)
  const memberIds = membersData?.map((m) => m.user_id) || [];
  const emailsMap = new Map<string, string>();

  if (memberIds.length > 0) {
    // Call RPC to get emails from auth.users
    const { data: emailsData, error: emailsError } = await supabase.rpc(
      "get_user_emails" as any,
      {
        user_ids: memberIds,
      }
    );

    if (emailsError) {
      console.error("[TeamsService] Failed to fetch member emails:", emailsError);
      // Don't throw, just log - emails are non-critical
    } else if (emailsData && Array.isArray(emailsData)) {
      (emailsData as Array<{ id: string; email: string }>).forEach((item) => {
        emailsMap.set(item.id, item.email);
      });
    }
  }

  // 5. Map to TeamMemberDTO[]
  const members: TeamMemberDTO[] =
    membersData?.map((m) => ({
      id: m.profiles.id,
      firstName: m.profiles.first_name,
      lastName: m.profiles.last_name,
      email: emailsMap.get(m.user_id) || "",
      role: m.profiles.role as "ADMINISTRATOR" | "HR" | "EMPLOYEE",
      joinedAt: m.created_at,
    })) || [];

  // 6. Return TeamDetailsDTO
  return {
    data: {
      id: team.id,
      name: team.name,
      createdAt: team.created_at,
      updatedAt: team.updated_at,
      members,
    },
  };
}

/**
 * Create a new team
 * Only accessible by HR and ADMINISTRATOR roles
 *
 * @param supabase - Supabase client from context.locals
 * @param data - Create team data (name)
 * @returns Promise with created team data
 * @throws Error if team name already exists
 */
export async function createTeam(
  supabase: SupabaseClient,
  data: CreateTeamDTO
): Promise<CreateTeamResponseDTO> {
  const { name } = data;

  // 1. Check if team name already exists
  const { data: existingTeam, error: checkError } = await supabase
    .from("teams")
    .select("id")
    .eq("name", name.trim())
    .maybeSingle();

  if (checkError) {
    console.error("[TeamsService] Failed to check team name uniqueness:", checkError);
    throw new Error("Failed to validate team name");
  }

  if (existingTeam) {
    throw new Error("Team name already exists");
  }

  // 2. Insert new team into database
  const { data: newTeam, error: insertError } = await supabase
    .from("teams")
    .insert({
      name: name.trim(),
    })
    .select("id, name, created_at")
    .single();

  if (insertError || !newTeam) {
    console.error("[TeamsService] Failed to create team:", insertError);
    throw new Error("Failed to create team");
  }

  // 3. Map to response DTO
  return {
    id: newTeam.id,
    name: newTeam.name,
    createdAt: newTeam.created_at,
  };
}

/**
 * Update team information
 * Only accessible by HR and ADMINISTRATOR roles
 *
 * @param supabase - Supabase client from context.locals
 * @param teamId - ID of the team to update
 * @param data - Update team data (name)
 * @returns Promise with updated team data
 * @throws Error if team not found or name already exists
 */
export async function updateTeam(
  supabase: SupabaseClient,
  teamId: string,
  data: UpdateTeamDTO
): Promise<UpdateTeamResponseDTO> {
  const { name } = data;

  // 1. Check if team exists
  const { data: existingTeam, error: fetchError } = await supabase
    .from("teams")
    .select("id, name")
    .eq("id", teamId)
    .single();

  if (fetchError || !existingTeam) {
    throw new Error("Team not found");
  }

  // 2. Check if new name is unique (excluding current team)
  const { data: duplicateTeam, error: checkError } = await supabase
    .from("teams")
    .select("id")
    .eq("name", name.trim())
    .neq("id", teamId)
    .maybeSingle();

  if (checkError) {
    console.error("[TeamsService] Failed to check team name uniqueness:", checkError);
    throw new Error("Failed to validate team name");
  }

  if (duplicateTeam) {
    throw new Error("Team name already exists");
  }

  // 3. Update team with new name and timestamp
  const { data: updatedTeam, error: updateError } = await supabase
    .from("teams")
    .update({
      name: name.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", teamId)
    .select("id, name, updated_at")
    .single();

  if (updateError || !updatedTeam) {
    console.error("[TeamsService] Failed to update team:", updateError);
    throw new Error("Failed to update team");
  }

  // 4. Map to response DTO
  return {
    id: updatedTeam.id,
    name: updatedTeam.name,
    updatedAt: updatedTeam.updated_at,
  };
}

/**
 * Delete a team
 * Only accessible by HR and ADMINISTRATOR roles
 * CASCADE will automatically delete team_members records
 *
 * @param supabase - Supabase client from context.locals
 * @param teamId - ID of the team to delete
 * @returns Promise with deletion confirmation
 * @throws Error if team not found
 */
export async function deleteTeam(
  supabase: SupabaseClient,
  teamId: string
): Promise<DeleteTeamResponseDTO> {
  // 1. Check if team exists
  const { data: existingTeam, error: fetchError } = await supabase
    .from("teams")
    .select("id, name")
    .eq("id", teamId)
    .single();

  if (fetchError || !existingTeam) {
    throw new Error("Team not found");
  }

  // 2. Delete team (CASCADE automatically removes team_members records)
  const { error: deleteError } = await supabase
    .from("teams")
    .delete()
    .eq("id", teamId);

  if (deleteError) {
    console.error("[TeamsService] Failed to delete team:", deleteError);
    throw new Error("Failed to delete team");
  }

  // 3. Return deletion confirmation
  return {
    message: "Team deleted successfully",
    id: teamId,
  };
}
