/**
 * Team Calendar Component
 * Displays vacation calendar for user's teams
 */
import { useState, useEffect } from "react";
import { Calendar, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { GetTeamCalendarResponseDTO } from "@/types";

interface Team {
  id: string;
  name: string;
}

interface TeamCalendarProps {
  userTeams: Team[];
}

/**
 * Component displaying team vacation calendar
 */
export function TeamCalendar({ userTeams }: TeamCalendarProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(userTeams.length > 0 ? userTeams[0].id : "");
  const [calendarData, setCalendarData] = useState<GetTeamCalendarResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Get current month range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const formatDateForAPI = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const [dateRange, setDateRange] = useState({
    startDate: formatDateForAPI(startOfMonth),
    endDate: formatDateForAPI(endOfMonth),
  });

  // Fetch calendar data
  useEffect(() => {
    if (!selectedTeamId) return;

    const fetchCalendar = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });

        const response = await fetch(`/api/teams/${selectedTeamId}/calendar?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Nie udało się pobrać kalendarza zespołu");
        }

        const data: GetTeamCalendarResponseDTO = await response.json();
        setCalendarData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Nieznany błąd";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendar();
  }, [selectedTeamId, dateRange]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const changeMonth = (direction: "prev" | "next") => {
    const currentStart = new Date(dateRange.startDate);
    let newDate: Date;

    if (direction === "prev") {
      newDate = new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 1);
    } else {
      newDate = new Date(currentStart.getFullYear(), currentStart.getMonth() + 1, 1);
    }

    const newEnd = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0);

    setDateRange({
      startDate: formatDateForAPI(newDate),
      endDate: formatDateForAPI(newEnd),
    });
  };

  const getCurrentMonthYear = () => {
    const date = new Date(dateRange.startDate);
    return date.toLocaleDateString("pl-PL", {
      month: "long",
      year: "numeric",
    });
  };

  if (userTeams.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Kalendarz zespołu</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Nie należysz do żadnego zespołu. Skontaktuj się z administratorem.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Kalendarz zespołu</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-4 flex items-center gap-4">
            {/* Team Selector */}
            <div className="flex-1">
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz zespół" />
                </SelectTrigger>
                <SelectContent>
                  {userTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {team.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => changeMonth("prev")}>
                ←
              </Button>
              <span className="text-sm font-medium min-w-[140px] text-center">{getCurrentMonthYear()}</span>
              <Button variant="outline" size="sm" onClick={() => changeMonth("next")}>
                →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-6">
          {isLoading && <div className="text-center py-8 text-muted-foreground">Ładowanie kalendarza...</div>}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!isLoading && !error && calendarData && (
            <div className="space-y-4">
              {calendarData.members.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Brak członków w zespole</p>
              ) : (
                calendarData.members.map((member) => (
                  <div key={member.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {member.firstName} {member.lastName}
                        </h4>
                        {member.vacations.length === 0 ? (
                          <p className="text-sm text-muted-foreground mt-1">Brak urlopów w tym okresie</p>
                        ) : (
                          <div className="mt-2 space-y-2">
                            {member.vacations.map((vacation) => (
                              <div
                                key={vacation.id}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border mr-2 ${getStatusColor(
                                  vacation.status
                                )}`}
                              >
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {formatDate(vacation.startDate)} - {formatDate(vacation.endDate)}
                                </span>
                                <span className="font-semibold">({vacation.businessDaysCount} dni)</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
