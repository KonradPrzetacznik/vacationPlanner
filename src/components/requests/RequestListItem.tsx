/**
 * Request List Item Component
 * Displays a single vacation request with actions
 */
import type { VacationRequestListItemDTO } from "@/types";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Calendar, User, X } from "lucide-react";
import { useState } from "react";

interface RequestListItemProps {
  request: VacationRequestListItemDTO;
  onCancel: (id: string) => void;
}

/**
 * Component representing a single vacation request
 */
export function RequestListItem({ request, onCancel }: RequestListItemProps) {
  const [isCancelling, setIsCancelling] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: VacationRequestListItemDTO["status"]) => {
    switch (status) {
      case "SUBMITTED":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Oczekujący</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Zatwierdzony</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Odrzucony</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Anulowany</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Check if cancel button should be enabled
  const canCancel = () => {
    if (request.status === "SUBMITTED") {
      return true;
    }

    if (request.status === "APPROVED") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(request.startDate);
      startDate.setHours(0, 0, 0, 0);

      // Can cancel if vacation hasn't started yet
      return startDate >= today;
    }

    return false;
  };

  const handleCancel = async () => {
    if (!confirm("Czy na pewno chcesz anulować ten wniosek urlopowy?")) {
      return;
    }

    setIsCancelling(true);
    try {
      await onCancel(request.id);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* Status Badge */}
          <div>
            {getStatusBadge(request.status)}
          </div>

          {/* Dates */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Od:</span>
              <span>{formatDate(request.startDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Do:</span>
              <span>{formatDate(request.endDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Dni robocze:</span>
              <span className="font-semibold text-primary">{request.businessDaysCount}</span>
            </div>
          </div>

          {/* Processed By Info */}
          {request.processedByUserId && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>
                Przetworzony: {formatDate(request.processedAt || "")}
              </span>
            </div>
          )}

          {/* Created At */}
          <div className="text-xs text-muted-foreground">
            Utworzony: {formatDate(request.createdAt)}
          </div>
        </div>

        {/* Actions */}
        {canCancel() && (
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isCancelling}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="mr-1 h-4 w-4" />
              {isCancelling ? "Anulowanie..." : "Anuluj"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
