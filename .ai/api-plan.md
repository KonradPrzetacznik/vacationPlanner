# REST API Plan - VacationPlanner

## 1. Resources

### Core Resources

| Resource            | Database Table        | Description                                            |
| ------------------- | --------------------- | ------------------------------------------------------ |
| Users               | `profiles`            | User profiles with roles (ADMINISTRATOR, HR, EMPLOYEE) |
| Teams               | `teams`               | Organizational teams                                   |
| Team Members        | `team_members`        | Many-to-many relationship between users and teams      |
| Vacation Requests   | `vacation_requests`   | Vacation/leave requests submitted by employees         |
| Vacation Allowances | `vacation_allowances` | Yearly vacation day pools per user                     |
| Settings            | `settings`            | Global application settings (key-value store)          |

## 2. Endpoints

### 2.2. Users

#### List Users

- **Method**: `GET`
- **Path**: `/api/users`
- **Description**: Retrieve list of users (ADMIN sees all including deleted, HR/EMPLOYEE see active only)
- **Query Parameters**:
  - `limit` (number, default: 50): Number of results per page
  - `offset` (number, default: 0): Pagination offset
  - `role` (string, optional): Filter by role (ADMINISTRATOR, HR, EMPLOYEE)
  - `includeDeleted` (boolean, default: false): Include soft-deleted users (ADMIN only)
  - `teamId` (UUID, optional): Filter users by team membership
- **Response** (200 OK):

```json
{
  "data": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "EMPLOYEE",
      "deletedAt": null,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

- **Error Responses**:
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Insufficient permissions

#### Get User

- **Method**: `GET`
- **Path**: `/api/users/:id`
- **Description**: Retrieve single user by ID
- **Response** (200 OK):

```json
{
  "id": "uuid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "role": "EMPLOYEE",
  "deletedAt": null,
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z",
  "teams": [
    {
      "id": "team-uuid",
      "name": "Engineering"
    }
  ]
}
```

- **Error Responses**:
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Insufficient permissions
  - `404 Not Found`: User not found

#### Create User

- **Method**: `POST`
- **Path**: `/api/users`
- **Description**: Create new user (ADMINISTRATOR only)
- **Request Body**:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "role": "EMPLOYEE",
  "temporaryPassword": "temp-password-123"
}
```

- **Response** (201 Created):

```json
{
  "id": "uuid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "role": "EMPLOYEE",
  "requiresPasswordReset": true,
  "createdAt": "2026-01-01T00:00:00Z"
}
```

- **Error Responses**:
  - `400 Bad Request`: Invalid input, email already exists
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not an administrator

#### Update User

- **Method**: `PATCH`
- **Path**: `/api/users/:id`
- **Description**: Update user profile (ADMIN: all fields except email; EMPLOYEE: own name only)
- **Request Body**:

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "HR"
}
```

- **Response** (200 OK):

```json
{
  "id": "uuid",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "role": "HR",
  "updatedAt": "2026-01-01T12:00:00Z"
}
```

- **Error Responses**:
  - `400 Bad Request`: Invalid input, cannot change own role
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Insufficient permissions
  - `404 Not Found`: User not found

#### Soft-Delete User

- **Method**: `DELETE`
- **Path**: `/api/users/:id`
- **Description**: Soft-delete user (ADMINISTRATOR only). Automatically cancels future vacations.
- **Response** (200 OK):

```json
{
  "message": "User deleted successfully",
  "id": "uuid",
  "deletedAt": "2026-01-01T12:00:00Z",
  "cancelledVacations": 2
}
```

- **Error Responses**:
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not an administrator
  - `404 Not Found`: User not found

---

### 2.3. Teams

#### List Teams

- **Method**: `GET`
- **Path**: `/api/teams`
- **Description**: Retrieve list of teams
- **Query Parameters**:
  - `limit` (number, default: 50): Number of results per page
  - `offset` (number, default: 0): Pagination offset
  - `includeMemberCount` (boolean, default: false): Include member count in response
- **Response** (200 OK):

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Engineering",
      "memberCount": 15,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 50,
    "offset": 0
  }
}
```

- **Error Responses**:
  - `401 Unauthorized`: Not authenticated

#### Get Team

