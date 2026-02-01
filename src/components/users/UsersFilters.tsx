import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useDebounce } from "@/components/hooks/useDebounce.ts";
import { useState, useEffect } from "react";

interface UsersFiltersProps {
  searchQuery: string;
  roleFilter: "ALL" | "ADMINISTRATOR" | "HR" | "EMPLOYEE";
  showDeleted: boolean;
  onSearchChange: (query: string) => void;
  onRoleFilterChange: (role: UsersFiltersProps["roleFilter"]) => void;
  onShowDeletedChange: (show: boolean) => void;
  onClearFilters?: () => void;
}

/**
 * Filters component for users list
 * Includes search, role filter, and show deleted checkbox
 */
export function UsersFilters({
  searchQuery,
  roleFilter,
  showDeleted,
  onSearchChange,
  onRoleFilterChange,
  onShowDeletedChange,
  onClearFilters,
}: UsersFiltersProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300);

  // Update parent when debounced value changes
  useEffect(() => {
    onSearchChange(debouncedSearchQuery);
  }, [debouncedSearchQuery, onSearchChange]);

  const hasActiveFilters = searchQuery !== "" || roleFilter !== "ALL" || showDeleted;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <Label htmlFor="search" className="sr-only">
            Wyszukaj użytkownika
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              type="text"
              placeholder="Wyszukaj po imieniu, nazwisku lub emailu..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Role Filter */}
          <div className="w-[200px]">
            <Label htmlFor="role-filter" className="sr-only">
              Filtruj po roli
            </Label>
            <Select
              value={roleFilter}
              onValueChange={(value) => onRoleFilterChange(value as UsersFiltersProps["roleFilter"])}
            >
              <SelectTrigger id="role-filter">
                <SelectValue placeholder="Filtruj po roli" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Wszystkie role</SelectItem>
                <SelectItem value="ADMINISTRATOR">Administrator</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="EMPLOYEE">Pracownik</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Show Deleted Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-deleted"
              checked={showDeleted}
              onCheckedChange={(checked) => onShowDeletedChange(checked === true)}
            />
            <Label
              htmlFor="show-deleted"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Pokaż usuniętych użytkowników
            </Label>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && onClearFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="ml-auto">
              <X className="mr-2 h-4 w-4" />
              Wyczyść filtry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
