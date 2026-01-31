import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCallback } from "react";

interface PageHeaderProps {
  onAddUserClick: () => void;
}

/**
 * Page header with title and add user button
 */
export function PageHeader({ onAddUserClick }: PageHeaderProps) {
  const handleClick = useCallback(() => {
    console.log("PageHeader: Add user button clicked");
    onAddUserClick();
  }, [onAddUserClick]);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Zarządzanie użytkownikami
        </h1>
        <p className="text-muted-foreground mt-2">
          Przeglądaj, dodawaj i edytuj konta użytkowników
        </p>
      </div>
      <Button onClick={handleClick}>
        <Plus className="mr-2 h-4 w-4" />
        Dodaj użytkownika
      </Button>
    </div>
  );
}
