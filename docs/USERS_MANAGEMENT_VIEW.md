# Users Management View - Documentation

## Overview

The Users Management view is an administrative interface for managing user accounts in the VacationPlanner application. It is located at `/admin/users` and is accessible only to users with the `ADMINISTRATOR` role.

## Components Structure

```
UsersPage (Astro) - /src/pages/admin/users.astro
└── UsersManagement (React) - Main orchestrator component
    ├── PageHeader - Title and "Add User" button
    ├── UsersFilters - Search and filtering controls
    ├── UsersTable - Table displaying users with actions
    ├── UsersPagination - Pagination controls
    ├── UserFormDialog - Modal for creating/editing users
    └── DeleteConfirmDialog - Confirmation modal for deletion
```

## Features Implemented

### ✅ Core Features

- **User List Display**: Paginated table showing all users
- **Search & Filter**: Text search (firstName, lastName, email) with 300ms debounce
- **Role Filter**: Filter by ADMINISTRATOR, HR, or EMPLOYEE roles
- **Show Deleted**: Toggle to include soft-deleted users in the list
- **Pagination**: Navigate through pages with customizable limit (default: 50)

### ✅ CRUD Operations

- **Create User**: Add new user with temporary password
- **Update User**: Edit user details (firstName, lastName, role)
- **Delete User**: Soft-delete with automatic vacation cancellation
- **View User**: Display user details with status badges

### ✅ Security & Authorization

- **Role-Based Access**: Only ADMINISTRATOR can access this view
- **Self-Edit Protection**: Users cannot change their own role
- **Self-Delete Protection**: Users cannot delete themselves (UI disabled)
- **Middleware Validation**: Route protected at middleware level

### ✅ UI/UX Features

- **Real-time Validation**: Form validation with Zod schemas
- **Toast Notifications**: Success/error messages using Sonner
- **Loading States**: Spinners during async operations
- **Empty States**: User-friendly message when no users found
- **Status Badges**: Visual indicators for Active/Deleted status
- **Role Badges**: Color-coded badges for user roles
- **Responsive Design**: Mobile-friendly layout

## API Integration

The view integrates with the following endpoints:

1. **GET /api/users**
   - Query params: `limit`, `offset`, `role`, `includeDeleted`
   - Returns: `GetUsersResponseDTO` with paginated user list

2. **POST /api/users**
   - Body: `CreateUserDTO` (firstName, lastName, email, role, temporaryPassword)
   - Returns: `CreateUserResponseDTO` with new user details

3. **PATCH /api/users/:id**
   - Body: `UpdateUserDTO` (firstName?, lastName?, role?)
   - Returns: `UpdateUserResponseDTO` with updated user

4. **DELETE /api/users/:id**
   - Returns: `DeleteUserResponseDTO` with deletion info and cancelled vacations count

## Custom Hooks

### useUsersManagement

Encapsulates all state management and CRUD operations for users.

**Features:**

- Automatic data fetching on filter/pagination change
- Client-side search filtering
- CRUD operation wrappers with error handling
- Toast notifications on success/error

**Usage:**

```typescript
const {
  users, // Filtered user list
  pagination, // Pagination state
  filters, // Current filters
  isLoading, // Loading state
  updateFilters, // Update filter values
  updatePagination, // Change page
  createUser, // Create new user
  updateUser, // Update user
  deleteUser, // Delete user
  refreshUsers, // Manually refresh list
} = useUsersManagement(initialUsers, initialPagination, currentUserId);
```

### useDebounce

Delays value updates to prevent excessive API calls during typing.

**Usage:**

```typescript
const debouncedSearchQuery = useDebounce(searchQuery, 300);
```

## Form Validation

### Create User Schema

- **firstName**: Required, 1-100 chars, trimmed
- **lastName**: Required, 1-100 chars, trimmed
- **email**: Required, valid email format, lowercase, trimmed
- **role**: Required, enum value (ADMINISTRATOR | HR | EMPLOYEE)
- **temporaryPassword**: Required, 8-100 chars

### Edit User Schema

