# API Usage Examples

This document provides practical examples of using the Vacation Planner API.

## Table of Contents

- [Getting Started](#getting-started)
- [Users API](#users-api)
  - [List Users](#list-users)
  - [Get User by ID](#get-user-by-id)
  - [Create User](#create-user)
  - [Update User](#update-user)
  - [Delete User](#delete-user)
- [Common Use Cases](#common-use-cases)
- [Error Handling](#error-handling)

---

## Getting Started

**Base URL (Development):** `http://localhost:3000`

**Prerequisites:**
1. Start the development server: `npm run dev`
2. Ensure Supabase is running: `supabase start`
3. Database should be seeded: `./reset-db.sh`

**Testing Tools:**
- `curl` - Command-line HTTP client
- `jq` - JSON processor (optional, for pretty printing)
- Browser DevTools - For testing in web applications

---

## Users API

### List Users

#### Example 1: Get All Users (Default)

**Request:**
```bash
curl "http://localhost:3000/api/users"
```

**Response:**
```json
{
  "data": [
    {
      "id": "00000000-0000-0000-0000-000000000001",
      "firstName": "Admin",
      "lastName": "User-ADM",
      "email": "admin.user@vacationplanner.pl",
      "role": "ADMINISTRATOR",
      "deletedAt": null,
      "createdAt": "2026-01-04T23:03:55.998107+00:00",
      "updatedAt": "2026-01-04T23:03:55.998107+00:00"
    }
    // ... more users (up to 50 by default)
  ],
  "pagination": {
    "total": 13,
    "limit": 50,
    "offset": 0
  }
}
```

---

#### Example 2: Get Employees Only (Filtered by Role)

**Request:**
```bash
curl "http://localhost:3000/api/users?role=EMPLOYEE"
```

**Use Case:** Display only employees in a team management interface.

---

#### Example 3: Pagination (Get 5 Users per Page)

**Request:**
```bash
# First page
curl "http://localhost:3000/api/users?limit=5&offset=0"

# Second page
curl "http://localhost:3000/api/users?limit=5&offset=5"

# Third page
curl "http://localhost:3000/api/users?limit=5&offset=10"
```

**JavaScript Example:**
```javascript
async function getUsers(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  const response = await fetch(
    `http://localhost:3000/api/users?limit=${limit}&offset=${offset}`
  );
  const data = await response.json();
  
  return {
    users: data.data,
    totalPages: Math.ceil(data.pagination.total / limit),
    currentPage: page,
    total: data.pagination.total
  };
}

// Usage
const page1 = await getUsers(1, 10);
console.log(`Showing ${page1.users.length} of ${page1.total} users`);
```

---

#### Example 4: Filter by Team

**Request:**
```bash
curl "http://localhost:3000/api/users?teamId=10000000-0000-0000-0000-000000000001"
```

**Use Case:** Show all members of the "Green Team" in a team dashboard.

---

#### Example 5: Include Soft-Deleted Users (Admin Only)

**Request:**
```bash
curl "http://localhost:3000/api/users?includeDeleted=true"
```

**Use Case:** Admin audit view showing historical user data.

**Note:** Only ADMINISTRATOR role can access deleted users.

---

#### Example 6: Complex Query (HR View)

**Request:**
```bash
curl "http://localhost:3000/api/users?role=EMPLOYEE&limit=20&offset=0&teamId=10000000-0000-0000-0000-000000000001"
```

**Use Case:** HR manager viewing employees in a specific team with pagination.

---

### Get User by ID

#### Example 7: Get User Profile

**Request:**
```bash
curl "http://localhost:3000/api/users/00000000-0000-0000-0000-000000000010"
```

**Response:**
```json
{
  "data": {
    "id": "00000000-0000-0000-0000-000000000010",
    "firstName": "Kazimierz",
    "lastName": "Pawlak-EMP",
    "email": "kazimierz.pawlak@vacationplanner.pl",
    "role": "EMPLOYEE",
    "deletedAt": null,
    "createdAt": "2026-01-04T23:03:55.998107+00:00",
    "updatedAt": "2026-01-04T23:03:55.998107+00:00",
    "teams": [
      {
        "id": "10000000-0000-0000-0000-000000000001",
        "name": "Green Team"
      },
      {
        "id": "10000000-0000-0000-0000-000000000002",
        "name": "Red Team"
      }
    ]
  }
}
```

**Use Case:** Display user profile page with team memberships.

---

#### Example 8: User with No Teams

**Request:**
```bash
curl "http://localhost:3000/api/users/00000000-0000-0000-0000-000000000001"
```

**Response:**
```json
{
  "data": {
    "id": "00000000-0000-0000-0000-000000000001",
    "firstName": "Admin",
    "lastName": "User-ADM",
    "email": "admin.user@vacationplanner.pl",
    "role": "ADMINISTRATOR",
    "deletedAt": null,
    "createdAt": "2026-01-04T23:03:55.998107+00:00",
    "updatedAt": "2026-01-04T23:03:55.998107+00:00",
    "teams": []
  }
}
```

**Note:** `teams` array is empty when user is not assigned to any team.

---

#### Example 9: React Component - User Profile

**JavaScript/React Example:**
```typescript
import { useState, useEffect } from 'react';

interface Team {
  id: string;
  name: string;
}

interface UserDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  teams: Team[];
}

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`/api/users/${userId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setUser(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user');
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h1>{user.firstName} {user.lastName}</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      
      <h2>Teams</h2>
      {user.teams.length > 0 ? (
        <ul>
          {user.teams.map(team => (
            <li key={team.id}>{team.name}</li>
          ))}
        </ul>
      ) : (
        <p>Not assigned to any team</p>
      )}
    </div>
  );
}

export default UserProfile;
```

---

### Create User

#### Example 10: Create Employee User

**Request:**
```bash
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "temporaryPassword": "TempPass123"
  }'
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "role": "EMPLOYEE",
  "requiresPasswordReset": true,
  "createdAt": "2026-01-06T10:00:00Z"
}
```

**Use Case:** Administrator creating a new employee account during onboarding.

**Requirements:**
- **Role Required:** ADMINISTRATOR
- **Permissions:** Only administrators can create users

---

#### Example 11: Create User with Specific Role

**Request:**
```bash
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Manager",
    "email": "jane.manager@example.com",
    "role": "HR",
    "temporaryPassword": "SecureTemp456"
  }'
```

**Response (201 Created):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "firstName": "Jane",
  "lastName": "Manager",
  "email": "jane.manager@example.com",
  "role": "HR",
  "requiresPasswordReset": true,
  "createdAt": "2026-01-06T10:05:00Z"
}
```

**Available Roles:**
- `EMPLOYEE` (default if not specified)
- `HR`
- `ADMINISTRATOR`

---

#### Example 12: Create User Error - Duplicate Email

**Request:**
```bash
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Duplicate",
    "email": "john.doe@example.com",
    "temporaryPassword": "TempPass123"
  }'
```

**Response (400 Bad Request):**
```json
{
  "error": "User with this email already exists"
}
```

---

#### Example 13: Create User Error - Validation Failed

**Request:**
```bash
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "",
    "lastName": "Test",
    "email": "invalid-email",
    "temporaryPassword": "short"
  }'
```

**Response (400 Bad Request):**
```json
{
  "error": "Validation failed",
  "details": {
    "firstName": ["First name is required"],
    "email": ["Invalid email format"],
    "temporaryPassword": ["Password must be at least 8 characters"]
  }
}
```

---

### Update User

#### Example 14: Update User Name (Admin)

**Request:**
```bash
curl -X PATCH "http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith"
  }'
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "john.doe@example.com",
  "role": "EMPLOYEE",
  "updatedAt": "2026-01-06T12:00:00Z"
}
```

**Use Case:** Administrator or employee updating profile information.

**Permissions:**
- **ADMINISTRATOR:** Can update all fields (except email) for all users
- **EMPLOYEE:** Can only update their own firstName and lastName

---

#### Example 15: Update User Role (Admin Only)

**Request:**
```bash
curl -X PATCH "http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "HR"
  }'
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "john.doe@example.com",
  "role": "HR",
  "updatedAt": "2026-01-06T12:05:00Z"
}
```

**Note:** Only administrators can change user roles.

---

#### Example 16: Update Multiple Fields at Once

**Request:**
```bash
curl -X PATCH "http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Updated",
    "role": "EMPLOYEE"
  }'
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "John",
  "lastName": "Updated",
  "email": "john.doe@example.com",
  "role": "EMPLOYEE",
  "updatedAt": "2026-01-06T12:10:00Z"
}
```

---

#### Example 17: Update Error - Cannot Change Own Role

**Request:**
```bash
# Assuming current user is trying to change their own role
curl -X PATCH "http://localhost:3000/api/users/00000000-0000-0000-0000-000000000001" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "EMPLOYEE"
  }'
