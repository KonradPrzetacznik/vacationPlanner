# Vacation Planner

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
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

### GET /api/users

Retrieves a paginated and filtered list of users.

**Query Parameters:**
- `limit` (optional): Number of results (1-100, default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `role` (optional): Filter by role (ADMINISTRATOR | HR | EMPLOYEE)
- `includeDeleted` (optional): Include soft-deleted users (default: false)
- `teamId` (optional): Filter by team UUID

**Example:**
```bash
curl "http://localhost:3000/api/users?role=EMPLOYEE&limit=10"
```

**Documentation:** See [API Documentation](.ai/api-users-documentation.md) for full details.

## Testing

### Quick Test

```bash
# 1. Start the development server
npm run dev

# 2. Run quick test
./quick-test.sh
```

### Full Test Suite

```bash
# 1. Start the development server
npm run dev

# 2. Run all tests
./test-api.sh
```

### Manual Testing

```bash
# Basic request
curl http://localhost:3000/api/users

# With pagination
curl "http://localhost:3000/api/users?limit=5"

# Filter by role
curl "http://localhost:3000/api/users?role=EMPLOYEE"
```

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

