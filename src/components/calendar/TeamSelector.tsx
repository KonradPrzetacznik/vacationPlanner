/**
 * TeamSelector component
 * Allows user to select a team for which to display the calendar
 */

import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { TeamListItemDTO } from "@/types";

interface TeamSelectorProps {
  teams: TeamListItemDTO[];
  selectedTeamId: string;
  onTeamChange: (teamId: string) => void;
  disabled?: boolean;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  teams,
  selectedTeamId,
  onTeamChange,
  disabled = false,
}) => {
  return (
    <div className="w-full max-w-xs">
      <Label htmlFor="team-selector" className="mb-2 block text-sm font-medium">
        Wybierz zespół
      </Label>
      <Select value={selectedTeamId} onValueChange={onTeamChange} disabled={disabled}>
        <SelectTrigger id="team-selector">
          <SelectValue placeholder="Wybierz zespół" />
        </SelectTrigger>
        <SelectContent>
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
