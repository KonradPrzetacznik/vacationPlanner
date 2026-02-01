import type { UserListItemDTO } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Loader2 } from "lucide-react";

interface UsersTableProps {
  users: UserListItemDTO[];
  currentUserId: string;
  isLoading?: boolean;
  onEditUser: (user: UserListItemDTO) => void;
  onDeleteUser: (userId: string, userName: string) => void;
}

/**
 * Table component displaying list of users
 * with actions for edit and delete
 */
export function UsersTable({ users, currentUserId, isLoading = false, onEditUser, onDeleteUser }: UsersTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Nie znaleziono użytkowników spełniających kryteria wyszukiwania.</p>
      </div>
    );
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMINISTRATOR":
        return "destructive";
      case "HR":
        return "default";
      case "EMPLOYEE":
        return "secondary";
      default:
        return "outline";
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

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Imię</TableHead>
            <TableHead>Nazwisko</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rola</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isDeleted = user.deletedAt !== null;
            const isCurrentUser = user.id === currentUserId;

            return (
              <TableRow key={user.id} className={isDeleted ? "opacity-60" : ""}>
                <TableCell className="font-medium">{user.firstName}</TableCell>
                <TableCell>{user.lastName}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleLabel(user.role)}</Badge>
                </TableCell>
                <TableCell>
                  {isDeleted ? (
                    <Badge variant="outline" className="text-destructive">
                      Usunięty
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600">
                      Aktywny
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditUser(user)}
                      disabled={isDeleted}
                      title={isDeleted ? "Nie można edytować usuniętego użytkownika" : "Edytuj użytkownika"}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edytuj</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                      disabled={isDeleted || isCurrentUser}
                      title={
                        isDeleted
                          ? "Użytkownik już usunięty"
                          : isCurrentUser
                            ? "Nie możesz usunąć samego siebie"
                            : "Usuń użytkownika"
                      }
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Usuń</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
