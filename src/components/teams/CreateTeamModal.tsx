import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { CreateTeamDTO, CreateTeamResponseDTO } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Validation schema
const createTeamSchema = z.object({
  name: z
    .string()
    .min(1, "Nazwa zespołu jest wymagana")
    .min(3, "Nazwa zespołu musi mieć co najmniej 3 znaki")
    .max(100, "Nazwa zespołu nie może przekraczać 100 znaków")
    .transform((val) => val.trim()),
});

type CreateTeamFormValues = z.infer<typeof createTeamSchema>;

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreate: () => void;
  createTeam: (data: CreateTeamDTO) => Promise<CreateTeamResponseDTO>;
}

/**
 * Modal for creating a new team
 * Handles form validation and submission
 */
export function CreateTeamModal({
  isOpen,
  onClose,
  onTeamCreate,
  createTeam,
}: CreateTeamModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form setup
  const form = useForm<CreateTeamFormValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: "",
      });
      setError(null);
    }
  }, [isOpen, form]);

  const handleSubmit = async (values: CreateTeamFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await createTeam(values);
      onTeamCreate();
      form.reset();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Nie udało się utworzyć zespołu";
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

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Utwórz nowy zespół</DialogTitle>
          <DialogDescription>
            Podaj nazwę zespołu. Będziesz mógł dodać członków po utworzeniu.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Team Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwa zespołu</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="np. Zespół Backend"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Footer Buttons */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Utwórz zespół
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
