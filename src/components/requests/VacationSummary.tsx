/**
 * Vacation Summary Component
 * Displays user's vacation allowance summary
 */
import { Calendar, Clock } from "lucide-react";
import type { UserVacationAllowance } from "../hooks/useMyRequests";

interface VacationSummaryProps {
  allowance: UserVacationAllowance;
}

/**
 * Component displaying vacation allowance summary
 */
export function VacationSummary({ allowance }: VacationSummaryProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total Days */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Łącznie dni</h3>
        </div>
        <p className="text-3xl font-bold">{allowance.totalDays}</p>
        <p className="text-sm text-muted-foreground mt-1">Pula roczna</p>
      </div>

      {/* Used Days */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-5 w-5 text-orange-500" />
          <h3 className="font-semibold">Wykorzystane</h3>
        </div>
        <p className="text-3xl font-bold">{allowance.usedDays}</p>
        <p className="text-sm text-muted-foreground mt-1">Dni urlopu</p>
      </div>

      {/* Remaining Days */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-5 w-5 text-green-500" />
          <h3 className="font-semibold">Pozostało</h3>
        </div>
        <p className="text-3xl font-bold">{allowance.remainingDays}</p>
        <p className="text-sm text-muted-foreground mt-1">Dni do wykorzystania</p>
      </div>

      {/* Carryover Days Info */}
      {allowance.fromPreviousYear.total > 0 && (
        <div className="md:col-span-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Dni zaległe z poprzedniego roku</p>
              <p className="text-sm text-amber-800 mt-1">
                Masz <span className="font-semibold">{allowance.fromPreviousYear.total} dni</span> z poprzedniego roku
                do wykorzystania do{" "}
                <span className="font-semibold">{formatDate(allowance.fromPreviousYear.utilizationDeadline)}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