```

**Response (400 Bad Request):**
```json
{
  "error": "Cannot change your own role"
}
```

---

#### Example 18: Update Error - User Not Found

**Request:**
```bash
curl -X PATCH "http://localhost:3000/api/users/00000000-0000-0000-0000-000000000999" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test"
  }'
```

**Response (404 Not Found):**
```json
{
  "error": "User not found"
}
```

---

#### Example 19: Update Error - Insufficient Permissions

**Request:**
```bash
# Employee trying to update another user
curl -X PATCH "http://localhost:3000/api/users/00000000-0000-0000-0000-000000000010" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Unauthorized"
  }'
```

**Response (403 Forbidden):**
```json
{
  "error": "Insufficient permissions: Cannot edit other users"
}
```

---

### Delete User

#### Example 20: Soft-Delete User

**Request:**
```bash
curl -X DELETE "http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000"
```

**Response (200 OK):**
```json
{
  "message": "User deleted successfully",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "deletedAt": "2026-01-06T14:00:00Z",
  "cancelledVacations": 2
}
```

**Use Case:** Administrator deactivating user account and cancelling their pending vacation requests.

**Requirements:**
- **Role Required:** ADMINISTRATOR
- **Permissions:** Only administrators can delete users

**Behavior:**
- Performs soft-delete (sets `deleted_at` timestamp)
- Automatically cancels all future vacation requests
- User can be viewed with `includeDeleted=true` parameter
- User data is preserved for audit purposes

---

#### Example 21: Delete Error - User Not Found

**Request:**
```bash
curl -X DELETE "http://localhost:3000/api/users/00000000-0000-0000-0000-000000000999"
```

**Response (404 Not Found):**
```json
{
  "error": "User not found"
}
```

---

#### Example 22: Delete Error - User Already Deleted

**Request:**
```bash
# Trying to delete the same user twice
curl -X DELETE "http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000"
```

**Response (404 Not Found):**
```json
{
  "error": "User already deleted"
}
```

---

#### Example 23: Delete Error - Insufficient Permissions

**Request:**
```bash
# Non-administrator trying to delete user
curl -X DELETE "http://localhost:3000/api/users/00000000-0000-0000-0000-000000000010"
```

**Response (403 Forbidden):**
```json
{
  "error": "Forbidden: Administrator role required"
}
```

---

#### Example 24: Verify Deleted User in List

**Request:**
```bash
# Get users without includeDeleted flag
curl "http://localhost:3000/api/users"

