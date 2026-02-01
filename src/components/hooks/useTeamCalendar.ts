/**
 * useTeamCalendar hook
 * Manages state and data fetching for team calendar view
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { VacationRequestViewModel, GetTeamCalendarResponseDTO } from "@/types";

interface UseTeamCalendarState {
  isLoading: boolean;
  error: Error | null;
  calendarData: VacationRequestViewModel[];
  selectedTeamId: string;
  dateRange: { start: string; end: string };
}

interface UseTeamCalendarActions {
  setSelectedTeamId: (teamId: string) => void;
  setDateRange: (range: { start: string; end: string }) => void;
}

interface UseTeamCalendarReturn {
  state: UseTeamCalendarState;
  actions: UseTeamCalendarActions;
}

/**
 * Custom hook for managing team calendar state
 * @param initialTeamId - Initial team ID to display
 * @returns State and actions for calendar management
 */
export function useTeamCalendar(initialTeamId: string): UseTeamCalendarReturn {
  // Get current month's date range or from URL (memoized to run only once)
  const initialDateRange = useMemo(() => {
    // Helper function to format date as YYYY-MM-DD in local timezone
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Try to read month from URL
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const monthParam = url.searchParams.get('month');

      if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
        // Parse YYYY-MM format
        const [year, month] = monthParam.split('-').map(Number);
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0); // Last day of the month

        const range = {
          start: formatLocalDate(start),
          end: formatLocalDate(end),
        };

        console.log("[useTeamCalendar] Initialized from URL:", { monthParam, range });
        return range;
      }
    }

    // Fallback to current month
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const range = {
      start: formatLocalDate(start),
      end: formatLocalDate(end),
    };

    console.log("[useTeamCalendar] Initialized to current month:", { now: now.toISOString(), range });
    return range;
  }, []); // Empty deps = run only once

  const [selectedTeamId, setSelectedTeamIdState] = useState(initialTeamId);
  const [dateRange, setDateRangeState] = useState(initialDateRange);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [calendarData, setCalendarData] = useState<VacationRequestViewModel[]>([]);

  // Track last fetched parameters to avoid duplicate requests
  const lastFetchedRef = useRef<{ teamId: string; start: string; end: string } | null>(null);

  // Fetch calendar data
  const fetchCalendarData = useCallback(
    async (teamId: string, range: { start: string; end: string }) => {
      setIsLoading(true);
      setError(null);

      // Add timeout controller (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        // Build query parameters
        const params = new URLSearchParams({
          startDate: range.start,
          endDate: range.end,
        });

        // Add all status filters to show all vacation requests
        params.append("includeStatus", "SUBMITTED");
        params.append("includeStatus", "APPROVED");
        params.append("includeStatus", "REJECTED");
        params.append("includeStatus", "CANCELLED");

        const response = await fetch(`/api/teams/${teamId}/calendar?${params.toString()}`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Zespół nie został znaleziony");
          } else if (response.status === 403) {
            throw new Error("Nie masz uprawnień do wyświetlenia tego kalendarza");
          } else {
            throw new Error("Nie udało się pobrać danych kalendarza");
          }
        }

        const data: GetTeamCalendarResponseDTO = await response.json();

        // Transform data to VacationRequestViewModel[]
        const vacations: VacationRequestViewModel[] = [];

        data.members.forEach((member) => {
          member.vacations.forEach((vacation) => {
            vacations.push({
              id: vacation.id,
              startDate: vacation.startDate,
              endDate: vacation.endDate,
              businessDaysCount: vacation.businessDaysCount,
              status: vacation.status,
              user: {
                id: member.id,
                firstName: member.firstName,
                lastName: member.lastName,
              },
            });
          });
        });

        setCalendarData(vacations);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error("[useTeamCalendar] Error fetching calendar data:", err);

        if (err instanceof Error && err.name === 'AbortError') {
          setError(new Error("Przekroczono limit czasu ładowania kalendarza (30s). Spróbuj ponownie."));
        } else {
          setError(err instanceof Error ? err : new Error("Nieznany błąd"));
        }
        setCalendarData([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Effect to fetch data when teamId or dateRange changes
  useEffect(() => {
    // Check if parameters actually changed to avoid duplicate requests
    const isSameAsPrevious =
      lastFetchedRef.current &&
      lastFetchedRef.current.teamId === selectedTeamId &&
      lastFetchedRef.current.start === dateRange.start &&
      lastFetchedRef.current.end === dateRange.end;

    if (isSameAsPrevious) {
      console.log("[useTeamCalendar] Skipping duplicate fetch for same parameters");
      return;
    }

    // Update last fetched parameters
    lastFetchedRef.current = {
      teamId: selectedTeamId,
      start: dateRange.start,
      end: dateRange.end,
    };

    fetchCalendarData(selectedTeamId, dateRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeamId, dateRange.start, dateRange.end]);

  // Action handlers
  const setSelectedTeamId = useCallback((teamId: string) => {
    setSelectedTeamIdState(teamId);
  }, []);

  const setDateRange = useCallback((range: { start: string; end: string }) => {
    setDateRangeState(range);
  }, []);

  // Memoize state and actions to prevent unnecessary re-renders
  const state = useMemo(
    () => ({
      isLoading,
      error,
      calendarData,
      selectedTeamId,
      dateRange,
    }),
    [isLoading, error, calendarData, selectedTeamId, dateRange.start, dateRange.end]
  );

  const actions = useMemo(
    () => ({
      setSelectedTeamId,
      setDateRange,
    }),
    [setSelectedTeamId, setDateRange]
  );

  return {
    state,
    actions,
  };
}
