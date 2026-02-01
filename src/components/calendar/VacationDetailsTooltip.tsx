/**
 * VacationDetailsTooltip component
 * Displays detailed information about a vacation request in a tooltip
 */

import React from "react";
import type { VacationRequestViewModel } from "@/types";

interface VacationDetailsTooltipProps {
  vacation: VacationRequestViewModel;
  position: { x: number; y: number };
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

export const VacationDetailsTooltip: React.FC<VacationDetailsTooltipProps> = ({ vacation, position }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div
      className="pointer-events-none fixed z-50 rounded-lg border bg-popover p-3 text-popover-foreground shadow-md"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        minWidth: "250px",
      }}
    >
      <div className="space-y-2">
        <div>
          <p className="text-sm font-semibold">
            {vacation.user.firstName} {vacation.user.lastName}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Okres</p>
          <p className="text-sm">
            {formatDate(vacation.startDate)} - {formatDate(vacation.endDate)}
          </p>
          <p className="text-xs text-muted-foreground">
            ({vacation.businessDaysCount} {vacation.businessDaysCount === 1 ? "dzień" : "dni"} roboczych)
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Status</p>
          <span
            className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${
              statusColors[vacation.status]
            }`}
          >
            {statusLabels[vacation.status]}
          </span>
        </div>
      </div>
    </div>
  );
};
