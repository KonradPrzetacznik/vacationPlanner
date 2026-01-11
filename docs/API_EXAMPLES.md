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
- [Teams API](#teams-api)
  - [List Teams](#list-teams)
  - [Get Team by ID](#get-team-by-id)
  - [Create Team](#create-team)
  - [Update Team](#update-team)
  - [Delete Team](#delete-team)
- [Vacation Requests API](#vacation-requests-api)
  - [List Vacation Requests](#list-vacation-requests)
  - [Get Vacation Request by ID](#get-vacation-request-by-id)
  - [Create Vacation Request](#create-vacation-request)
  - [Approve Vacation Request](#approve-vacation-request-hr-only)
  - [Reject Vacation Request](#reject-vacation-request-hr-only)
  - [Cancel Vacation Request](#cancel-vacation-request-employee---owner-only)
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

## Teams API

### List Teams

#### Example 1: Get All Teams (Default)

**Request:**
```bash
curl "http://localhost:4321/api/teams"
```

**Response:**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Engineering",
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-01-01T10:00:00.000Z"
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "name": "Marketing",
      "createdAt": "2026-01-02T11:00:00.000Z",
      "updatedAt": "2026-01-02T11:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 50,
    "offset": 0
  }
}
```

**Response Fields:**
- `data` - Array of team objects
- `pagination.total` - Total number of teams
- `pagination.limit` - Items per page
- `pagination.offset` - Current offset

---

#### Example 2: Get Teams with Member Count

**Request:**
```bash
curl "http://localhost:4321/api/teams?includeMemberCount=true"
```

**Response:**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Engineering",
      "memberCount": 15,
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-01-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 50,
    "offset": 0
  }
}
```

**Note:** Including member count may impact performance for large datasets.

---

#### Example 3: Paginated Teams List

**Request:**
```bash
curl "http://localhost:4321/api/teams?limit=10&offset=20"
```

**Parameters:**
- `limit` - Number of items per page (1-100, default: 50)
- `offset` - Number of items to skip (min: 0, default: 0)
- `includeMemberCount` - Include member count (boolean, default: false)

---

### Get Team by ID

#### Example 1: Get Team Details with Members

**Request:**
```bash
curl "http://localhost:4321/api/teams/123e4567-e89b-12d3-a456-426614174000"
```

**Response:**
```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Engineering",
    "createdAt": "2026-01-01T10:00:00.000Z",
    "updatedAt": "2026-01-01T10:00:00.000Z",
    "members": [
      {
        "id": "user-uuid-1",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "role": "EMPLOYEE",
        "joinedAt": "2026-01-01T10:00:00.000Z"
      },
      {
        "id": "user-uuid-2",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@example.com",
        "role": "HR",
        "joinedAt": "2026-01-02T11:00:00.000Z"
      }
    ]
  }
}
```

**Response Fields:**
- `data.id` - Team UUID
- `data.name` - Team name
- `data.members` - Array of team members with profile information
- `data.members[].joinedAt` - When user joined the team

---

#### Example 2: Team Not Found

**Request:**
```bash
curl "http://localhost:4321/api/teams/00000000-0000-0000-0000-000000000099"
```

**Response (404):**
```json
{
  "error": "Team not found"
}
```

---

#### Example 3: Invalid Team ID Format

**Request:**
```bash
curl "http://localhost:4321/api/teams/invalid-uuid"
```

**Response (400):**
```json
{
  "error": "Invalid team ID format",
  "details": {
    "id": ["Invalid uuid"]
  }
}
```

---

### Create Team

**Authorization:** Only HR and ADMINISTRATOR roles can create teams.

#### Example 1: Create Team Successfully

**Request:**
```bash
curl -X POST "http://localhost:4321/api/teams" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product Design"
  }'
```

**Response (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "name": "Product Design",
  "createdAt": "2026-01-07T12:00:00.000Z"
}
```

---

#### Example 2: Team Name Already Exists

**Request:**
```bash
curl -X POST "http://localhost:4321/api/teams" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Engineering"
  }'
```

**Response (400):**
```json
{
  "error": "Team name already exists"
}
```

---

#### Example 3: Validation Errors

**Request (empty name):**
```bash
curl -X POST "http://localhost:4321/api/teams" \
  -H "Content-Type: application/json" \
  -d '{
    "name": ""
  }'
```

**Response (400):**
```json
{
  "error": "Validation failed",
  "details": {
    "name": ["Team name is required"]
  }
}
```

**Request (name too long):**
```bash
curl -X POST "http://localhost:4321/api/teams" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "A very long team name that exceeds the maximum allowed length of one hundred characters which is not permitted"
  }'
```

**Response (400):**
```json
{
  "error": "Validation failed",
  "details": {
    "name": ["Team name must not exceed 100 characters"]
  }
}
```

---

#### Example 4: Insufficient Permissions (EMPLOYEE)

**Response (403):**
```json
{
  "error": "Insufficient permissions"
}
```

**Note:** EMPLOYEE role cannot create teams. Only HR and ADMINISTRATOR can.

---

### Update Team

**Authorization:** Only HR and ADMINISTRATOR roles can update teams.

#### Example 1: Update Team Name Successfully

**Request:**
```bash
curl -X PATCH "http://localhost:4321/api/teams/123e4567-e89b-12d3-a456-426614174000" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Engineering & DevOps"
  }'
```

**Response (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Engineering & DevOps",
  "updatedAt": "2026-01-07T13:00:00.000Z"
}
```

---

#### Example 2: Team Not Found

**Request:**
```bash
curl -X PATCH "http://localhost:4321/api/teams/00000000-0000-0000-0000-000000000099" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Name"
  }'
```

**Response (404):**
```json
{
  "error": "Team not found"
}
```

---

#### Example 3: Duplicate Team Name

**Request:**
```bash
curl -X PATCH "http://localhost:4321/api/teams/123e4567-e89b-12d3-a456-426614174000" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Marketing"
  }'
```

**Response (400):**
```json
{
  "error": "Team name already exists"
}
```

---

### Delete Team

**Authorization:** Only HR and ADMINISTRATOR roles can delete teams.

**Warning:** Deleting a team will automatically remove all team memberships (CASCADE).

#### Example 1: Delete Team Successfully

**Request:**
```bash
curl -X DELETE "http://localhost:4321/api/teams/123e4567-e89b-12d3-a456-426614174000"
```

**Response (200):**
```json
{
  "message": "Team deleted successfully",
  "id": "123e4567-e89b-12d3-a456-426614174000"
}
```

---

#### Example 2: Team Not Found

**Request:**
```bash
curl -X DELETE "http://localhost:4321/api/teams/00000000-0000-0000-0000-000000000099"
```

**Response (404):**
```json
{
  "error": "Team not found"
}
```

---

### Teams API - JavaScript Examples

#### Fetch All Teams

```javascript
async function getAllTeams() {
  const response = await fetch('http://localhost:4321/api/teams');
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
}

// Usage
getAllTeams()
  .then(result => {
    console.log(`Total teams: ${result.pagination.total}`);
    result.data.forEach(team => {
      console.log(`- ${team.name} (${team.id})`);
    });
  })
  .catch(error => console.error('Error:', error));
```

---

#### Fetch Teams with Member Count

```javascript
async function getTeamsWithMembers() {
  const response = await fetch('http://localhost:4321/api/teams?includeMemberCount=true');
  const data = await response.json();
  return data.data;
}
```

---

#### Get Team Details by ID

```javascript
async function getTeamById(teamId) {
  const response = await fetch(`http://localhost:4321/api/teams/${teamId}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Team not found');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data;
}

// Usage
getTeamById('123e4567-e89b-12d3-a456-426614174000')
  .then(team => {
    console.log(`Team: ${team.name}`);
    console.log(`Members: ${team.members.length}`);
    team.members.forEach(member => {
      console.log(`  - ${member.firstName} ${member.lastName} (${member.role})`);
    });
  })
  .catch(error => console.error('Error:', error));
```

---

## Vacation Requests API

### List Vacation Requests

#### Example 1: Get All Vacation Requests (Default)

**Request:**
```bash
curl "http://localhost:4321/api/vacation-requests"
```

**Response:**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "userId": "223e4567-e89b-12d3-a456-426614174000",
      "user": {
        "id": "223e4567-e89b-12d3-a456-426614174000",
        "firstName": "Jan",
        "lastName": "Kowalski"
      },
      "startDate": "2025-12-15",
      "endDate": "2025-12-26",
      "businessDaysCount": 4,
      "status": "APPROVED",
      "processedByUserId": "00000000-0000-0000-0000-000000000001",
      "processedAt": "2025-12-01T10:30:00Z",
      "createdAt": "2025-11-28T12:00:00Z",
      "updatedAt": "2025-12-01T10:30:00Z"
    }
    // ... more requests
  ],
  "pagination": {
    "total": 4,
    "limit": 50,
    "offset": 0
  }
}
```

**Access Control:**
- **EMPLOYEE:** Can only view their own vacation requests
- **HR:** Can view requests from team members
- **ADMINISTRATOR:** Can view all requests

---

#### Example 2: Filter by Status

**Request:**
```bash
# Single status
curl "http://localhost:4321/api/vacation-requests?status=SUBMITTED"

# Multiple statuses
curl "http://localhost:4321/api/vacation-requests?status=SUBMITTED&status=APPROVED"
```

**Use Case:** Display pending requests that need review.

**Available Statuses:**
- `SUBMITTED` - Request awaiting approval
- `APPROVED` - Request approved by manager
- `REJECTED` - Request rejected
- `CANCELLED` - Request cancelled by user

---

#### Example 3: Filter by Date Range

**Request:**
```bash
# Requests starting from specific date
curl "http://localhost:4321/api/vacation-requests?startDate=2026-01-01"

# Requests within date range
curl "http://localhost:4321/api/vacation-requests?startDate=2026-01-01&endDate=2026-12-31"
```

**Use Case:** View vacation requests for a specific period (e.g., Q1 2026).

---

#### Example 4: Filter by User ID (Admin/HR)

**Request:**
```bash
curl "http://localhost:4321/api/vacation-requests?userId=223e4567-e89b-12d3-a456-426614174000"
```

**Use Case:** View all vacation requests for a specific employee.

**Note:** EMPLOYEE role can only use their own userId.

---

#### Example 5: Filter by Team ID (HR/Admin)

**Request:**
```bash
curl "http://localhost:4321/api/vacation-requests?teamId=323e4567-e89b-12d3-a456-426614174000"
```

**Use Case:** View all vacation requests from a specific team.

**Note:** HR users can only filter by teams they are members of.

---

#### Example 6: Pagination

**Request:**
```bash
# First page (5 items)
curl "http://localhost:4321/api/vacation-requests?limit=5&offset=0"

# Second page
curl "http://localhost:4321/api/vacation-requests?limit=5&offset=5"
```

**Use Case:** Implement paginated list in UI.

---

#### Example 7: Combined Filters

**Request:**
```bash
curl "http://localhost:4321/api/vacation-requests?status=SUBMITTED&startDate=2026-01-01&limit=10"
```

**Use Case:** Find all pending requests for vacations starting in 2026, showing 10 at a time.

---

### Validation Errors

#### Invalid Limit

**Request:**
```bash
curl "http://localhost:4321/api/vacation-requests?limit=999"
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid query parameters",
  "details": {
    "limit": ["Number must be less than or equal to 100"]
  }
}
```

---

#### Invalid UUID Format

**Request:**
```bash
curl "http://localhost:4321/api/vacation-requests?userId=invalid-uuid"
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid query parameters",
  "details": {
    "userId": ["Invalid UUID format"]
  }
}
```

---

#### Invalid Date Format

**Request:**
```bash
curl "http://localhost:4321/api/vacation-requests?startDate=2026-13-45"
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid query parameters",
  "details": {
    "startDate": ["Invalid date"]
  }
}
```

---

#### Invalid Status

**Request:**
```bash
curl "http://localhost:4321/api/vacation-requests?status=INVALID_STATUS"
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid query parameters",
  "details": {
    "status": ["Invalid enum value. Expected 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED'"]
  }
}
```

---

### Authorization Errors

#### Employee Accessing Other User's Requests

**Request:**
```bash
# Assuming current user is EMPLOYEE with different ID
curl "http://localhost:4321/api/vacation-requests?userId=other-user-id"
```

**Response (403 Forbidden):**
```json
{
  "error": "You can only view your own vacation requests"
}
```

---

#### HR Accessing Non-Member Team

**Request:**
```bash
# HR trying to access team they're not a member of
curl "http://localhost:4321/api/vacation-requests?teamId=non-member-team-id"
```

**Response (403 Forbidden):**
```json
{
  "error": "You are not a member of this team"
}
```

---

---

### Get Vacation Request by ID

#### Example 1: Get Detailed Information About a Vacation Request

**Request:**
```bash
curl "http://localhost:4321/api/vacation-requests/123e4567-e89b-12d3-a456-426614174000"
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "223e4567-e89b-12d3-a456-426614174000",
    "user": {
      "id": "223e4567-e89b-12d3-a456-426614174000",
      "firstName": "Jan",
      "lastName": "Kowalski",
      "email": "jan.kowalski@vacationplanner.pl"
    },
    "startDate": "2025-12-15",
    "endDate": "2025-12-26",
    "businessDaysCount": 4,
    "status": "APPROVED",
    "processedByUserId": "00000000-0000-0000-0000-000000000001",
    "processedBy": {
      "id": "00000000-0000-0000-0000-000000000001",
      "firstName": "Admin",
      "lastName": "User"
    },
    "processedAt": "2025-12-01T10:30:00Z",
    "createdAt": "2025-11-28T12:00:00Z",
    "updatedAt": "2025-12-01T10:30:00Z"
  }
}
```

**Access Control:**
- **EMPLOYEE:** Can only view their own vacation requests
- **HR:** Can view requests from team members (users in same team)
- **ADMINISTRATOR:** Can view all requests

**Use Case:** Display detailed information about a specific vacation request in a detail view.

---

#### Example 2: Invalid UUID Format

**Request:**
```bash
curl "http://localhost:4321/api/vacation-requests/invalid-uuid"
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid vacation request ID format"
}
```

---

#### Example 3: Vacation Request Not Found

**Request:**
```bash
curl "http://localhost:4321/api/vacation-requests/00000000-0000-0000-0000-000000000000"
```

**Response (404 Not Found):**
```json
{
  "error": "Vacation request not found"
}
```

---

#### Example 4: Unauthorized Access (EMPLOYEE)

**Request:**
```bash
# Employee trying to view another employee's vacation request
curl "http://localhost:4321/api/vacation-requests/other-user-request-id"
```

**Response (403 Forbidden):**
```json
{
  "error": "You can only view your own vacation requests"
}
```

---

#### Example 5: Unauthorized Access (HR)

**Request:**
```bash
# HR trying to view request from user not in their team
curl "http://localhost:4321/api/vacation-requests/non-team-member-request-id"
```

**Response (403 Forbidden):**
```json
{
  "error": "You are not authorized to view this vacation request"
}
```

---

### Create Vacation Request

#### Example 1: Create New Vacation Request

**Request:**
```bash
curl -X POST "http://localhost:4321/api/vacation-requests" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-02-02",
    "endDate": "2026-02-06"
  }'
```

**Response (201 Created):**
```json
{
  "id": "423e4567-e89b-12d3-a456-426614174000",
  "userId": "223e4567-e89b-12d3-a456-426614174000",
  "startDate": "2026-02-02",
  "endDate": "2026-02-06",
  "businessDaysCount": 5,
  "status": "SUBMITTED",
  "createdAt": "2026-01-11T10:00:00Z"
}
```

**Business Rules:**
- Start date must be in the future (not in the past)
- Start and end dates cannot fall on weekends (Saturday/Sunday)
- End date must be >= start date
- System automatically calculates business days (weekdays only)
- Request is created with status "SUBMITTED"
- Validates available vacation days in user's allowance
- Checks for overlapping vacation requests

**Use Case:** Employee submits a new vacation request through the application.

---

#### Example 2: Missing Required Field

**Request:**
```bash
curl -X POST "http://localhost:4321/api/vacation-requests" \
  -H "Content-Type: application/json" \
  -d '{
    "endDate": "2026-03-15"
  }'
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid request data",
  "details": {
    "startDate": ["Start date is required"]
  }
}
```

---

#### Example 3: Invalid Date Format

**Request:**
```bash
curl -X POST "http://localhost:4321/api/vacation-requests" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "15-03-2026",
    "endDate": "2026-03-20"
  }'
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid request data",
  "details": {
    "startDate": ["Start date must be in YYYY-MM-DD format"]
  }
}
```

---

#### Example 4: Date in the Past

**Request:**
```bash
curl -X POST "http://localhost:4321/api/vacation-requests" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2023-01-10",
    "endDate": "2023-01-15"
  }'
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid request data",
  "details": {
    "startDate": ["Start date cannot be in the past"]
  }
}
```

---

#### Example 5: Weekend Date

**Request:**
```bash
curl -X POST "http://localhost:4321/api/vacation-requests" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-03-07",
    "endDate": "2026-03-08"
  }'
```

**Response (400 Bad Request):**
```json
{
  "error": "Vacation request must include at least one business day"
}
```

---

### Approve Vacation Request (HR Only)

#### Example 1: Approve Vacation Request Without Threshold Warning

**Request:**
```bash
curl -X POST "http://localhost:4321/api/vacation-requests/123e4567-e89b-12d3-a456-426614174000/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "acknowledgeThresholdWarning": false
  }'
```

**Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "APPROVED",
  "processedByUserId": "00000000-0000-0000-0000-000000000002",
  "processedAt": "2026-01-11T14:30:00Z",
  "thresholdWarning": null
}
```

**Access Control:**
- Only **HR** users can approve vacation requests
- HR cannot approve their own requests
- HR must be a member of at least one team with the request owner

**Use Case:** HR manager reviews and approves a vacation request.

---

#### Example 2: Approve With Threshold Warning (Requires Acknowledgment)

**Request:**
```bash
# First attempt without acknowledgment
curl -X POST "http://localhost:4321/api/vacation-requests/123e4567-e89b-12d3-a456-426614174000/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "acknowledgeThresholdWarning": false
  }'
```

**Response (400 Bad Request):**
```json
{
  "error": "You must acknowledge the threshold warning to approve this request"
}
```

**Request (with acknowledgment):**
```bash
curl -X POST "http://localhost:4321/api/vacation-requests/123e4567-e89b-12d3-a456-426614174000/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "acknowledgeThresholdWarning": true
  }'
```

**Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "APPROVED",
  "processedByUserId": "00000000-0000-0000-0000-000000000002",
  "processedAt": "2026-01-11T14:30:00Z",
  "thresholdWarning": {
    "hasWarning": true,
    "teamOccupancy": 60.5,
    "threshold": 50,
    "message": "Approving this request will exceed the team occupancy threshold (60.5% > 50%)"
  }
}
```

**Use Case:** HR manager acknowledges that approving this request will exceed team capacity threshold.

---

#### Example 3: Approve Already Approved Request

**Request:**
```bash
curl -X POST "http://localhost:4321/api/vacation-requests/123e4567-e89b-12d3-a456-426614174000/approve" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response (400 Bad Request):**
```json
{
  "error": "Request must be in SUBMITTED status"
}
```

---

#### Example 4: Non-HR User Trying to Approve

**Request:**
```bash
# Current user is EMPLOYEE or ADMINISTRATOR
curl -X POST "http://localhost:4321/api/vacation-requests/123e4567-e89b-12d3-a456-426614174000/approve" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response (403 Forbidden):**
```json
{
  "error": "Only HR can approve vacation requests"
}
```

---

#### Example 5: HR Trying to Approve Own Request

**Request:**
```bash
curl -X POST "http://localhost:4321/api/vacation-requests/own-request-id/approve" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response (403 Forbidden):**
```json
{
  "error": "You cannot approve your own vacation request"
}
```

---

#### Example 6: HR Without Common Team

**Request:**
```bash
# HR trying to approve request from user not in their teams
curl -X POST "http://localhost:4321/api/vacation-requests/other-team-request-id/approve" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response (403 Forbidden):**
```json
{
  "error": "You are not authorized to approve this request"
}
```

---

### Reject Vacation Request (HR Only)

#### Example 1: Reject Vacation Request With Reason

**Request:**
```bash
curl -X POST "http://localhost:4321/api/vacation-requests/123e4567-e89b-12d3-a456-426614174000/reject" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Team capacity exceeded during this period"
  }'
```

**Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "REJECTED",
  "processedByUserId": "00000000-0000-0000-0000-000000000002",
  "processedAt": "2026-01-11T14:30:00Z"
}
```

**Access Control:**
- Only **HR** users can reject vacation requests
- HR cannot reject their own requests
- HR must be a member of at least one team with the request owner
- Reason is required (1-500 characters)

**Use Case:** HR manager rejects a vacation request with explanation.

---

#### Example 2: Reject Without Reason

**Request:**
```bash
curl -X POST "http://localhost:4321/api/vacation-requests/123e4567-e89b-12d3-a456-426614174000/reject" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response (400 Bad Request):**
```json
{
  "error": "Reason is required"
}
```

---

#### Example 3: Reject With Reason Too Long

**Request:**
```bash
curl -X POST "http://localhost:4321/api/vacation-requests/123e4567-e89b-12d3-a456-426614174000/reject" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Very long reason... [501+ characters]"
  }'
```

**Response (400 Bad Request):**
```json
{
  "error": "Reason must be at most 500 characters"
}
```

---

#### Example 4: Reject Already Rejected Request

**Request:**
```bash
curl -X POST "http://localhost:4321/api/vacation-requests/123e4567-e89b-12d3-a456-426614174000/reject" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Another reason"
  }'
```

**Response (400 Bad Request):**
```json
{
  "error": "Request must be in SUBMITTED status"
}
```

---

### Cancel Vacation Request (Employee - Owner Only)

#### Example 1: Cancel SUBMITTED Request

**Request:**
```bash
curl -X POST "http://localhost:4321/api/vacation-requests/123e4567-e89b-12d3-a456-426614174000/cancel" \
  -H "Content-Type: application/json"
```

**Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "CANCELLED",
  "daysReturned": 5,
  "updatedAt": "2026-01-11T14:30:00Z"
}
```

**Access Control:**
- Any authenticated user can cancel their **own** vacation requests
- Cannot cancel requests belonging to other users
- Can only cancel requests with status SUBMITTED or APPROVED
- For APPROVED requests: cannot cancel if vacation started more than 1 day ago

**Use Case:** Employee cancels their vacation request before it's processed or shortly after approval.

---

#### Example 2: Cancel APPROVED Request (Future Date)

**Request:**
```bash
curl -X POST "http://localhost:4321/api/vacation-requests/123e4567-e89b-12d3-a456-426614174000/cancel" \
  -H "Content-Type: application/json"
```

**Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "CANCELLED",
  "daysReturned": 5,
  "updatedAt": "2026-01-11T14:30:00Z"
}
```

---

#### Example 3: Cancel APPROVED Request (Started More Than 1 Day Ago)

**Request:**
```bash
# Trying to cancel vacation that started 2 days ago
curl -X POST "http://localhost:4321/api/vacation-requests/old-approved-request-id/cancel" \
  -H "Content-Type: application/json"
```

**Response (400 Bad Request):**
```json
{
  "error": "Cannot cancel vacation that started more than 1 day ago"
}
```

---

#### Example 4: Cancel REJECTED Request

**Request:**
```bash
curl -X POST "http://localhost:4321/api/vacation-requests/rejected-request-id/cancel" \
  -H "Content-Type: application/json"
```

**Response (400 Bad Request):**
```json
{
  "error": "Only SUBMITTED or APPROVED requests can be cancelled"
}
```

---

#### Example 5: Cancel Someone Else's Request

**Request:**
```bash
# Employee trying to cancel another employee's request
curl -X POST "http://localhost:4321/api/vacation-requests/other-user-request-id/cancel" \
  -H "Content-Type: application/json"
```

**Response (403 Forbidden):**
```json
{
  "error": "You can only cancel your own vacation requests"
}
```

---

### Vacation Request Actions Summary

| Action | Endpoint | Method | Roles | Can Process Own Request |
|--------|----------|--------|-------|------------------------|
| Approve | `/api/vacation-requests/:id/approve` | POST | HR | No |
| Reject | `/api/vacation-requests/:id/reject` | POST | HR | No |
| Cancel | `/api/vacation-requests/:id/cancel` | POST | All (owner only) | Yes |

**Business Rules:**
- **Approve/Reject**: Only for requests with status SUBMITTED
- **Cancel**: For requests with status SUBMITTED or APPROVED
- **Threshold Warning**: System calculates team occupancy and warns if threshold exceeded
- **Common Team**: HR must share at least one team with request owner
- **Time Constraint**: Cannot cancel APPROVED vacation that started more than 1 day ago
**Request:**
```bash
### JavaScript Examples

#### Fetch All Vacation Requests

```javascript
async function getVacationRequests(filters = {}) {
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

