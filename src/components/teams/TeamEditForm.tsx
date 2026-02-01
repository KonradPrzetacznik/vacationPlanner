import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { TeamDetailsDTO, UpdateTeamDTO, UpdateTeamResponseDTO, DeleteTeamResponseDTO } from "@/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Save, Trash2 } from "lucide-react";

// Validation schema
const updateTeamSchema = z.object({
  name: z
    .string()
    .min(1, "Nazwa zespołu jest wymagana")
    .min(3, "Nazwa zespołu musi mieć co najmniej 3 znaki")
    .max(100, "Nazwa zespołu nie może przekraczać 100 znaków")
    .transform((val) => val.trim()),
});

type UpdateTeamFormValues = z.infer<typeof updateTeamSchema>;

interface TeamEditFormProps {
  team: TeamDetailsDTO;
  onTeamUpdate: () => void;
  onTeamDelete: () => void;
  updateTeam: (teamId: string, data: UpdateTeamDTO) => Promise<UpdateTeamResponseDTO>;
  deleteTeam: (teamId: string) => Promise<DeleteTeamResponseDTO>;
}

/**
 * Form for editing team name and deleting team
 */
export function TeamEditForm({ team, onTeamUpdate, onTeamDelete, updateTeam, deleteTeam }: TeamEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form setup
  const form = useForm<UpdateTeamFormValues>({
    resolver: zodResolver(updateTeamSchema),
    defaultValues: {
      name: team.name,
    },
  });

  const handleSubmit = async (values: UpdateTeamFormValues) => {
    // Sprawdź czy nazwa się zmieniła
    if (values.name === team.name) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateTeam(team.id, values);
      onTeamUpdate();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się zaktualizować zespołu";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await deleteTeam(team.id);
      onTeamDelete();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się usunąć zespołu";
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const isDirty = form.formState.isDirty;

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Team Name Field */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nazwa zespołu</FormLabel>
                <FormControl>
                  <Input placeholder="np. Zespół Backend" {...field} disabled={isSubmitting || isDeleting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button type="submit" disabled={!isDirty || isSubmitting || isDeleting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Zapisz zmiany
            </Button>

            {/* Delete Team Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" disabled={isSubmitting || isDeleting}>
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Trash2 className="mr-2 h-4 w-4" />
                  Usuń zespół
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Czy na pewno chcesz usunąć ten zespół?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ta akcja jest nieodwracalna. Zespół &quot;{team.name}&quot; zostanie trwale usunięty, a wszyscy
                    członkowie zostaną z niego usunięci.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Usuń zespół
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      </Form>

      {/* Team Metadata */}
      <div className="pt-4 border-t">
        <dl className="grid grid-cols-1 gap-2 text-sm">
          <div>
            <dt className="text-muted-foreground inline">Utworzono:</dt>
            <dd className="inline ml-2">{new Date(team.createdAt).toLocaleString("pl-PL")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground inline">Ostatnia modyfikacja:</dt>
            <dd className="inline ml-2">{new Date(team.updatedAt).toLocaleString("pl-PL")}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
