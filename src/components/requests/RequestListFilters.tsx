/**
 * Request List Filters Component
 * Provides filtering controls for vacation requests list
 */
import { useState } from "react";
import type { RequestFilters } from "../hooks/useMyRequests";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { X } from "lucide-react";

interface RequestListFiltersProps {
  filters: RequestFilters;
  onFilterChange: (filters: RequestFilters) => void;
}

/**
 * Component with filter controls for vacation requests
 */
export function RequestListFilters({
  filters,
  onFilterChange,
}: RequestListFiltersProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>(
    filters.status && filters.status.length > 0 ? filters.status[0] : "all"
  );

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);

    if (value === "all") {
      onFilterChange({ ...filters, status: undefined });
    } else {
      onFilterChange({
        ...filters,
        status: [value as "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED"],
      });
    }
  };

  const handleClearFilters = () => {
    setSelectedStatus("all");
    onFilterChange({});
  };

  const hasActiveFilters = selectedStatus !== "all";

  return (
    <div className="flex items-center gap-3">
      <Select value={selectedStatus} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Filtruj po statusie" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Wszystkie</SelectItem>
          <SelectItem value="SUBMITTED">Oczekujące</SelectItem>
          <SelectItem value="APPROVED">Zatwierdzone</SelectItem>
          <SelectItem value="REJECTED">Odrzucone</SelectItem>
          <SelectItem value="CANCELLED">Anulowane</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="h-9"
        >
          <X className="mr-1 h-4 w-4" />
          Wyczyść
        </Button>
      )}
    </div>
  );
}
