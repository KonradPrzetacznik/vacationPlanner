import { useState } from "react";
import type { TeamMemberDTO, AddTeamMembersDTO, AddTeamMembersResponseDTO, RemoveTeamMemberResponseDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, UserMinus, Users } from "lucide-react";
import { AddTeamMemberModal } from "./AddTeamMemberModal";

interface TeamMembersListProps {
  teamId: string;
  members: TeamMemberDTO[];
  onMemberRemove: () => void;
  addTeamMembers: (teamId: string, data: AddTeamMembersDTO) => Promise<AddTeamMembersResponseDTO>;
  removeTeamMember: (teamId: string, userId: string) => Promise<RemoveTeamMemberResponseDTO>;
}

/**
 * List of team members with add/remove functionality
 */
export function TeamMembersList({
  teamId,
  members,
  onMemberRemove,
  addTeamMembers,
  removeTeamMember,
}: TeamMembersListProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [removeDialogState, setRemoveDialogState] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
  }>({
    isOpen: false,
    userId: "",
    userName: "",
  });
  const [isRemoving, setIsRemoving] = useState(false);

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleMembersAdd = () => {
    setIsAddModalOpen(false);
    onMemberRemove();
  };

  const handleRemoveMember = (userId: string, userName: string) => {
    setRemoveDialogState({
      isOpen: true,
      userId,
      userName,
    });
  };

  const confirmRemoveMember = async () => {
    setIsRemoving(true);
    try {
      await removeTeamMember(teamId, removeDialogState.userId);
      setRemoveDialogState({ isOpen: false, userId: "", userName: "" });
      onMemberRemove();
    } catch (err) {
      console.error("Failed to remove member:", err);
    } finally {
      setIsRemoving(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMINISTRATOR":
        return "Administrator";
      case "HR":
        return "HR";
      case "EMPLOYEE":
        return "Pracownik";
      default:
        return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMINISTRATOR":
        return "destructive" as const;
      case "HR":
        return "default" as const;
      case "EMPLOYEE":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground font-medium mb-2">Brak członków w zespole</p>
        <p className="text-sm text-muted-foreground mb-4">Dodaj pierwszego członka, aby rozpocząć współpracę</p>
        <Button onClick={handleOpenAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          Dodaj członka
        </Button>

        <AddTeamMemberModal
          teamId={teamId}
          existingMemberIds={members.map((m) => m.id)}
          isOpen={isAddModalOpen}
          onClose={handleCloseAddModal}
          onMembersAdd={handleMembersAdd}
          addTeamMembers={addTeamMembers}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleOpenAddModal} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Dodaj członka
        </Button>
      </div>

      <div className="divide-y rounded-lg border">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getRoleBadgeVariant(member.role)}>{getRoleLabel(member.role)}</Badge>
                <span className="text-xs text-muted-foreground">
                  Dołączył: {new Date(member.joinedAt).toLocaleDateString("pl-PL")}
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveMember(member.id, `${member.firstName} ${member.lastName}`)}
            >
              <UserMinus className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <AddTeamMemberModal
        teamId={teamId}
        existingMemberIds={members.map((m) => m.id)}
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onMembersAdd={handleMembersAdd}
        addTeamMembers={addTeamMembers}
      />

      <AlertDialog
        open={removeDialogState.isOpen}
        onOpenChange={(open) => !open && setRemoveDialogState({ isOpen: false, userId: "", userName: "" })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć członka z zespołu?</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć <strong>{removeDialogState.userName}</strong> z tego zespołu? Użytkownik
              przestanie być członkiem zespołu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
