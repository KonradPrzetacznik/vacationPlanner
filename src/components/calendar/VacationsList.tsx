/**
 * VacationsList component
 * Displays a list of all vacation requests in the selected period
 * Shows all statuses including REJECTED and CANCELLED which may not be visible in calendar
 */

import React from "react";
import type { VacationRequestViewModel } from "@/types";
import { Calendar, User } from "lucide-react";

interface VacationsListProps {
  vacations: VacationRequestViewModel[];
  onVacationClick?: (vacation: VacationRequestViewModel) => void;
}

const statusLabels = {
  SUBMITTED: "Oczekujący",
  APPROVED: "Zatwierdzony",
  REJECTED: "Odrzucony",
  CANCELLED: "Anulowany",
};

const statusColors = {
  SUBMITTED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  APPROVED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
};

export const VacationsList: React.FC<VacationsListProps> = ({
  vacations,
  onVacationClick,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Sort vacations by start date (earliest first)
  const sortedVacations = [...vacations].sort((a, b) => {
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold">Lista wniosków urlopowych w wybranym okresie</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Wszystkie wnioski urlopowe, włącznie z odrzuconymi i anulowanymi
        </p>
      </div>

      <div className="divide-y">
        {sortedVacations.map((vacation) => (
          <div
            key={vacation.id}
            onClick={() => onVacationClick?.(vacation)}
            className={`p-4 hover:bg-accent/50 transition-colors ${
              onVacationClick ? "cursor-pointer" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* User Info */}
              <div className="flex items-center gap-2 flex-1">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium">
                  {vacation.user.firstName} {vacation.user.lastName}
                </span>
              </div>

              {/* Date Range */}
              <div className="flex items-center gap-2 flex-1">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground">
                  {formatDate(vacation.startDate)} - {formatDate(vacation.endDate)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({vacation.businessDaysCount}{" "}
                  {vacation.businessDaysCount === 1 ? "dzień" : "dni"})
                </span>
              </div>

              {/* Status Badge */}
              <div className="flex-shrink-0">
                <span
                  className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${
                    statusColors[vacation.status]
                  }`}
                >
                  {statusLabels[vacation.status]}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
