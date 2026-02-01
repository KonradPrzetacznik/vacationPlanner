import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface UsersPaginationProps {
  total: number;
  limit: number;
  offset: number;
  onPageChange: (newOffset: number) => void;
}

/**
 * Pagination component for users list
 */
export function UsersPagination({ total, limit, offset, onPageChange }: UsersPaginationProps) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = offset + limit < total;
  const hasPrevPage = offset > 0;

  const startItem = total === 0 ? 0 : offset + 1;
  const endItem = Math.min(offset + limit, total);

  const handlePrevious = () => {
    if (hasPrevPage) {
      onPageChange(Math.max(0, offset - limit));
    }
  };

  const handleNext = () => {
    if (hasNextPage) {
      onPageChange(offset + limit);
    }
  };

  if (total === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
      <div className="text-sm text-muted-foreground">
        Wyświetlanie <span className="font-medium">{startItem}</span> - <span className="font-medium">{endItem}</span> z{" "}
        <span className="font-medium">{total}</span> użytkowników
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handlePrevious} disabled={!hasPrevPage}>
          <ChevronLeft className="h-4 w-4" />
          Poprzednia
        </Button>

        <div className="text-sm text-muted-foreground">
          Strona {currentPage} z {totalPages}
        </div>

        <Button variant="outline" size="sm" onClick={handleNext} disabled={!hasNextPage}>
          Następna
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
