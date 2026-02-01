# Vacation Plannerasdf

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Authentication](#authentication)
- [Available Scripts](#available-scripts)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Project Scope](#project-scope)
  - [MVP Features](#mvp-features)
  - [Out of Scope for MVP](#out-of-scope-for-mvp)
- [Project Status](#project-status)
- [License](#license)

## Project Description

Vacation Planner is an application designed to simplify the process of managing employee vacations. It allows employees to request time off, and provides HR personnel with the tools to approve, manage, and oversee all leave requests and schedules. The system aims to solve the complexities of vacation management by offering a clear and intuitive interface for all users.

## Tech Stack

- **Framework**: [Astro](https://astro.build/)
- **UI Library**: [React](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com/)
- **Backend**: [Supabase](https://supabase.com/) (for authentication and database)
- **Authentication**: Supabase Auth with SSR support

## Getting Started Locally

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js `~22.14.0` (as specified in `.nvmrc`)
- npm (included with Node.js)

### Installation

1.  Clone the repository:
    ```sh
    git clone https://github.com/KonradPrzetacznik/vacation-planner.git
    cd vacation-planner
    ```
2.  Install NPM packages:
    ```sh
    npm install
    ```

## Authentication

The application uses Supabase Auth for user authentication with full SSR support.

### Quick Start

See [QUICK_START_AUTH.md](./QUICK_START_AUTH.md) for detailed authentication setup and testing.

### Test Accounts

After running database seed (`npx supabase db reset`), you can use:

- **Administrator**: `admin.user@vacationplanner.pl` / `test123`
- **HR**: `ferdynand.kiepski@vacationplanner.pl` / `test123`
- **Employee**: `kazimierz.pawlak@vacationplanner.pl` / `test123`

### Authentication Flow

1. **Login**: Users log in with email/password at `/login`
2. **Registration**: Admins invite users via email (users set their own password)
3. **Password Reset**: Users can request password reset at `/forgot-password`
4. **Session Management**: Automatic session handling with Supabase cookies

### Documentation

- [Full Authentication Integration Report](./AUTH_INTEGRATION_COMPLETE.md)
- [Supabase Configuration Guide](./SUPABASE_AUTH_CONFIGURATION.md)
- [Architecture Specification](./.ai/auth-spec.md)

### Running the Application

To run the application in development mode:

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Database Management

The project uses Supabase for database management. To work with the database locally:

1. **Start Supabase**:
   ```sh
   supabase start
   ```

2. **Access Supabase Studio**:
   Open [http://localhost:54323](http://localhost:54323) to manage the database via web interface.

3. **Reset Database** (delete all data and reapply migrations):
   
   **Linux/macOS**:
   ```sh
   ./reset-db.sh
   ```
   
   This script will:
   - Clear all existing data
   - Apply all migrations from `supabase/migrations/`
   - Seed the database with sample data
   
   **Test accounts** (password: `test123`):
   - Admin: `admin@vacationplanner.com`
   - HR: `hr1@vacationplanner.com`, `hr2@vacationplanner.com`
   - Employees: `employee1@vacationplanner.com` through `employee10@vacationplanner.com`

4. **Stop Supabase**:
   ```sh
   supabase stop
   ```

## Available Scripts

In the project directory, you can run:

- `npm run dev`: Runs the app in the development mode.
- `npm run build`: Builds the app for production to the `dist/` folder.
- `npm run preview`: Serves the production build locally for preview.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run lint:fix`: Lints and automatically fixes problems.
- `npm run format`: Formats code using Prettier.

## API Endpoints

### Users API

#### GET /api/users

Retrieves a paginated and filtered list of users.

**Authorization:** 
- ADMINISTRATOR: Full access to all users (including soft-deleted)
- HR: Access to active users only
- EMPLOYEE: Access to own profile and team members

**Query Parameters:**
- `limit` (optional): Number of results (1-100, default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `role` (optional): Filter by role (ADMINISTRATOR | HR | EMPLOYEE)
- `includeDeleted` (optional): Include soft-deleted users (default: false)
- `teamId` (optional): Filter by team UUID

**Response (200 OK):**
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

**Examples:**
```bash
# Get all users (first 50)
curl "http://localhost:3000/api/users"

# Get employees with pagination
curl "http://localhost:3000/api/users?role=EMPLOYEE&limit=10&offset=0"

# Get users from specific team
curl "http://localhost:3000/api/users?teamId=uuid-of-team"

# Include deleted users (admin only)
curl "http://localhost:3000/api/users?includeDeleted=true"
```

---

#### GET /api/users/:id

Retrieves detailed information about a single user, including their team memberships.

**Authorization:**
- ADMINISTRATOR: Can view all users (including soft-deleted)
- HR: Can view active users only
- EMPLOYEE: Can view only themselves (active only)

**Parameters:**
- `id` (path, required): User UUID

**Response (200 OK):**
```json
{
  "data": {
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
      },
      {
        "id": "team-uuid-2",
        "name": "Product"
      }
    ]
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid UUID format
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found or no access
- `500 Internal Server Error`: Server error

**Examples:**
```bash
# Get user by ID
curl "http://localhost:3000/api/users/00000000-0000-0000-0000-000000000001"

# Get current user (replace with actual ID)
curl "http://localhost:3000/api/users/your-user-id"

# Pretty print with jq
curl "http://localhost:3000/api/users/uuid" | jq .
```

**Use Cases:**
- Display user profile page with team information
- Show user details in admin panel
- Fetch current user data for dashboard
- Validate user permissions based on team membership

---

### API Guidelines

**Base URL (Development):** `http://localhost:3000`

**Content Type:** All endpoints return `application/json`

**Error Format:**
```json
{
  "error": "Error message",
  "details": {
    "field": ["Validation error"]
  }
}
```

**Rate Limiting:** Not implemented in development (planned for production)

**Full API Documentation:** See [API Documentation](.ai/api-users-documentation.md) for complete details.

**Usage Examples:** See [API Examples](docs/API_EXAMPLES.md) for practical code examples in multiple languages.

---

### Settings API

#### GET /api/settings

Retrieves all global application settings.

**Authorization:** 
- ADMINISTRATOR: Can view all settings
- HR: Can view all settings
- EMPLOYEE: Can view all settings

**Response (200 OK):**
```json
{
  "data": [
    {
      "key": "default_vacation_days",
      "value": 26,
      "description": "Default number of vacation days per year",
      "updatedAt": "2026-01-30T21:00:00Z"
    },
    {
      "key": "team_occupancy_threshold",
      "value": 75,
      "description": "Percentage threshold (0-100) for maximum team members on vacation simultaneously",
      "updatedAt": "2026-01-30T21:00:00Z"
    }
  ]
}
```

**Example:**
```bash
curl "http://localhost:3000/api/settings"
```

---

#### POST /api/settings

Updates multiple settings at once (bulk update).

**Authorization:** 
- ADMINISTRATOR: Can update settings
- HR: Can update settings
- EMPLOYEE: Cannot update settings (403)

**Request Body:**
```json
[
  {"key": "default_vacation_days", "value": 28},
  {"key": "team_occupancy_threshold", "value": 80}
]
```

**Validation Rules:**
- `default_vacation_days`: Must be integer between 1-365
- `team_occupancy_threshold`: Must be integer between 0-100

**Response (200 OK):**
```json
{
  "data": [
    {
      "key": "default_vacation_days",
      "value": 28,
      "description": "Default number of vacation days per year",
      "updatedAt": "2026-01-30T22:00:00Z"
    },
    {
      "key": "team_occupancy_threshold",
      "value": 80,
      "description": "Percentage threshold (0-100) for maximum team members on vacation simultaneously",
      "updatedAt": "2026-01-30T22:00:00Z"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request`: Validation error (value out of range)
- `403 Forbidden`: Unauthorized (not HR or ADMINISTRATOR)
- `404 Not Found`: Setting key doesn't exist
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X POST "http://localhost:3000/api/settings" \
  -H "Content-Type: application/json" \
  -d '[{"key": "default_vacation_days", "value": 28}]'
```

**Full Settings Documentation:** See [Settings View Documentation](docs/SETTINGS_VIEW.md) for UI and complete feature details.

---

## Testing

### Automated API Tests

The project includes automated test scripts for all API endpoints.

**Test Structure:**
```
tests/
└── api/
    ├── users-list.test.sh                    # Tests for GET /api/users
    ├── user-by-id.test.sh                    # Tests for GET /api/users/:id
    ├── settings-list.test.sh                 # Tests for GET /api/settings
    ├── settings-bulk-update.test.sh          # Tests for POST /api/settings
    ├── vacation-request-approve.test.sh      # Tests for POST /api/vacation-requests/:id/approve
    ├── vacation-request-reject.test.sh       # Tests for POST /api/vacation-requests/:id/reject
    ├── vacation-request-cancel.test.sh       # Tests for POST /api/vacation-requests/:id/cancel
    └── run-all.sh                            # Runs all API tests
```

**Quick Start:**
```bash
# Interactive test guide
./QUICK-TEST-GUIDE.sh
```

**Run All Tests:**
```bash
# Run complete test suite
./tests/api/run-all.sh
```

**Run Individual Tests:**
```bash
# Test users list endpoint
./tests/api/users-list.test.sh

# Test user by ID endpoint
./tests/api/user-by-id.test.sh

# Test vacation request actions
./tests/api/vacation-request-approve.test.sh
./tests/api/vacation-request-reject.test.sh
./tests/api/vacation-request-cancel.test.sh
```

**Test Coverage:**
- ✅ GET /api/users - List users with various filters
- ✅ GET /api/users/:id - Get user details with teams
- ✅ POST /api/vacation-requests/:id/approve - Approve requests (HR only)
- ✅ POST /api/vacation-requests/:id/reject - Reject requests with reason (HR only)
- ✅ POST /api/vacation-requests/:id/cancel - Cancel requests (Employee - owner only)
- ✅ Validation errors (400)
- ✅ Not found errors (404)
- ✅ Authorization checks (403)
- ✅ Pagination
- ✅ Role-based filtering
- ✅ Team filtering
- ✅ Threshold warning mechanism

### Quick Manual Testing

```bash
# 1. Start the development server
npm run dev

# 2. Test users list
curl "http://localhost:3000/api/users?limit=5" | jq .

# 3. Test user by ID (replace with actual UUID from database)
curl "http://localhost:3000/api/users/00000000-0000-0000-0000-000000000001" | jq .

# 4. Test error handling (invalid UUID)
curl "http://localhost:3000/api/users/invalid-uuid" | jq .
```

### Test Accounts

After running `./reset-db.sh`, the following test accounts are available (password: `test123`):

**Administrator:**
- Email: `admin.user@vacationplanner.pl`
- ID: `00000000-0000-0000-0000-000000000001`

**HR:**
- Email: `ferdynand.kiepski@vacationplanner.pl`
- ID: `00000000-0000-0000-0000-000000000002`

**Employees:**
- Email: `kazimierz.pawlak@vacationplanner.pl` (in 2 teams)
- ID: `00000000-0000-0000-0000-000000000010`

### Advanced Testing

**Full testing guide:** See [TESTING.md](TESTING.md) and [TEST_STATUS.md](TEST_STATUS.md)

## Project Scope

The current scope is focused on delivering a Minimum Viable Product (MVP) with essential features for managing vacation leave.

### MVP Features

-   **User Roles**:
    -   **ADMINISTRATOR**: Manages users and their roles.
    -   **HR**: Manages teams, defines leave policies, approves/rejects requests, and views team schedules.
    -   **EMPLOYEE**: Requests leave, views personal leave balance, and sees their team's vacation schedule.
-   **Leave Management**:
    -   Request leave with a date range.
    -   Weekends are automatically excluded from the leave day calculation.
    -   Annual leave allowance is configurable by HR.
-   **Dedicated Pages**:
    -   User, Team, and Leave Management pages for HR and Admins.
    -   "My Vacation" page for employees to track their requests.
-   **UI/UX**:
    -   A responsive and intuitive user interface.
    -   A horizontal calendar view to easily compare team members' leave schedules.

### Out of Scope for MVP

The following features are planned for future releases and are not part of the current MVP:
-   Defining substitutes for employees on leave.
-   Email notifications for leave request status changes.
-   Integration with external calendars (Google Calendar, Outlook).
-   Advanced reporting and analytics.
-   Support for different types of leave (e.g., sick leave, unpaid leave).

## Project Status

**In Development**: The project is currently in the development phase, focusing on implementing the MVP features.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more information.

