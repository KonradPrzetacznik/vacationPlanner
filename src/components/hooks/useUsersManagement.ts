import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type {
  UserListItemDTO,
  UsersPaginationDTO,
  GetUsersResponseDTO,
  CreateUserDTO,
  CreateUserResponseDTO,
  UpdateUserDTO,
  UpdateUserResponseDTO,
  DeleteUserResponseDTO,
} from "@/types";

export interface UsersFiltersState {
  searchQuery: string;
  roleFilter: "ALL" | "ADMINISTRATOR" | "HR" | "EMPLOYEE";
  showDeleted: boolean;
}

export interface PaginationState {
  limit: number;
  offset: number;
  total: number;
}

/**
 * Custom hook for managing users state and operations
 * Encapsulates all CRUD operations and API communication
 */
export function useUsersManagement(
  initialUsers: UserListItemDTO[],
  initialPagination: UsersPaginationDTO,
  currentUserId: string
) {
  const [users, setUsers] = useState<UserListItemDTO[]>(initialUsers);

  // Split pagination into separate primitives to prevent unnecessary re-renders
  const [paginationLimit, setPaginationLimit] = useState(initialPagination.limit);
  const [paginationOffset, setPaginationOffset] = useState(initialPagination.offset);
  const [paginationTotal, setPaginationTotal] = useState(initialPagination.total);

  // Split filters into separate primitives
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMINISTRATOR" | "HR" | "EMPLOYEE">("ALL");
  const [showDeleted, setShowDeleted] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  /**
   * Fetch users from API with current filters and pagination
   */
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: paginationLimit.toString(),
        offset: paginationOffset.toString(),
        includeDeleted: showDeleted.toString(),
      });

      if (roleFilter !== "ALL") {
        params.append("role", roleFilter);
      }

      const response = await fetch(`/api/users?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }

      const data: GetUsersResponseDTO = await response.json();
      setUsers(data.data);
      setPaginationTotal(data.pagination.total);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Nie udało się pobrać listy użytkowników");
    } finally {
      setIsLoading(false);
    }
  }, [paginationLimit, paginationOffset, showDeleted, roleFilter]);

  /**
   * Create a new user
   */
  const createUser = async (data: CreateUserDTO): Promise<CreateUserResponseDTO> => {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Nie udało się utworzyć użytkownika");
    }

    const result = await response.json();
    toast.success("Użytkownik został utworzony pomyślnie");
    await fetchUsers(); // Refresh list
    return result;
  };

  /**
   * Update an existing user
   */
  const updateUser = async (
    userId: string,
    data: UpdateUserDTO
  ): Promise<UpdateUserResponseDTO> => {
    const response = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Nie udało się zaktualizować użytkownika");
    }

    const result = await response.json();
    toast.success("Użytkownik został zaktualizowany pomyślnie");
    await fetchUsers(); // Refresh list
    return result;
  };

  /**
   * Delete a user (soft-delete)
   */
  const deleteUser = async (userId: string): Promise<DeleteUserResponseDTO> => {
    const response = await fetch(`/api/users/${userId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Nie udało się usunąć użytkownika");
    }

    const result = await response.json();

    // Show success message with info about cancelled vacations
    if (result.cancelledVacations > 0) {
      toast.success(
        `Użytkownik został usunięty. Anulowano ${result.cancelledVacations} przyszłych urlopów.`
      );
    } else {
      toast.success("Użytkownik został usunięty pomyślnie");
    }

    await fetchUsers(); // Refresh list
    return result;
  };

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters: Partial<UsersFiltersState>) => {
    if (newFilters.searchQuery !== undefined) setSearchQuery(newFilters.searchQuery);
    if (newFilters.roleFilter !== undefined) setRoleFilter(newFilters.roleFilter);
    if (newFilters.showDeleted !== undefined) setShowDeleted(newFilters.showDeleted);

    // Reset to first page when filters change
    setPaginationOffset(0);
  }, []);

  /**
   * Update pagination
   */
  const updatePagination = useCallback((newOffset: number) => {
    setPaginationOffset(newOffset);
  }, []);

  /**
   * Client-side filtering and sorting
   * Applied after API filtering
   */
  const filteredUsers = users
    .filter((user) => {
      // Filter out deleted users if showDeleted is false
      if (!showDeleted && user.deletedAt) {
        return false;
      }

      // Filter by search query
      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const email = user.email.toLowerCase();

      return (
        fullName.includes(query) ||
        email.includes(query)
      );
    })
    .sort((a, b) => {
      // Sort by role: ADMINISTRATOR first, then HR, then EMPLOYEE
      const roleOrder = {
        ADMINISTRATOR: 1,
        HR: 2,
        EMPLOYEE: 3,
      };

      const roleA = roleOrder[a.role] || 999;
      const roleB = roleOrder[b.role] || 999;

      if (roleA !== roleB) {
        return roleA - roleB;
      }

      // If same role, sort by last name, then first name
      const lastNameCompare = a.lastName.localeCompare(b.lastName, 'pl');
      if (lastNameCompare !== 0) return lastNameCompare;

      return a.firstName.localeCompare(b.firstName, 'pl');
    });

  // Fetch users when filters or pagination change
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationLimit, paginationOffset, showDeleted, roleFilter]);

  return {
    users: filteredUsers,
    allUsers: users, // Unfiltered for count
    pagination: {
      limit: paginationLimit,
      offset: paginationOffset,
      total: paginationTotal,
    },
    filters: {
      searchQuery,
      roleFilter,
      showDeleted,
    },
    isLoading,
    currentUserId,
    updateFilters,
    updatePagination,
    createUser,
    updateUser,
    deleteUser,
    refreshUsers: fetchUsers,
  };
}
