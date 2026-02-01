import { useState, useCallback, useEffect } from "react";
import { useTeamsManagement } from "@/components/hooks/useTeamsManagement";
import { TeamsList } from "./TeamsList";
import { TeamDetails } from "./TeamDetails";
import { CreateTeamModal } from "./CreateTeamModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

/**
 * Main component for Teams Management view
 * Orchestrates all subcomponents and manages state
 */
export function TeamsManagementView() {
  const {
    teams,
    selectedTeam,
    isLoading,
    isLoadingDetails,
    fetchTeams,
    selectTeam,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMembers,
    removeTeamMember,
  } = useTeamsManagement();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch teams on mount
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Handlers
  const handleTeamSelect = useCallback(
    (teamId: string) => {
      selectTeam(teamId);
    },
    [selectTeam]
  );

  const handleOpenCreateModal = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  const handleTeamCreate = useCallback(async () => {
    await fetchTeams();
    handleCloseCreateModal();
  }, [fetchTeams, handleCloseCreateModal]);

  const handleTeamUpdate = useCallback(async () => {
    await fetchTeams();
  }, [fetchTeams]);

  const handleTeamDelete = useCallback(async () => {
    await fetchTeams();
  }, [fetchTeams]);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Zarządzanie zespołami</h1>
          <p className="text-muted-foreground mt-2">Twórz zespoły i zarządzaj ich członkami</p>
        </div>
        <Button onClick={handleOpenCreateModal} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Utwórz zespół
        </Button>
      </div>

      {/* Main Content - Master/Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Teams List */}
        <div className="lg:col-span-1">
          <TeamsList
            teams={teams}
            selectedTeamId={selectedTeam?.id || null}
            onTeamSelect={handleTeamSelect}
            isLoading={isLoading}
          />
        </div>

        {/* Right Panel - Team Details */}
        <div className="lg:col-span-2">
          {selectedTeam ? (
            <TeamDetails
              team={selectedTeam}
              onTeamUpdate={handleTeamUpdate}
              onTeamDelete={handleTeamDelete}
              updateTeam={updateTeam}
              deleteTeam={deleteTeam}
              addTeamMembers={addTeamMembers}
              removeTeamMember={removeTeamMember}
              isLoading={isLoadingDetails}
            />
          ) : (
            <div className="flex items-center justify-center h-[400px] border-2 border-dashed rounded-lg">
              <div className="text-center">
                <p className="text-muted-foreground text-lg">Wybierz zespół z listy, aby zobaczyć szczegóły</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onTeamCreate={handleTeamCreate}
        createTeam={createTeam}
      />
    </div>
  );
}