# Get users with includeDeleted flag to see soft-deleted users
curl "http://localhost:3000/api/users?includeDeleted=true"
```

**Use Case:** Admin audit view showing both active and deactivated users.

---

## Common Use Cases

### Use Case 1: Team Dashboard

Display all members of a specific team:

```bash
# 1. Get team members
curl "http://localhost:3000/api/users?teamId=10000000-0000-0000-0000-000000000001"

# 2. For each user, fetch detailed info with teams
curl "http://localhost:3000/api/users/00000000-0000-0000-0000-000000000010"
```

---

### Use Case 2: User Directory (HR View)

Paginated list of all active employees:

```bash
# Get first page
curl "http://localhost:3000/api/users?role=EMPLOYEE&limit=20&offset=0"

# Calculate total pages from response.pagination.total
```

**JavaScript Implementation:**
```javascript
class UserDirectory {
  constructor(itemsPerPage = 20) {
    this.itemsPerPage = itemsPerPage;
  }

  async getPage(pageNumber) {
    const offset = (pageNumber - 1) * this.itemsPerPage;
    const response = await fetch(
      `/api/users?role=EMPLOYEE&limit=${this.itemsPerPage}&offset=${offset}`
    );
    return response.json();
  }

  async getAllPages() {
    const firstPage = await this.getPage(1);
    const totalPages = Math.ceil(firstPage.pagination.total / this.itemsPerPage);
    
    const allPages = [firstPage];
    for (let i = 2; i <= totalPages; i++) {
      allPages.push(await this.getPage(i));
    }
    
    return allPages.flatMap(page => page.data);
  }
}

// Usage
const directory = new UserDirectory(20);
const page1 = await directory.getPage(1);
console.log(page1.data); // First 20 employees
```

---

### Use Case 3: Admin Panel - User Management

Get all users including deleted ones for audit:

```bash
curl "http://localhost:3000/api/users?includeDeleted=true&limit=100"
```

**Python Example:**
```python
import requests

