/**
 * VacationLegend component
 * Displays a legend explaining the color coding of vacation statuses in the calendar
 * Shows only statuses visible in calendar (SUBMITTED, APPROVED)
 * REJECTED and CANCELLED are visible only in the list below
 */

import React from "react";

const statusColors = [
  { status: "APPROVED", label: "Zatwierdzony", color: "bg-green-500" },
  { status: "SUBMITTED", label: "Oczekujący", color: "bg-yellow-500" },
  { status: "REJECTED", label: "Odrzucony", color: "bg-red-500" },
  { status: "CANCELLED", label: "Anulowany", color: "bg-gray-500" },
];

export const VacationLegend: React.FC = () => {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">Legenda statusów</h3>
      <ul className="flex flex-wrap gap-4">
        {statusColors.map(({ status, label, color }) => (
          <li key={status} className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded ${color}`} aria-hidden="true" />
            <span className="text-sm text-muted-foreground">{label}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground mt-2">
        Urlopy odrzucone i anulowane są widoczne w liście poniżej
      </p>
    </div>
  );
};
