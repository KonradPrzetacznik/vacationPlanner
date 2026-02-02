import { useState, useCallback } from "react";
import { toast } from "sonner";
import type {
  TeamListItemDTO,
  GetTeamsResponseDTO,
  TeamDetailsDTO,
  GetTeamByIdResponseDTO,
  CreateTeamDTO,
  CreateTeamResponseDTO,
  UpdateTeamDTO,
  UpdateTeamResponseDTO,
  DeleteTeamResponseDTO,
  AddTeamMembersDTO,
  AddTeamMembersResponseDTO,
  RemoveTeamMemberResponseDTO,
} from "@/types";

/**
 * Custom hook for managing teams state and operations
 * Encapsulates all CRUD operations and API communication for teams
 */
export function useTeamsManagement() {
  const [teams, setTeams] = useState<TeamListItemDTO[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamDetailsDTO | null>(null);

  // Pagination state
  const [paginationLimit, setPaginationLimit] = useState(50);
  const [paginationOffset, setPaginationOffset] = useState(0);
  const [paginationTotal, setPaginationTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  /**
   * Fetch teams from API with member counts
   */
  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: paginationLimit.toString(),
        offset: paginationOffset.toString(),
        includeMemberCount: "true",
      });

      const response = await fetch(`/api/teams?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch teams: ${response.statusText}`);
      }

      const data: GetTeamsResponseDTO = await response.json();
      setTeams(data.data);
      setPaginationTotal(data.pagination.total);
    } catch {
      toast.error("Nie udało się pobrać listy zespołów");
    } finally {
      setIsLoading(false);
    }
  }, [paginationLimit, paginationOffset]);

  /**
   * Fetch team details by ID
   */
  const fetchTeamById = useCallback(async (teamId: string) => {
    setIsLoadingDetails(true);
    try {
      const response = await fetch(`/api/teams/${teamId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch team details: ${response.statusText}`);
      }

      const result: GetTeamByIdResponseDTO = await response.json();
      setSelectedTeam(result.data);
    } catch {
      toast.error("Nie udało się pobrać szczegółów zespołu");
      setSelectedTeam(null);
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  /**
   * Select a team and fetch its details
   */
  const selectTeam = useCallback(
    async (teamId: string) => {
      await fetchTeamById(teamId);
    },
    [fetchTeamById]
  );

  /**
   * Create a new team
   */
  const createTeam = async (data: CreateTeamDTO): Promise<CreateTeamResponseDTO> => {
    const response = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Nie udało się utworzyć zespołu");
    }

    const result = await response.json();
    toast.success("Zespół został utworzony pomyślnie");
    await fetchTeams(); // Refresh list
    return result;
  };

  /**
   * Update an existing team
   */
  const updateTeam = async (teamId: string, data: UpdateTeamDTO): Promise<UpdateTeamResponseDTO> => {
    const response = await fetch(`/api/teams/${teamId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Nie udało się zaktualizować zespołu");
    }

    const result = await response.json();
    toast.success("Zespół został zaktualizowany pomyślnie");
    await fetchTeams(); // Refresh list
    if (selectedTeam?.id === teamId) {
      await fetchTeamById(teamId); // Refresh details if currently selected
    }
    return result;
  };

  /**
   * Delete a team
   */
  const deleteTeam = async (teamId: string): Promise<DeleteTeamResponseDTO> => {
    const response = await fetch(`/api/teams/${teamId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Nie udało się usunąć zespołu");
    }

    const result = await response.json();
    toast.success("Zespół został usunięty pomyślnie");

    // Clear selected team if it was deleted
    if (selectedTeam?.id === teamId) {
      setSelectedTeam(null);
    }

    await fetchTeams(); // Refresh list
    return result;
  };

  /**
   * Add members to a team
   */
  const addTeamMembers = async (teamId: string, data: AddTeamMembersDTO): Promise<AddTeamMembersResponseDTO> => {
    const response = await fetch(`/api/teams/${teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Nie udało się dodać członków do zespołu");
    }

    const result = await response.json();
    toast.success(`Dodano ${data.userIds.length} członków do zespołu`);

    // Refresh team details and list
    if (selectedTeam?.id === teamId) {
      await fetchTeamById(teamId);
    }
    await fetchTeams();

    return result;
  };

  /**
   * Remove a member from a team
   */
  const removeTeamMember = async (teamId: string, userId: string): Promise<RemoveTeamMemberResponseDTO> => {
    const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Nie udało się usunąć członka z zespołu");
    }

    const result = await response.json();
    toast.success("Członek został usunięty z zespołu");

    // Refresh team details and list
    if (selectedTeam?.id === teamId) {
      await fetchTeamById(teamId);
    }
    await fetchTeams();

    return result;
  };

  /**
   * Change pagination limit
   */
  const setLimit = (limit: number) => {
    setPaginationLimit(limit);
    setPaginationOffset(0); // Reset to first page
  };

  /**
   * Go to next page
   */
  const nextPage = () => {
    if (paginationOffset + paginationLimit < paginationTotal) {
      setPaginationOffset(paginationOffset + paginationLimit);
    }
  };

  /**
   * Go to previous page
   */
  const previousPage = () => {
    if (paginationOffset > 0) {
      setPaginationOffset(Math.max(0, paginationOffset - paginationLimit));
    }
  };

  return {
    // State
    teams,
    selectedTeam,
    pagination: {
      limit: paginationLimit,
      offset: paginationOffset,
      total: paginationTotal,
    },
    isLoading,
    isLoadingDetails,

    // Actions
    fetchTeams,
    selectTeam,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMembers,
    removeTeamMember,

    // Pagination actions
    setLimit,
    nextPage,
    previousPage,
  };
}
