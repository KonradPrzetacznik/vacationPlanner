import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type {
  UserListItemDTO,
  CreateUserDTO,
  CreateUserResponseDTO,
  UpdateUserDTO,
  UpdateUserResponseDTO,
} from "@/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Validation schemas
const createUserSchema = z.object({
  firstName: z
    .string()
    .min(1, "Imię jest wymagane")
    .max(100, "Imię nie może przekraczać 100 znaków")
    .transform((val) => val.trim()),
  lastName: z
    .string()
    .min(1, "Nazwisko jest wymagane")
    .max(100, "Nazwisko nie może przekraczać 100 znaków")
    .transform((val) => val.trim()),
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy format email")
    .toLowerCase()
    .transform((val) => val.trim()),
  role: z.enum(["ADMINISTRATOR", "HR", "EMPLOYEE"], {
    required_error: "Rola jest wymagana",
  }),
  temporaryPassword: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .max(100, "Hasło nie może przekraczać 100 znaków"),
});

const editUserSchema = z.object({
  firstName: z
    .string()
    .min(1, "Imię jest wymagane")
    .max(100, "Imię nie może przekraczać 100 znaków")
    .transform((val) => val.trim()),
  lastName: z
    .string()
    .min(1, "Nazwisko jest wymagane")
    .max(100, "Nazwisko nie może przekraczać 100 znaków")
    .transform((val) => val.trim()),
  role: z.enum(["ADMINISTRATOR", "HR", "EMPLOYEE"], {
    required_error: "Rola jest wymagana",
  }),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type EditUserFormValues = z.infer<typeof editUserSchema>;

interface UserFormDialogProps {
  mode: "create" | "edit";
  user?: UserListItemDTO;
  currentUserId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onCreateUser: (data: CreateUserDTO) => Promise<CreateUserResponseDTO>;
  onUpdateUser: (
    userId: string,
    data: UpdateUserDTO
  ) => Promise<UpdateUserResponseDTO>;
}

/**
 * Dialog for creating or editing a user
 * Handles form validation and submission
 */
export function UserFormDialog({
  mode,
  user,
  currentUserId,
  isOpen,
  onOpenChange,
  onSuccess,
  onCreateUser,
  onUpdateUser,
}: UserFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = mode === "edit";
  const isEditingSelf = isEditMode && user?.id === currentUserId;

  // Form setup
  const form = useForm<CreateUserFormValues | EditUserFormValues>({
    resolver: zodResolver(isEditMode ? editUserSchema : createUserSchema),
    defaultValues: isEditMode && user
      ? {
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        }
      : {
          firstName: "",
          lastName: "",
          email: "",
          role: "EMPLOYEE" as const,
          temporaryPassword: "",
        },
  });

  // Reset form when mode, user, or dialog open state changes
  useEffect(() => {
    if (!isOpen) return; // Early return jeśli dialog zamknięty

    if (isEditMode && user) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } else {
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        role: "EMPLOYEE" as const,
        temporaryPassword: "",
      });
    }
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, user?.id]); // Używamy user?.id zamiast całego obiektu

  // Handle form submission
  const onSubmit = async (
    data: CreateUserFormValues | EditUserFormValues
  ) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditMode && user) {
        await onUpdateUser(user.id, data as UpdateUserDTO);
      } else {
        await onCreateUser(data as CreateUserDTO);
      }
      onSuccess(); // This will close the dialog, and useEffect will reset the form
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle dialog open/close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edytuj użytkownika" : "Dodaj nowego użytkownika"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Zaktualizuj informacje o użytkowniku. Zmiany zostaną zapisane po kliknięciu Zapisz."
              : "Wypełnij formularz aby utworzyć nowe konto użytkownika. Użytkownik otrzyma tymczasowe hasło."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* First Name */}
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imię</FormLabel>
                  <FormControl>
                    <Input placeholder="Jan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Last Name */}
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwisko</FormLabel>
                  <FormControl>
                    <Input placeholder="Kowalski" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email (only in create mode) */}
            {!isEditMode && (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="jan.kowalski@firma.pl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rola</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isEditingSelf}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz rolę" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="EMPLOYEE">Pracownik</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="ADMINISTRATOR">
                        Administrator
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {isEditingSelf && (
                    <p className="text-xs text-muted-foreground">
                      Nie możesz zmienić własnej roli
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Temporary Password (only in create mode) */}
            {!isEditMode && (
              <FormField
                control={form.control}
                name="temporaryPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hasło tymczasowe</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Minimum 8 znaków"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditMode ? "Zapisz zmiany" : "Utwórz użytkownika"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
