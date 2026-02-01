import type {
  TeamDetailsDTO,
  UpdateTeamDTO,
  UpdateTeamResponseDTO,
  DeleteTeamResponseDTO,
  AddTeamMembersDTO,
  AddTeamMembersResponseDTO,
  RemoveTeamMemberResponseDTO,
} from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { TeamEditForm } from "./TeamEditForm";
import { TeamMembersList } from "./TeamMembersList";

interface TeamDetailsProps {
  team: TeamDetailsDTO;
  onTeamUpdate: () => void;
  onTeamDelete: () => void;
  updateTeam: (teamId: string, data: UpdateTeamDTO) => Promise<UpdateTeamResponseDTO>;
  deleteTeam: (teamId: string) => Promise<DeleteTeamResponseDTO>;
  addTeamMembers: (teamId: string, data: AddTeamMembersDTO) => Promise<AddTeamMembersResponseDTO>;
  removeTeamMember: (teamId: string, userId: string) => Promise<RemoveTeamMemberResponseDTO>;
  isLoading?: boolean;
}

/**
 * Displays details of selected team
 * Including edit form and members list
 */
export function TeamDetails({
  team,
  onTeamUpdate,
  onTeamDelete,
  updateTeam,
  deleteTeam,
  addTeamMembers,
  removeTeamMember,
  isLoading = false,
}: TeamDetailsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Information and Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informacje o zespole</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamEditForm
            team={team}
            onTeamUpdate={onTeamUpdate}
            onTeamDelete={onTeamDelete}
            updateTeam={updateTeam}
            deleteTeam={deleteTeam}
          />
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Członkowie zespołu</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamMembersList
            teamId={team.id}
            members={team.members}
            onMemberRemove={onTeamUpdate}
            addTeamMembers={addTeamMembers}
            removeTeamMember={removeTeamMember}
          />
        </CardContent>
      </Card>
    </div>
  );
}
