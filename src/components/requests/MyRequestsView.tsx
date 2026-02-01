/**
 * Main component for "My Requests" view
 * Displays user's vacation requests, summary, and team calendar
 */
import { useMyRequests, type RequestFilters, type UserVacationAllowance } from "../hooks/useMyRequests";
import type { VacationRequestListItemDTO } from "@/types";
import { VacationSummary } from "./VacationSummary.tsx";
import { RequestList } from "./RequestList.tsx";
import { TeamCalendar } from "./TeamCalendar.tsx";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Team {
  id: string;
  name: string;
}

interface MyRequestsViewProps {
  initialRequests: VacationRequestListItemDTO[];
  initialAllowance: UserVacationAllowance;
  userTeams: Team[];
}

/**
 * Main view component for managing user's vacation requests
 */
export default function MyRequestsView({ initialRequests, initialAllowance, userTeams }: MyRequestsViewProps) {
  const { requests, allowance, isLoading, error, setFilters, cancelRequest } = useMyRequests(
    initialRequests,
    initialAllowance
  );

  const handleFilterChange = (newFilters: RequestFilters) => {
    setFilters(newFilters);
  };

  const handleCancelRequest = async (id: string) => {
    try {
      await cancelRequest(id);
      toast.success("Wniosek został anulowany", {
        description: "Dni urlopowe zostały zwrócone do Twojej puli",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nie udało się anulować wniosku";
      toast.error("Błąd anulowania", {
        description: message,
      });
    }
  };

  const handleNewRequest = () => {
    // Navigate to new request form
    window.location.href = "/requests/new";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Moje Wnioski</h1>
        <Button onClick={handleNewRequest}>
          <Plus className="mr-2 h-4 w-4" />
          Złóż nowy wniosek
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-medium">Wystąpił błąd</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      {/* Vacation Summary */}
      <div className="mb-8">
        <VacationSummary allowance={allowance} />
      </div>

      {/* Request List */}
      <div className="mb-8">
        <RequestList
          requests={requests}
          isLoading={isLoading}
          onFilterChange={handleFilterChange}
          onCancelRequest={handleCancelRequest}
        />
      </div>

      {/* Team Calendar */}
      <TeamCalendar userTeams={userTeams} />
    </div>
  );
}