- **Method**: `GET`
- **Path**: `/api/teams/:id`
- **Description**: Retrieve single team with members
- **Response** (200 OK):

```json
{
  "id": "uuid",
  "name": "Engineering",
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z",
  "members": [
    {
      "id": "user-uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "EMPLOYEE",
      "joinedAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

- **Error Responses**:
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not a member of this team (for EMPLOYEE role)
  - `404 Not Found`: Team not found

#### Create Team

- **Method**: `POST`
- **Path**: `/api/teams`
- **Description**: Create new team (HR only)
- **Request Body**:

```json
{
  "name": "Engineering"
}
```

- **Response** (201 Created):

```json
{
  "id": "uuid",
  "name": "Engineering",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

- **Error Responses**:
  - `400 Bad Request`: Invalid input, team name already exists
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not HR

#### Update Team

- **Method**: `PATCH`
- **Path**: `/api/teams/:id`
- **Description**: Update team (HR only)
- **Request Body**:

```json
{
  "name": "Engineering Team"
}
```

- **Response** (200 OK):

```json
{
  "id": "uuid",
  "name": "Engineering Team",
  "updatedAt": "2026-01-01T12:00:00Z"
}
```

- **Error Responses**:
  - `400 Bad Request`: Invalid input, team name already exists
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not HR
  - `404 Not Found`: Team not found

#### Delete Team

- **Method**: `DELETE`
- **Path**: `/api/teams/:id`
- **Description**: Delete team (HR only). Members become unassigned.
- **Response** (200 OK):

```json
{
  "message": "Team deleted successfully",
  "id": "uuid"
}
```

- **Error Responses**:
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not HR
  - `404 Not Found`: Team not found

#### Add Team Members

- **Method**: `POST`
- **Path**: `/api/teams/:id/members`
- **Description**: Add one or more users to team (HR only)
- **Request Body**:

```json
{
  "userIds": ["user-uuid-1", "user-uuid-2"]
}
```

- **Response** (200 OK):

```json
{
  "message": "Members added successfully",
  "added": [
    {
      "id": "member-uuid",
      "userId": "user-uuid-1",
      "teamId": "team-uuid",
      "createdAt": "2026-01-01T12:00:00Z"
    }
  ]
}
```

- **Error Responses**:
  - `400 Bad Request`: Invalid user IDs, user already in team
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not HR
  - `404 Not Found`: Team or user not found

#### Remove Team Member

- **Method**: `DELETE`
- **Path**: `/api/teams/:id/members/:userId`
- **Description**: Remove user from team (HR only)
- **Response** (200 OK):

```json
{
  "message": "Member removed successfully"
}
```

- **Error Responses**:
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not HR
  - `404 Not Found`: Team, user, or membership not found

#### Get Team Calendar

- **Method**: `GET`
- **Path**: `/api/teams/:id/calendar`
- **Description**: Get vacation calendar for team
- **Query Parameters**:
  - `startDate` (date, optional): Start date for calendar view (default: 1 week ago)
  - `endDate` (date, optional): End date for calendar view (default: 2 weeks ahead)
  - `month` (string, optional): Filter by month (format: YYYY-MM)
  - `includeStatus` (string[], optional): Filter by status (SUBMITTED, APPROVED, REJECTED, CANCELLED)
- **Response** (200 OK):

```json
{
  "teamId": "uuid",
  "teamName": "Engineering",
  "startDate": "2026-01-01",
  "endDate": "2026-01-31",
  "members": [
    {
      "id": "user-uuid",
      "firstName": "John",
      "lastName": "Doe",
      "vacations": [
        {
          "id": "vacation-uuid",
          "startDate": "2026-01-10",
          "endDate": "2026-01-15",
          "businessDaysCount": 4,
          "status": "APPROVED"
        }
      ]
    }
  ]
}
```

- **Error Responses**:
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not a member of this team (for EMPLOYEE role)
  - `404 Not Found`: Team not found

---

### 2.4. Vacation Requests

#### List Vacation Requests

- **Method**: `GET`
- **Path**: `/api/vacation-requests`
- **Description**: List vacation requests (filtered by permissions)
- **Query Parameters**:
  - `limit` (number, default: 50): Number of results per page
  - `offset` (number, default: 0): Pagination offset
  - `status` (string[], optional): Filter by status (SUBMITTED, APPROVED, REJECTED, CANCELLED)
  - `userId` (UUID, optional): Filter by user (EMPLOYEE can only see own)
  - `teamId` (UUID, optional): Filter by team
  - `startDate` (date, optional): Filter requests starting after this date
  - `endDate` (date, optional): Filter requests ending before this date
- **Response** (200 OK):

```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "user": {
        "id": "user-uuid",
        "firstName": "John",
        "lastName": "Doe"
      },
      "startDate": "2026-01-10",
      "endDate": "2026-01-15",
      "businessDaysCount": 4,
      "status": "SUBMITTED",
      "processedByUserId": null,
      "processedAt": null,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 50,
    "offset": 0
  }
}
```

- **Error Responses**:
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Attempting to view other users' requests without permission

#### Get Vacation Request

- **Method**: `GET`
- **Path**: `/api/vacation-requests/:id`
- **Description**: Retrieve single vacation request
- **Response** (200 OK):

```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "user": {
    "id": "user-uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  },
  "startDate": "2026-01-10",
  "endDate": "2026-01-15",
  "businessDaysCount": 4,
  "status": "APPROVED",
  "processedByUserId": "hr-uuid",
  "processedBy": {
    "id": "hr-uuid",
    "firstName": "Jane",
    "lastName": "Smith"
  },
  "processedAt": "2026-01-02T10:00:00Z",
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-02T10:00:00Z"
}
```

- **Error Responses**:
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Cannot view other users' requests
  - `404 Not Found`: Request not found

#### Create Vacation Request

- **Method**: `POST`
- **Path**: `/api/vacation-requests`
- **Description**: Submit new vacation request (EMPLOYEE)
- **Request Body**:

```json
{
  "startDate": "2026-01-10",
  "endDate": "2026-01-15"
}
```

- **Response** (201 Created):

```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "startDate": "2026-01-10",
  "endDate": "2026-01-15",
  "businessDaysCount": 4,
  "status": "SUBMITTED",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

- **Error Responses**:
  - `400 Bad Request`: Invalid dates (past, weekends, end before start), insufficient vacation days
  - `401 Unauthorized`: Not authenticated
  - `409 Conflict`: Overlapping vacation request exists

#### Approve Vacation Request

- **Method**: `POST`
- **Path**: `/api/vacation-requests/:id/approve`
- **Description**: Approve vacation request (HR only). Returns threshold warning if applicable.
- **Request Body**:

```json
{
  "acknowledgeThresholdWarning": false
}
```

- **Response** (200 OK):

```json
{
  "id": "uuid",
  "status": "APPROVED",
  "processedByUserId": "hr-uuid",
  "processedAt": "2026-01-02T10:00:00Z",
  "thresholdWarning": {
    "hasWarning": true,
    "teamOccupancy": 60.5,
    "threshold": 50,
    "message": "Approving this request will exceed the team occupancy threshold (60.5% > 50%)"
  }
}
```

- **Response** (200 OK - No warning):

```json
{
  "id": "uuid",
  "status": "APPROVED",
  "processedByUserId": "hr-uuid",
  "processedAt": "2026-01-02T10:00:00Z",
  "thresholdWarning": null
}
```

- **Error Responses**:
  - `400 Bad Request`: Request not in SUBMITTED status, threshold warning not acknowledged
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not HR
  - `404 Not Found`: Request not found

#### Reject Vacation Request

- **Method**: `POST`
- **Path**: `/api/vacation-requests/:id/reject`
- **Description**: Reject vacation request (HR only)
- **Request Body**:

```json
{
  "reason": "Team capacity exceeded"
}
```

- **Response** (200 OK):

```json
{
  "id": "uuid",
  "status": "REJECTED",
  "processedByUserId": "hr-uuid",
  "processedAt": "2026-01-02T10:00:00Z"
}
```

- **Error Responses**:
  - `400 Bad Request`: Request not in SUBMITTED status
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not HR
  - `404 Not Found`: Request not found

#### Cancel Vacation Request

- **Method**: `POST`
- **Path**: `/api/vacation-requests/:id/cancel`
- **Description**: Cancel vacation request (EMPLOYEE: own requests only)
- **Response** (200 OK):

```json
{
  "id": "uuid",
  "status": "CANCELLED",
  "daysReturned": 4,
  "updatedAt": "2026-01-05T10:00:00Z"
}
```

- **Error Responses**:
  - `400 Bad Request`: Cannot cancel (not SUBMITTED/APPROVED, or vacation started more than 1 day ago)
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Cannot cancel other users' requests
  - `404 Not Found`: Request not found

---

### 2.5. Vacation Allowances

#### Get User Vacation Allowances

- **Method**: `GET`
- **Path**: `/api/users/:userId/vacation-allowances`
- **Description**: Get vacation allowances for user (all years or specific year)
- **Query Parameters**:
  - `year` (number, optional): Filter by specific year
- **Response** (200 OK):

```json
{
  "userId": "uuid",
  "allowances": [
    {
      "id": "uuid",
      "year": 2026,
      "totalDays": 26,
      "carryoverDays": 5,
      "usedDays": 10,
      "usedCarryoverDays": 3,
      "usedCurrentYearDays": 7,
      "remainingDays": 21,
      "remainingCarryoverDays": 2,
      "remainingCurrentYearDays": 19,
      "carryoverExpiresAt": "2026-03-31",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-15T00:00:00Z"
    }
  ]
}
```

- **Error Responses**:
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Cannot view other users' allowances (unless HR)
  - `404 Not Found`: User not found

#### Get Specific Year Allowance

- **Method**: `GET`
- **Path**: `/api/users/:userId/vacation-allowances/:year`
- **Description**: Get vacation allowance for specific year
- **Response** (200 OK):

```json
{
  "id": "uuid",
  "userId": "uuid",
  "year": 2026,
  "totalDays": 26,
  "carryoverDays": 5,
  "usedDays": 10,
  "usedCarryoverDays": 3,
  "usedCurrentYearDays": 7,
  "remainingDays": 21,
  "remainingCarryoverDays": 2,
  "remainingCurrentYearDays": 19,
  "carryoverExpiresAt": "2026-03-31",
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-15T00:00:00Z"
}
```

- **Error Responses**:
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Cannot view other users' allowances (unless HR)
  - `404 Not Found`: User or allowance not found

#### Create Vacation Allowance

- **Method**: `POST`
- **Path**: `/api/vacation-allowances`
- **Description**: Create vacation allowance for user (HR only)
- **Request Body**:

```json
{
  "userId": "user-uuid",
  "year": 2026,
  "totalDays": 26,
  "carryoverDays": 0
}
```

- **Response** (201 Created):

```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "year": 2026,
  "totalDays": 26,
  "carryoverDays": 0,
  "createdAt": "2026-01-01T00:00:00Z"
}
```

- **Error Responses**:
  - `400 Bad Request`: Invalid input, allowance already exists for this user/year
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not HR
  - `404 Not Found`: User not found

#### Update Vacation Allowance

- **Method**: `PATCH`
- **Path**: `/api/vacation-allowances/:id`
- **Description**: Update vacation allowance (HR only)
- **Request Body**:

```json
{
  "totalDays": 28,
  "carryoverDays": 3
}
```

- **Response** (200 OK):

```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "year": 2026,
  "totalDays": 28,
  "carryoverDays": 3,
  "updatedAt": "2026-01-15T10:00:00Z"
}
```

- **Error Responses**:
  - `400 Bad Request`: Invalid input (negative values)
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not HR
  - `404 Not Found`: Allowance not found

---

### 2.6. Settings

#### Get All Settings

- **Method**: `GET`
- **Path**: `/api/settings`
- **Description**: Retrieve all global settings
- **Response** (200 OK):

```json
{
  "data": [
    {
      "key": "default_vacation_days",
      "value": 26,
      "description": "Default number of vacation days per year",
      "updatedAt": "2026-01-01T00:00:00Z"
    },
    {
      "key": "team_occupancy_threshold",
      "value": 50,
      "description": "Percentage threshold for team occupancy (0-100)",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

- **Error Responses**:
  - `401 Unauthorized`: Not authenticated

#### Get Setting

- **Method**: `GET`
- **Path**: `/api/settings/:key`
- **Description**: Retrieve specific setting by key
- **Response** (200 OK):

```json
{
  "key": "default_vacation_days",
  "value": 26,
  "description": "Default number of vacation days per year",
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

- **Error Responses**:
  - `401 Unauthorized`: Not authenticated
  - `404 Not Found`: Setting not found

#### Update Setting

- **Method**: `PUT`
- **Path**: `/api/settings/:key`
- **Description**: Update specific setting (HR only)
- **Request Body**:

```json
{
  "value": 28
}
```

- **Response** (200 OK):

```json
{
  "key": "default_vacation_days",
  "value": 28,
  "description": "Default number of vacation days per year",
  "updatedAt": "2026-01-15T10:00:00Z"
}
```

- **Error Responses**:
  - `400 Bad Request`: Invalid value for setting (e.g., threshold not 0-100)
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not HR
  - `404 Not Found`: Setting not found

---

## 3. Authentication and Authorization

### Authentication Mechanism

- **Primary Method**: Supabase Authentication with JWT tokens
- **Token Type**: Bearer token in Authorization header
- **Token Format**: `Authorization: Bearer <jwt_token>`
- **Session Management**: Handled by Supabase client SDK
- **Password Reset**: Two-step flow using tokens (request + complete)

### Implementation Details

1. **Client-Side**: Use Supabase Auth SDK for login, logout, session management
2. **Server-Side**: Verify JWT tokens using Supabase client from `context.locals`
3. **RLS**: Leverage Supabase Row Level Security for data isolation
4. **First Login**: Flag `requiresPasswordReset` enforces password change

### Authorization Rules by Role

#### ADMINISTRATOR

- **Can**:
  - Create, read, update, soft-delete all users (including deleted ones)
  - Change any user's role (except own)
  - View all user profiles
- **Cannot**:
  - Access vacation requests, teams, or settings
  - Change user email addresses
  - Change own role

#### HR

- **Can**:
  - View all active users (not deleted)
  - Create, read, update, delete teams
  - Manage team membership (add/remove users)
  - View, approve, reject all vacation requests
  - View all vacation allowances
  - Create and update vacation allowances
  - Update global settings
  - Submit own vacation requests (self-approve if only HR)
- **Cannot**:
  - Manage user accounts (create/delete users, change roles)
  - View deleted users

#### EMPLOYEE

- **Can**:
  - View own profile and team members' profiles
  - View teams they belong to
  - Submit vacation requests
  - Cancel own vacation requests (with date restrictions)
  - View own vacation requests and allowances
  - View team calendar for own teams
  - View global settings (read-only)
- **Cannot**:
  - Manage other users, teams, or settings
  - View/modify other users' vacation requests
  - Approve/reject vacation requests

### Authorization Enforcement

1. **Row Level Security**: Primary enforcement via Supabase RLS policies (defined in db-plan.md)
2. **Application Logic**: Additional checks in API endpoints for complex rules
3. **Error Handling**: Return `403 Forbidden` for insufficient permissions

---

## 4. Validation and Business Logic

### Validation Rules

#### User Management

- **Create User**:
  - Email must be valid and unique
  - First name and last name required (non-empty)
  - Role must be valid enum value (ADMINISTRATOR, HR, EMPLOYEE)
  - Temporary password must meet security requirements (min 8 chars)
- **Update User**:
  - Cannot change own role
  - Cannot change email
  - First name and last name must be non-empty if provided
  - Admin-only field changes rejected for non-admins

#### Team Management

- **Create/Update Team**:
  - Name required and unique
  - Name length: 1-100 characters
- **Add Members**:
  - User IDs must exist and not be deleted
  - Cannot add duplicate memberships
  - Cannot add deleted users

#### Vacation Requests

- **Create Request**:
  - Start date must not be in the past
  - End date must be >= start date
  - Start and end dates cannot be weekends (Saturday=6, Sunday=0)
  - User must have sufficient vacation days available
  - Cannot have overlapping approved/submitted requests
  - Business days calculation excludes weekends
- **Approve Request**:
  - Request must be in SUBMITTED status
  - If team occupancy exceeds threshold, require acknowledgment
  - Deduct days from carryover pool first, then current year
  - Update vacation allowance accordingly
- **Reject Request**:
  - Request must be in SUBMITTED status
  - Reason is optional but recommended
- **Cancel Request**:
  - Must be SUBMITTED or APPROVED status
  - If APPROVED: Can cancel until end of first day of vacation
  - If SUBMITTED: Can cancel anytime
  - Return days to vacation allowance (carryover first)

#### Vacation Allowances

- **Create/Update**:
  - Total days must be >= 0
  - Carryover days must be >= 0
  - Year must be between 2000 and 2100
  - Unique constraint per (user_id, year)
  - Cannot reduce allowance below already used days

#### Settings

- **Update**:
  - `default_vacation_days`: Must be positive integer (1-365)
  - `team_occupancy_threshold`: Must be 0-100 (percentage)
  - Value must be valid JSON

### Business Logic Implementation

#### 1. Business Days Calculation

- **Function**: `calculate_business_days(start_date, end_date)`
- **Logic**: Count weekdays between dates, exclude weekends
- **Location**: PostgreSQL function, called during vacation request creation
- **Stored In**: `vacation_requests.business_days_count`

#### 2. Team Occupancy Check

- **Function**: `get_team_occupancy(team_id, start_date, end_date)`
- **Logic**:
  - Count active team members (not deleted)
  - Count unique members with approved vacations overlapping the period
  - Calculate percentage: (members_on_vacation / total_members) \* 100
- **Location**: PostgreSQL function, called during vacation approval
- **Threshold**: Compared against `team_occupancy_threshold` setting
- **Warning**: Returned in approval response if exceeded, requires acknowledgment

#### 3. Carryover Days Priority

- **Logic**: When deducting vacation days:
  1. First deduct from `carryover_days` (previous year)
  2. Then deduct from `total_days` (current year)
- **Expiration**: Carryover days expire on March 31st
- **Automation**: `pg_cron` job resets carryover to 0 on April 1st

#### 4. Soft-Delete User Cascade

- **Trigger**: `cancel_future_vacations_on_user_delete`
- **Logic**: When `deleted_at` is set:
  - Find all SUBMITTED or APPROVED requests with `start_date > CURRENT_DATE`
  - Set status to CANCELLED
  - Update `updated_at` timestamp
- **Location**: Database trigger, executes automatically

#### 5. Vacation Day Calculation

- **Used Days**: Sum of `business_days_count` for APPROVED requests in the year
- **Remaining Days**: `(total_days + carryover_days) - used_days`
- **Breakdown**:
  - `used_carryover_days`: min(used_days, carryover_days)
  - `used_current_year_days`: used_days - used_carryover_days
  - `remaining_carryover_days`: carryover_days - used_carryover_days
  - `remaining_current_year_days`: total_days - used_current_year_days

#### 6. Yearly Allowance Creation

- **Automation**: `pg_cron` job runs on January 1st at 00:00
- **Logic**:
  - For each active user (deleted_at IS NULL)
  - Create allowance for current year if not exists
  - Set `total_days` from `default_vacation_days` setting
  - Set `carryover_days` to 0 (manual adjustment by HR if needed)

#### 7. Password Reset Flow

- **Initial Login**: User created with `requiresPasswordReset` flag
- **First Access**: Redirect to password reset page
- **Enforcement**: Middleware blocks access until password changed
- **Token**: Time-limited, single-use token for reset

#### 8. Overlapping Vacation Check

- **Logic**: When creating request, check for existing requests where:
  - `user_id` matches
  - `status` IN ('SUBMITTED', 'APPROVED')
  - Date ranges overlap: `new_start <= existing_end AND new_end >= existing_start`
- **Result**: Reject with 409 Conflict if overlap found

---

## 5. Error Handling

### Standard Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  }
}
```

### HTTP Status Codes

- **200 OK**: Successful GET, PATCH, POST (non-creation), DELETE
- **201 Created**: Successful POST (resource creation)
- **400 Bad Request**: Invalid input, validation errors
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Authenticated but insufficient permissions
- **404 Not Found**: Resource does not exist
- **409 Conflict**: Resource conflict (duplicate, overlapping dates)
- **422 Unprocessable Entity**: Valid format but business logic violation
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server-side error

### Common Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_REQUIRED`: No valid session
- `INSUFFICIENT_PERMISSIONS`: Role-based access denied
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `DUPLICATE_RESOURCE`: Unique constraint violation
- `BUSINESS_LOGIC_VIOLATION`: Valid input but violates business rules
- `INSUFFICIENT_VACATION_DAYS`: Not enough days available
- `OVERLAPPING_VACATION`: Date conflict with existing request
- `INVALID_STATUS_TRANSITION`: Cannot change from current status
- `WEEKEND_DATE_INVALID`: Weekend selected as start/end date
- `PAST_DATE_INVALID`: Cannot select past date
- `THRESHOLD_EXCEEDED`: Team occupancy threshold exceeded (warning)

---

## 6. Performance Considerations

### Pagination

- **Default Limit**: 50 items
- **Max Limit**: 200 items
- **Method**: Offset-based pagination (limit/offset)
- **Future**: Consider cursor-based for large datasets

### Filtering and Sorting

- **Indexed Fields**: Queries use database indexes for performance
  - Users: `role`, `deleted_at`
  - Vacation Requests: `user_id`, `status`, `start_date`, `end_date`
  - Team Members: `team_id`, `user_id`
  - Vacation Allowances: `user_id`, `year`

### Caching Strategy

- **Settings**: Cache for 5 minutes (infrequently changed)
- **User Sessions**: Managed by Supabase (short-lived JWTs)
- **ETags**: Use for conditional requests on user profiles

### Query Optimization

- **N+1 Prevention**: Use JOIN queries to fetch related data
- **Eager Loading**: Include related entities in single query where possible
- **Database Functions**: Use pre-calculated values (business_days_count)
- **RLS**: Leverage database-level filtering for security and performance

### Rate Limiting

- **Authentication**: 5 requests per minute per IP
- **API Endpoints**: 100 requests per minute per user
- **Burst Allowance**: 20 requests
- **Implementation**: Use Supabase rate limiting or API middleware

---

## 7. Additional Notes

### Tech Stack Alignment

- **Astro 5**: API endpoints in `/src/pages/api` using Astro endpoints
- **TypeScript 5**: Full type safety with Zod validation schemas
- **Supabase**: Backend-as-a-Service with PostgreSQL database
- **RLS Policies**: Primary security enforcement at database level

### API Conventions

- **URL Format**: kebab-case for paths
- **JSON Keys**: camelCase for request/response payloads
- **Date Format**: ISO 8601 (YYYY-MM-DD for dates, full timestamp for datetimes)
- **UUID Format**: Standard RFC 4122 UUID strings
- **Boolean Values**: true/false (lowercase)

### Supabase Integration

- **Client Access**: Use `supabase` from `context.locals` in API routes
- **Type Safety**: Import `SupabaseClient` type from `src/db/supabase.client.ts`
- **RLS**: All queries automatically filtered by RLS policies
- **Auth**: Verify `context.locals.supabase.auth.getUser()` for authentication

### Future Enhancements (Out of Scope for MVP)

- Public holidays integration
- Email notifications (webhooks)
- Advanced reporting endpoints
- Bulk operations (batch create/update)
- File attachments for vacation requests
- Multi-language support
- Audit log endpoints
- WebSocket support for real-time updates
- GraphQL API alternative
- Mobile-specific endpoints

---

## 8. Implementation Checklist

### Phase 1: Foundation

- [ ] Set up API route structure in `/src/pages/api`
- [ ] Create Zod validation schemas in `/src/types.ts`
- [ ] Implement authentication middleware
- [ ] Set up error handling utilities
- [ ] Create database client utilities

### Phase 2: Core Resources

- [ ] Implement Users endpoints (CRUD)
- [ ] Implement Teams endpoints (CRUD + members)
- [ ] Implement Vacation Requests endpoints (CRUD + actions)
- [ ] Implement Vacation Allowances endpoints
- [ ] Implement Settings endpoints

### Phase 3: Business Logic

- [ ] Integrate business days calculation
- [ ] Implement team occupancy checking
- [ ] Add vacation days deduction logic
- [ ] Implement carryover days priority
- [ ] Add overlapping vacation validation

### Phase 4: Polish

- [ ] Add pagination to all list endpoints
- [ ] Implement filtering and sorting
- [ ] Add comprehensive error messages
- [ ] Implement rate limiting
- [ ] Add API documentation (OpenAPI/Swagger)
- [ ] Write integration tests
- [ ] Performance testing and optimization
