/**
 * Request Form Component
 * Form for creating new vacation requests
 */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createVacationRequestSchema,
  type CreateVacationRequestInput,
} from "@/lib/schemas/vacation-request-detail.schema";
import { DatePicker } from "../ui/date-picker";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface RequestFormProps {
  onSubmit: (data: CreateVacationRequestInput) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

/**
 * Form component for creating vacation requests
 * Includes client-side validation with Zod
 */
export function RequestForm({ onSubmit, onCancel, isSubmitting = false }: RequestFormProps) {
  const [comment, setComment] = useState("");

  const {
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<CreateVacationRequestInput>({
    resolver: zodResolver(createVacationRequestSchema),
    mode: "onChange",
  });

  const startDate = watch("startDate");
  const endDate = watch("endDate");

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = today.toISOString().split("T")[0];

  const handleFormSubmit = async (data: CreateVacationRequestInput) => {
    await onSubmit(data);
  };

  // Helper to format date for display
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate business days between two dates (simple approximation)
  const calculateBusinessDays = (start: string, end: string) => {
    if (!start || !end) return 0;

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (endDate < startDate) return 0;

    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        // Not Sunday (0) or Saturday (6)
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  };

  const businessDays = calculateBusinessDays(startDate, endDate);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Start Date */}
      <DatePicker
        id="startDate"
        label="Data rozpoczęcia"
        required
        min={minDate}
        value={startDate}
        onChange={(value) => setValue("startDate", value, { shouldValidate: true })}
        error={errors.startDate?.message}
      />

      {startDate && <p className="text-sm text-muted-foreground -mt-3">{formatDateForDisplay(startDate)}</p>}

      {/* End Date */}
      <DatePicker
        id="endDate"
        label="Data zakończenia"
        required
        min={startDate || minDate}
        value={endDate}
        onChange={(value) => setValue("endDate", value, { shouldValidate: true })}
        error={errors.endDate?.message}
      />

      {endDate && <p className="text-sm text-muted-foreground -mt-3">{formatDateForDisplay(endDate)}</p>}

      {/* Business Days Info */}
      {startDate && endDate && businessDays > 0 && (
        <div className="rounded-lg border bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900">
            Liczba dni roboczych: <span className="text-lg font-bold">{businessDays}</span>
          </p>
          <p className="text-xs text-blue-700 mt-1">Weekendy nie są wliczane do urlopu</p>
        </div>
      )}

      {/* Comment (optional) */}
      <div className="space-y-2">
        <Label htmlFor="comment">
          Komentarz <span className="text-muted-foreground font-normal">(opcjonalny)</span>
        </Label>
        <Textarea
          id="comment"
          placeholder="Dodaj opcjonalny komentarz do wniosku..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">Komentarz będzie widoczny dla osoby rozpatrującej wniosek</p>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Anuluj
          </Button>
        )}
        <Button type="submit" disabled={!isValid || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wysyłanie...
            </>
          ) : (
            "Złóż wniosek"
          )}
        </Button>
      </div>
    </form>
  );
}