- **firstName**: Required, 1-100 chars, trimmed
- **lastName**: Required, 1-100 chars, trimmed
- **role**: Required, enum value (disabled for self-edit)

## File Structure

```
src/
├── pages/
│   └── admin/
│       └── users.astro                    # Main page (SSR)
├── components/
│   ├── users/
│   │   ├── index.ts                       # Exports
│   │   ├── UsersManagement.tsx            # Main orchestrator
│   │   ├── PageHeader.tsx                 # Page title + add button
│   │   ├── UsersFilters.tsx               # Search + filters
│   │   ├── UsersTable.tsx                 # User list table
│   │   ├── UsersPagination.tsx            # Pagination controls
│   │   ├── UserFormDialog.tsx             # Create/Edit form
│   │   └── DeleteConfirmDialog.tsx        # Delete confirmation
│   └── hooks/
│       ├── useUsersManagement.ts          # Main state management hook
│       └── useDebounce.ts                 # Debouncing hook
├── middleware/
│   └── index.ts                           # Authorization middleware
└── types.ts                               # Shared TypeScript types
```

## Testing Checklist

### Manual Testing

- [x] Page loads without errors
- [x] Users table displays correctly
- [x] Search filter works with debounce
- [x] Role filter updates the list
- [x] Show deleted checkbox toggles deleted users
- [x] Pagination controls work
- [x] Add user dialog opens and validates input
- [x] Edit user dialog pre-fills with user data
- [x] Cannot change own role in edit mode
- [x] Delete confirmation shows warning
- [x] Success toasts appear after operations
- [x] Error toasts appear on failures
- [x] Loading states show during API calls

### API Testing

To test the implementation, you can use the test scripts in `/tests/api/`:

- `users-list.test.sh` - Test GET /api/users
- `users-create.test.sh` - Test POST /api/users
- `users-update.test.sh` - Test PATCH /api/users/:id
- `users-delete.test.sh` - Test DELETE /api/users/:id

## Known Limitations (MVP)

1. **Search Implementation**: Currently implements client-side search filtering. For better performance with large datasets (1000+ users), consider implementing server-side search parameter in the API.

2. **Table Sorting**: Sorting columns is not implemented in MVP. Can be added as enhancement.

3. **Bulk Operations**: No bulk delete or bulk role assignment in MVP.

4. **User Avatar**: No avatar/profile picture support in MVP.

5. **Audit Log**: User changes are not logged in an audit trail (can be added with database triggers).

## Future Enhancements

1. **Advanced Search**: Server-side full-text search
2. **Column Sorting**: Sortable table columns
3. **Export Functionality**: Export user list to CSV/Excel
4. **Bulk Operations**: Multi-select and bulk actions
5. **User Details Page**: Dedicated page for viewing full user profile
6. **Activity History**: Show user's vacation history
7. **Email Notifications**: Send email on user creation with temporary password
8. **Password Reset**: Allow admins to trigger password reset for users

## Troubleshooting

### Users not loading

- Check if Supabase connection is configured (env variables)
- Check browser console for API errors
- Verify DEFAULT_USER_ID exists in database and has ADMINISTRATOR role

### Cannot create users

- Ensure email is unique (not already in database)
- Check password meets minimum requirements (8 chars)
- Verify current user has ADMINISTRATOR role

### Delete operation fails

- Check if user is already deleted
- Verify user exists in database
- Check if current user is trying to delete themselves

### Middleware blocks access

- Verify DEFAULT_USER_ID is set to Administrator user ID
- Check user role in database (should be 'ADMINISTRATOR')
- Clear browser cache and try again

## Development Notes

### Default User Configuration

For development/testing, the application uses a hardcoded user ID:

- File: `src/db/supabase.client.ts`
- Constant: `DEFAULT_USER_ID`
- Current value: `00000000-0000-0000-0000-000000000001` (Administrator)

This should be replaced with proper session management in production.

### Styling

The view uses Tailwind CSS 4 and Shadcn/ui components. Custom styling follows the project's design system defined in `src/styles/global.css`.

### Type Safety

All API interactions use TypeScript interfaces defined in `src/types.ts`. The view maintains full type safety throughout the component tree.
