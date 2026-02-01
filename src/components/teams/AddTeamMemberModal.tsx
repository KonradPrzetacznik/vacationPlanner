import { useState, useEffect } from "react";
import type { AddTeamMembersDTO, AddTeamMembersResponseDTO, UserListItemDTO, GetUsersResponseDTO } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { useDebounce } from "@/components/hooks/useDebounce";

interface AddTeamMemberModalProps {
  teamId: string;
  existingMemberIds: string[]; // IDs of users already in the team
  isOpen: boolean;
  onClose: () => void;
  onMembersAdd: () => void;
  addTeamMembers: (teamId: string, data: AddTeamMembersDTO) => Promise<AddTeamMembersResponseDTO>;
}

export function AddTeamMemberModal({
  teamId,
  existingMemberIds,
  isOpen,
  onClose,
  onMembersAdd,
  addTeamMembers,
}: AddTeamMemberModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserListItemDTO[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          limit: "50",
          offset: "0",
          includeDeleted: "false",
        });

        const response = await fetch(`/api/users?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data: GetUsersResponseDTO = await response.json();
        setUsers(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się pobrać listy użytkowników");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, debouncedSearch]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedUserIds(new Set());
      setError(null);
    }
  }, [isOpen]);

  const handleToggleUser = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleSubmit = async () => {
    if (selectedUserIds.size === 0) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addTeamMembers(teamId, {
        userIds: Array.from(selectedUserIds),
      });
      onMembersAdd();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się dodać członków do zespołu";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      onClose();
    }
  };

  const filteredUsers = users.filter((user) => {
    // Wykluczenie użytkowników usuniętych
    if (user.deletedAt !== null) {
      return false;
    }

    // Wykluczenie użytkowników już będących członkami zespołu
    if (existingMemberIds.includes(user.id)) {
      return false;
    }

    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = user.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

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

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Dodaj członków do zespołu</DialogTitle>
          <DialogDescription>Wyszukaj i wybierz użytkowników, których chcesz dodać do zespołu.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {error && <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj użytkowników..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex-1 overflow-y-auto border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchQuery ? "Nie znaleziono użytkowników" : "Brak dostępnych użytkowników"}
              </div>
            ) : (
              <div className="divide-y">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    role="button"
                    tabIndex={0}
                    className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleToggleUser(user.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleToggleUser(user.id);
                      }
                    }}
                  >
                    <Checkbox
                      checked={selectedUserIds.has(user.id)}
                      onCheckedChange={() => handleToggleUser(user.id)}
                      disabled={isSubmitting}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      <div className="mt-1">
                        <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleLabel(user.role)}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedUserIds.size > 0 && (
            <div className="text-sm text-muted-foreground">
              Wybrano: <strong>{selectedUserIds.size}</strong>{" "}
              {selectedUserIds.size === 1 ? "użytkownika" : selectedUserIds.size < 5 ? "użytkowników" : "użytkowników"}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Anuluj
          </Button>
          <Button onClick={handleSubmit} disabled={selectedUserIds.size === 0 || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Dodaj ({selectedUserIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
