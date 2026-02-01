/**
 * New Request View Component
 * Page component for creating new vacation requests
 */
import { useState } from "react";
import { RequestForm } from "./RequestForm.tsx";
import type { CreateVacationRequestInput } from "@/lib/schemas/vacation-request-detail.schema";
import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";

/**
 * View component for creating new vacation request
 */
export function NewRequestView() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateVacationRequestInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/vacation-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Nie udało się utworzyć wniosku");
      }

      const result = await response.json();

      // Success - show toast and redirect
      toast.success("Wniosek został utworzony", {
        description: `Wniosek na ${result.businessDaysCount} dni roboczych czeka na akceptację`,
      });

      // Redirect after short delay to allow toast to be seen
      setTimeout(() => {
        window.location.href = "/requests";
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nieznany błąd";
      setError(errorMessage);
      toast.error("Błąd tworzenia wniosku", {
        description: errorMessage,
      });
      console.error("Error creating vacation request:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    window.location.href = "/requests";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Powrót do listy
        </Button>
        <h1 className="text-3xl font-bold">Nowy Wniosek Urlopowy</h1>
        <p className="text-muted-foreground mt-2">
          Wypełnij formularz, aby złożyć nowy wniosek o urlop
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-900">Wystąpił błąd</p>
          <p className="text-sm text-red-800 mt-1">{error}</p>
        </div>
      )}

      {/* Form Card */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <RequestForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>

      {/* Info Box */}
      <div className="mt-6 rounded-lg border bg-blue-50 p-4">
        <h3 className="font-medium text-blue-900 mb-2">Ważne informacje:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Wniosek musi być złożony z wyprzedzeniem</li>
          <li>Nie można wybrać dat przypadających na weekend</li>
          <li>Weekendy nie są wliczane do dni urlopowych</li>
          <li>Wniosek zostanie przesłany do akceptacji przez przełożonego</li>
        </ul>
      </div>
    </div>
  );
}

export default NewRequestView;

