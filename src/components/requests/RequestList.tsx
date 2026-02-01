/**
 * Request List Component
 * Displays list of vacation requests with filtering
 */
import { useState } from "react";
import type { VacationRequestListItemDTO } from "@/types";
import type { RequestFilters } from "../hooks/useMyRequests";
import { RequestListFilters } from "./RequestListFilters.tsx";
import { RequestListItem } from "./RequestListItem.tsx";

interface RequestListProps {
  requests: VacationRequestListItemDTO[];
  isLoading: boolean;
  onFilterChange: (filters: RequestFilters) => void;
  onCancelRequest: (id: string) => void;
}

/**
 * Component displaying list of vacation requests
 */
export function RequestList({
  requests,
  isLoading,
  onFilterChange,
  onCancelRequest,
}: RequestListProps) {
  const [localFilters, setLocalFilters] = useState<RequestFilters>({});

  const handleFilterChange = (filters: RequestFilters) => {
    setLocalFilters(filters);
    onFilterChange(filters);
  };

  if (isLoading && requests.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Ładowanie wniosków...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Lista wniosków</h2>
        <RequestListFilters
          filters={localFilters}
          onFilterChange={handleFilterChange}
        />
      </div>

      {requests.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            Nie masz jeszcze żadnych wniosków urlopowych.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <RequestListItem
              key={request.id}
              request={request}
              onCancel={onCancelRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
}
