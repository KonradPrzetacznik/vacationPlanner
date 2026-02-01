import { useState, useCallback } from "react";
import type { UserListItemDTO, UsersPaginationDTO } from "@/types";
import { useUsersManagement } from "@/components/hooks/useUsersManagement.ts";
import { PageHeader } from "./PageHeader.tsx";
import { UsersFilters } from "./UsersFilters.tsx";
import { UsersTable } from "./UsersTable.tsx";
import { UsersPagination } from "./UsersPagination.tsx";
import { UserFormDialog } from "./UserFormDialog.tsx";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog.tsx";

interface UsersManagementProps {
  initialUsers: UserListItemDTO[];
  initialPagination: UsersPaginationDTO;
  currentUserId: string;
}

/**
 * Main component for Users Management view
 * Orchestrates all subcomponents and manages state
 */
export function UsersManagement({ initialUsers, initialPagination, currentUserId }: UsersManagementProps) {
  const { users, pagination, filters, isLoading, updateFilters, updatePagination, createUser, updateUser, deleteUser } =
    useUsersManagement(initialUsers, initialPagination, currentUserId);

  // Dialog states - split to prevent unnecessary re-renders
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [userFormMode, setUserFormMode] = useState<"create" | "edit">("create");
  const [editingUser, setEditingUser] = useState<UserListItemDTO | undefined>(undefined);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState("");
  const [deleteUserName, setDeleteUserName] = useState("");

  // Handlers (wrapped in useCallback to prevent re-creation on every render)
  const handleAddUser = useCallback(() => {
    console.log("handleAddUser called - opening dialog");
    setUserFormMode("create");
    setEditingUser(undefined);
    setIsUserFormOpen(true);
    console.log("Dialog state should be set to open");
  }, []);

  const handleEditUser = useCallback((user: UserListItemDTO) => {
    console.log("handleEditUser called for user:", user.id);
    setUserFormMode("edit");
    setEditingUser(user);
    setIsUserFormOpen(true);
    console.log("Edit dialog state should be set to open");
  }, []);

  const handleDeleteUser = useCallback((userId: string, userName: string) => {
    console.log("handleDeleteUser called for user:", userId);
    setDeleteUserId(userId);
    setDeleteUserName(userName);
    setIsDeleteDialogOpen(true);
    console.log("Delete dialog state should be set to open");
  }, []);

  const handleUserFormOpenChange = useCallback((open: boolean) => {
    console.log("handleUserFormOpenChange called with:", open);
    setIsUserFormOpen(open);
  }, []);

  const handleDeleteDialogOpenChange = useCallback((open: boolean) => {
    console.log("handleDeleteDialogOpenChange called with:", open);
    setIsDeleteDialogOpen(open);
  }, []);

  const handleUserFormClose = useCallback(() => {
    setIsUserFormOpen(false);
  }, []);

  const handleDeleteDialogClose = useCallback(() => {
    setIsDeleteDialogOpen(false);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader onAddUserClick={handleAddUser} />

      {/* Filters */}
      <UsersFilters
        searchQuery={filters.searchQuery}
        roleFilter={filters.roleFilter}
        showDeleted={filters.showDeleted}
        onSearchChange={(query: string) => updateFilters({ searchQuery: query })}
        onRoleFilterChange={(role: "ALL" | "ADMINISTRATOR" | "HR" | "EMPLOYEE") => updateFilters({ roleFilter: role })}
        onShowDeletedChange={(show: boolean) => updateFilters({ showDeleted: show })}
        onClearFilters={() =>
          updateFilters({
            searchQuery: "",
            roleFilter: "ALL",
            showDeleted: false,
          })
        }
      />

      {/* Users Table */}
      <UsersTable
        users={users}
        currentUserId={currentUserId}
        isLoading={isLoading}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
      />

      {/* Pagination */}
      <UsersPagination
        total={pagination.total}
        limit={pagination.limit}
        offset={pagination.offset}
        onPageChange={updatePagination}
      />

      {/* User Form Dialog (Add/Edit) */}
      <UserFormDialog
        mode={userFormMode}
        user={editingUser}
        currentUserId={currentUserId}
        isOpen={isUserFormOpen}
        onOpenChange={handleUserFormOpenChange}
        onSuccess={handleUserFormClose}
        onCreateUser={createUser}
        onUpdateUser={updateUser}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        userId={deleteUserId}
        userName={deleteUserName}
        isOpen={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogOpenChange}
        onSuccess={handleDeleteDialogClose}
        onDeleteUser={deleteUser}
      />
    </div>
  );
}