def get_all_users_for_audit():
    """Fetch all users including deleted for admin audit"""
    response = requests.get(
        "http://localhost:3000/api/users",
        params={
            "includeDeleted": True,
            "limit": 100
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        return {
            "total": data["pagination"]["total"],
            "active": len([u for u in data["data"] if u["deletedAt"] is None]),
            "deleted": len([u for u in data["data"] if u["deletedAt"] is not None]),
            "users": data["data"]
        }
    
    raise Exception(f"API error: {response.status_code}")

# Usage
audit_data = get_all_users_for_audit()
print(f"Total: {audit_data['total']}, Active: {audit_data['active']}, Deleted: {audit_data['deleted']}")
```

---

### Use Case 4: Employee Self-Service

Employee viewing their own profile:

```bash
# Replace with actual user ID from authentication
curl "http://localhost:3000/api/users/YOUR_USER_ID"
```

**Authorization Note:** Employees can only view their own profile. Attempting to view another user's profile will return 404.

---

## Error Handling

### HTTP Status Codes Summary

| Status Code | Meaning | Common Causes |
|-------------|---------|---------------|
| 200 | OK | Successful GET, PATCH, DELETE request |
| 201 | Created | Successful POST request (user created) |
| 400 | Bad Request | Invalid input, validation failed, business rule violation |
| 403 | Forbidden | Insufficient permissions for the operation |
| 404 | Not Found | User not found, already deleted, or access denied |
| 500 | Internal Server Error | Server-side error, database issue |

---

### Error Codes by Endpoint

#### GET /api/users
- **400:** Invalid query parameters (e.g., invalid UUID for teamId)
- **403:** Non-administrator trying to use `includeDeleted=true`
- **404:** Team not found (when filtering by teamId)
- **500:** Database connection error

#### GET /api/users/:id
- **400:** Invalid user ID format (not a valid UUID)
- **403:** Insufficient permissions (Employee viewing other users)
- **404:** User not found or soft-deleted
- **500:** Database error

#### POST /api/users
- **400:** 
  - Validation failed (missing fields, invalid email, password too short)
  - Email already exists
  - Invalid role value
  - Invalid JSON in request body
- **403:** Non-administrator trying to create user
- **500:** Failed to create user account or profile

#### PATCH /api/users/:id
- **400:**
  - Invalid user ID format
  - Validation failed (empty fields, invalid values)
  - No fields provided for update
  - Trying to change own role
  - Invalid JSON in request body
- **403:** Insufficient permissions (Employee editing other users)
- **404:** User not found or soft-deleted
- **500:** Failed to update user

#### DELETE /api/users/:id
- **400:** Invalid user ID format
- **403:** Non-administrator trying to delete user
- **404:** User not found or already deleted
- **500:** Failed to delete user or cancel vacations

---

### Error Example 1: Invalid UUID Format (400)

**Request:**
```bash
curl "http://localhost:3000/api/users/invalid-uuid"
```

**Response:**
```json
{
  "error": "Invalid user ID format",
  "details": {
    "id": ["Invalid user ID format"]
  }
}
```

**Handling in JavaScript:**
```javascript
async function getUserSafely(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();
    
    if (response.status === 400) {
      console.error('Invalid user ID:', data.error);
      return null;
    }
    
    if (response.status === 404) {
      console.error('User not found');
      return null;
    }
    
    return data.data;
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}
```

---

### Error Example 2: User Not Found (404)

**Request:**
```bash
curl "http://localhost:3000/api/users/00000000-0000-0000-0000-999999999999"
```

**Response:**
```json
{
  "error": "User not found"
}
```

---

### Error Example 3: Insufficient Permissions (403)

**Scenario:** Employee trying to view another user's profile.

**Response:**
```json
{
  "error": "Insufficient permissions to view this user"
}
```

---

### Error Example 4: Server Error (500)

**Response:**
```json
{
  "error": "Internal server error"
}
```

**Handling:**
- Retry the request after a delay
- Show user-friendly error message
- Log error for debugging
- Contact support if persistent

---

## Best Practices

### 1. Always Check Response Status

```javascript
const response = await fetch('/api/users');
if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}
```

### 2. Handle Pagination Properly

```javascript
// Calculate total pages
const totalPages = Math.ceil(pagination.total / pagination.limit);

// Don't request beyond total pages
if (currentPage > totalPages) {
  console.warn('No more pages available');
}
```

### 3. Cache User Data When Appropriate

```javascript
const userCache = new Map();

async function getUserWithCache(userId) {
  if (userCache.has(userId)) {
    return userCache.get(userId);
  }
  
  const response = await fetch(`/api/users/${userId}`);
  const data = await response.json();
  
  userCache.set(userId, data.data);
  return data.data;
}
```

### 4. Validate UUIDs Before Making Requests

```javascript
function isValidUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

if (!isValidUUID(userId)) {
  console.error('Invalid UUID format');
  return;
}
```

### 5. Use TypeScript Types

```typescript
import type { 
  UserDetailsDTO, 
  GetUsersResponseDTO,
  TeamReferenceDTO 
} from '@/types';

async function getUser(id: string): Promise<UserDetailsDTO | null> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) return null;
  
  const data: { data: UserDetailsDTO } = await response.json();
  return data.data;
}
```

---

## Additional Resources

- **Full API Documentation:** See [.ai/api-users-documentation.md](.ai/api-users-documentation.md)
- **Type Definitions:** See [src/types.ts](../src/types.ts)
- **Test Scripts:** See [tests/api/](../tests/api/)
- **Implementation Plan:** See [.ai/view-implementation-plan.md](.ai/view-implementation-plan.md)

---

## Support

For issues or questions:
1. Check [TESTING.md](../TESTING.md) for troubleshooting
2. Review test scripts in `tests/api/` for working examples
3. Check server logs in `/tmp/astro-test.log`
4. Ensure Supabase is running: `supabase status`

