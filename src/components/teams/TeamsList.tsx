import type { TeamListItemDTO } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamsListProps {
  teams: TeamListItemDTO[];
  selectedTeamId: string | null;
  onTeamSelect: (teamId: string) => void;
  isLoading?: boolean;
}

/**
 * List component displaying available teams
 * Allows selection of a team to view details
 */
export function TeamsList({
  teams,
  selectedTeamId,
  onTeamSelect,
  isLoading = false,
}: TeamsListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium mb-2">
            Brak zespołów
          </p>
          <p className="text-sm text-muted-foreground">
            Utwórz pierwszy zespół, aby rozpocząć zarządzanie
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {teams.map((team) => (
            <TeamsListItem
              key={team.id}
              team={team}
              isSelected={team.id === selectedTeamId}
              onClick={() => onTeamSelect(team.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface TeamsListItemProps {
  team: TeamListItemDTO;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Single team item in the list
 * Displays team name and member count
 */
function TeamsListItem({ team, isSelected, onClick }: TeamsListItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 text-left transition-colors hover:bg-muted/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isSelected && "bg-muted"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate">{team.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {team.memberCount ?? 0}{" "}
              {team.memberCount === 1 ? "członek" : "członków"}
            </span>
          </div>
        </div>
        {isSelected && (
          <Badge variant="default" className="ml-2">
            Wybrano
          </Badge>
        )}
      </div>
    </button>
  );
}

export { TeamsListItem };
