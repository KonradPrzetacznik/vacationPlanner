import { useState } from "react";
import type { DeleteUserResponseDTO } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onDeleteUser: (userId: string) => Promise<DeleteUserResponseDTO>;
}

/**
 * Confirmation dialog for user deletion
 * Warns about consequences (vacation cancellation)
 */
export function DeleteConfirmDialog({
  userId,
  userName,
  isOpen,
  onOpenChange,
  onSuccess,
  onDeleteUser,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await onDeleteUser(userId);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isDeleting) {
      setError(null);
    }
    onOpenChange(open);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz usunąć użytkownika?</AlertDialogTitle>
          <div className="text-muted-foreground text-sm space-y-2">
            <div>
              Użytkownik <strong>{userName}</strong> zostanie dezaktywowany (soft-delete).
            </div>
            <div className="font-semibold text-destructive">
              Uwaga: Wszystkie przyszłe wnioski urlopowe tego użytkownika zostaną automatycznie anulowane.
            </div>
            <div className="text-sm">
              Tej operacji nie można cofnąć. Użytkownik nie będzie mógł się zalogować, a jego dane pozostaną w systemie
              jako archiwalne.
            </div>
          </div>
        </AlertDialogHeader>

        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Usuń użytkownika
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
