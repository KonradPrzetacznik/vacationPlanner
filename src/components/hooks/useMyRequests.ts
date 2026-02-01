/**
 * Custom hook for managing user's vacation requests
 * Handles fetching, filtering, creating, and cancelling vacation requests
 */
import { useState, useCallback, useEffect } from "react";
import type {
  VacationRequestListItemDTO,
  CreateVacationRequestDTO,
} from "@/types";

/**
 * Request filters view model
 */
export interface RequestFilters {
  status?: ("SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED")[];
}

/**
 * User vacation allowance view model
 */
export interface UserVacationAllowance {
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  fromPreviousYear: {
    total: number;
    utilizationDeadline: string; // "YYYY-MM-DD"
  };
}

interface UseMyRequestsReturn {
  requests: VacationRequestListItemDTO[];
  allowance: UserVacationAllowance;
  filters: RequestFilters;
  isLoading: boolean;
  error: Error | null;
  setFilters: (filters: RequestFilters) => void;
  cancelRequest: (id: string) => Promise<void>;
  createRequest: (data: CreateVacationRequestDTO) => Promise<void>;
  refreshRequests: () => Promise<void>;
}

/**
 * Custom hook for managing user's vacation requests
 *
 * @param initialRequests - Initial list of vacation requests from server
 * @param initialAllowance - Initial vacation allowance data
 * @returns Hook API with state and actions
 */
export function useMyRequests(
  initialRequests: VacationRequestListItemDTO[],
  initialAllowance: UserVacationAllowance
): UseMyRequestsReturn {
  const [requests, setRequests] = useState<VacationRequestListItemDTO[]>(initialRequests);
  const [allowance, setAllowance] = useState<UserVacationAllowance>(initialAllowance);
  const [filters, setFiltersState] = useState<RequestFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch vacation requests from API with current filters
   */
  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      if (filters.status && filters.status.length > 0) {
        filters.status.forEach(status => {
          queryParams.append("status", status);
        });
      }

      const response = await fetch(`/api/vacation-requests?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch vacation requests");
      }

      const data = await response.json();
      setRequests(data.data || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      console.error("Error fetching vacation requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  /**
   * Update filters and trigger data refresh
   */
  const setFilters = useCallback((newFilters: RequestFilters) => {
    setFiltersState(newFilters);
  }, []);

  /**
   * Refresh requests when filters change
   */
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  /**
   * Cancel a vacation request
   */
  const cancelRequest = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/vacation-requests/${id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel vacation request");
      }

      const data = await response.json();

      // Update local state with cancelled request
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === id
            ? { ...req, status: "CANCELLED" as const, updatedAt: data.updatedAt }
            : req
        )
      );

      // Refresh allowance data
      // TODO: Fetch updated allowance when endpoint is ready
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      console.error("Error cancelling vacation request:", error);
      throw error; // Re-throw to allow component to handle it
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new vacation request
   */
  const createRequest = useCallback(async (data: CreateVacationRequestDTO) => {
    setIsLoading(true);
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
        throw new Error(errorData.error || "Failed to create vacation request");
      }

      // Refresh requests list to include new request
      await fetchRequests();

      // Refresh allowance data
      // TODO: Fetch updated allowance when endpoint is ready
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      console.error("Error creating vacation request:", error);
      throw error; // Re-throw to allow component to handle it
    } finally {
      setIsLoading(false);
    }
  }, [fetchRequests]);

  /**
   * Manually refresh requests list
   */
  const refreshRequests = useCallback(async () => {
    await fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    allowance,
    filters,
    isLoading,
    error,
    setFilters,
    cancelRequest,
    createRequest,
    refreshRequests,
  };
}
