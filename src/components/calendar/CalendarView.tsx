/**
 * CalendarView component
 * Main container component for team vacation calendar view
 * Coordinates all child components and manages calendar state
 */

import React, { useCallback, useState, useEffect } from "react";
import { TeamSelector } from "./TeamSelector";
import { Calendar } from "./Calendar";
import { VacationLegend } from "./VacationLegend";
import { VacationsList } from "./VacationsList";
import { VacationActionDialog } from "./VacationActionDialog";
import { useTeamCalendar } from "@/components/hooks/useTeamCalendar";
import type { TeamListItemDTO, VacationRequestViewModel } from "@/types";
import { Loader2 } from "lucide-react";

interface CalendarViewProps {
  teams: TeamListItemDTO[];
  initialTeamId: string;
  currentUser: {
    id: string;
    firstName: string;
    lastName: string;
    role: "ADMINISTRATOR" | "HR" | "EMPLOYEE";
  };
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  teams,
  initialTeamId,
  // currentUser - reserved for future use (e.g., permission checks)
}) => {
  const { state, actions } = useTeamCalendar(initialTeamId);
  const [selectedVacation, setSelectedVacation] = useState<VacationRequestViewModel | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Synchronize URL with selected team and month
  useEffect(() => {
    const url = new URL(window.location.href);
    const currentTeamParam = url.searchParams.get('teamId');
    const currentMonthParam = url.searchParams.get('month');

    // Extract month from dateRange (YYYY-MM format)
    const currentMonth = state.dateRange.start.substring(0, 7);

    let needsUpdate = false;

    if (currentTeamParam !== state.selectedTeamId) {
      url.searchParams.set('teamId', state.selectedTeamId);
      needsUpdate = true;
    }

    if (currentMonthParam !== currentMonth) {
      url.searchParams.set('month', currentMonth);
      needsUpdate = true;
    }

    if (needsUpdate) {
      window.history.replaceState({}, '', url.toString());
    }
  }, [state.selectedTeamId, state.dateRange.start]);

  // Adapter function for Calendar's onDateRangeChange signature
  // Must be memoized to prevent Calendar's handleDatesSet from being recreated
  const handleDateRangeChange = useCallback(
    (startDate: string, endDate: string) => {
      actions.setDateRange({ start: startDate, end: endDate });
    },
    [actions]
  );

  // Handle event click - open dialog with actions
  const handleEventClick = useCallback((vacation: VacationRequestViewModel) => {
    setSelectedVacation(vacation);
    setIsDialogOpen(true);
  }, []);

  // Handle successful action - reload page with current params
  const handleActionSuccess = useCallback(() => {
    // Preserve URL params (teamId, month) when reloading
    const url = new URL(window.location.href);

    // Ensure current team and month are in URL
    url.searchParams.set('teamId', state.selectedTeamId);
    const currentMonth = state.dateRange.start.substring(0, 7);
    url.searchParams.set('month', currentMonth);

    // Reload with preserved params
    window.location.href = url.toString();
  }, [state.selectedTeamId, state.dateRange.start]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kalendarz zespołu</h1>
          <p className="text-muted-foreground mt-1">
            Przegląd urlopów członków zespołu
          </p>
        </div>
      </div>

      {/* Team Selector */}
      <div className="flex items-center gap-4">
        <TeamSelector
          teams={teams}
          selectedTeamId={state.selectedTeamId}
          onTeamChange={actions.setSelectedTeamId}
          disabled={state.isLoading}
        />
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-semibold">Błąd</p>
          <p className="text-sm mt-1">{state.error.message}</p>
        </div>
      )}

      {/* Loading State */}
      {state.isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">
            Ładowanie kalendarza...
          </span>
        </div>
      )}

      {/* Calendar and Legend */}
      {!state.error && (
        <div className="space-y-6">
          <Calendar
            vacations={state.calendarData}
            onDateRangeChange={handleDateRangeChange}
            isLoading={state.isLoading}
            onEventClick={handleEventClick}
            initialDate={state.dateRange.start}
          />
          <VacationLegend />
        </div>
      )}

      {/* Vacations List or No Data Message */}
      {!state.isLoading && !state.error && (
        <>
          {state.calendarData.length > 0 ? (
            <VacationsList
              vacations={state.calendarData}
              onVacationClick={handleEventClick}
            />
          ) : (
            <div className="rounded-lg border bg-card p-8 text-center">
              <p className="text-muted-foreground">
                Brak urlopów w wybranym okresie
              </p>
            </div>
          )}
        </>
      )}

      {/* Vacation Action Dialog */}
      <VacationActionDialog
        vacation={selectedVacation}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
};
