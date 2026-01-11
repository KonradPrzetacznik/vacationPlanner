# API Tests

This directory contains automated test scripts for all API endpoints.

## Prerequisites

- **Port 3000**: All tests use `http://localhost:3000` as the API base URL
- **Automatic Server Management**: Tests automatically start and stop the dev server
- **Dependencies**: `curl`, `jq`, `lsof` (for process management)

## Structure

```
tests/api/
├── test-helpers.sh           # Shared helper functions (server management, colors, etc.)
├── users-list.test.sh        # Tests for GET /api/users (list endpoint)
├── user-by-id.test.sh        # Tests for GET /api/users/:id (details endpoint)
├── users-create.test.sh      # Tests for POST /api/users (create user)
├── users-update.test.sh      # Tests for PATCH /api/users/:id (update user)
├── users-delete.test.sh      # Tests for DELETE /api/users/:id (delete user)
├── teams-list.test.sh        # Tests for GET /api/teams (list endpoint)
├── teams-by-id.test.sh       # Tests for GET /api/teams/:id (details endpoint)
├── teams-create.test.sh      # Tests for POST /api/teams (create team)
├── teams-update.test.sh      # Tests for PATCH /api/teams/:id (update team)
├── teams-delete.test.sh      # Tests for DELETE /api/teams/:id (delete team)
├── team-calendar.test.sh     # Tests for GET /api/teams/:id/calendar
├── team-members-add.test.sh  # Tests for POST /api/teams/:id/members
├── team-members-remove.test.sh # Tests for DELETE /api/teams/:id/members/:userId
├── vacation-requests-list.test.sh # Tests for GET /api/vacation-requests (list endpoint)
├── vacation-request-by-id.test.sh # Tests for GET /api/vacation-requests/:id (details endpoint)
├── vacation-request-create.test.sh # Tests for POST /api/vacation-requests (create request)
├── run-all.sh                # Master script to run all tests
└── README.md                 # This file
```

## Quick Start

### Run All Tests

```bash
./tests/api/run-all.sh
```

This script will:
1. **Automatically kill any existing processes on port 3000**
2. **Start a fresh dev server on port 3000**
3. Wait for the server to be ready
4. Execute all `*.test.sh` files in order
5. Display summary of passed/failed tests
6. **Automatically clean up the server on exit**

### Run Individual Tests

Individual tests also handle server management automatically:

```bash
# Test users list endpoint
./tests/api/users-list.test.sh

# Test user by ID endpoint
./tests/api/user-by-id.test.sh
```

**Team Tests:**
```bash
# Test teams list endpoint
./tests/api/teams-list.test.sh

# Test team by ID endpoint
./tests/api/teams-by-id.test.sh

# Test team creation
./tests/api/teams-create.test.sh

# Test team update
./tests/api/teams-update.test.sh

# Test team deletion
./tests/api/teams-delete.test.sh
```

**Vacation Requests Tests:**
```bash
# Test vacation requests list endpoint (with filtering and RBAC)
./tests/api/vacation-requests-list.test.sh

# Test get vacation request by ID (with RBAC validation)
./tests/api/vacation-request-by-id.test.sh

# Test create vacation request (with comprehensive validation)
./tests/api/vacation-request-create.test.sh
```

## How Server Management Works

All test scripts use the shared `test-helpers.sh` file which provides:

1. **Automatic Server Detection**: Checks if a server is already running on port 3000
2. **Process Cleanup**: Kills any existing processes on port 3000 before starting
3. **Server Startup**: Starts `npm run dev` in the background
4. **Health Checks**: Waits up to 60 seconds for the server to become responsive
5. **Automatic Cleanup**: Uses bash `trap` to ensure server is stopped on script exit

**Key Features:**
- Individual tests can be run independently (each manages its own server)
- `run-all.sh` prevents repeated server restarts by setting `SERVER_MANAGED=true`
- Logs are saved to `/tmp/astro-dev-server.log` for debugging

## Prerequisites

1. **Node.js and npm** - installed and configured
2. **Supabase** - running locally (`supabase start`)
3. **Database** - seeded with test data (`./reset-db.sh`)
4. **curl** - for making HTTP requests
5. **jq** - for JSON formatting and validation
6. **lsof** - for process management (killing processes on port 3000)

## Test Coverage

### users-list.test.sh
Tests for `GET /api/users`:
- ✅ Basic listing (default parameters)
- ✅ Pagination (limit & offset)
- ✅ Role filtering (ADMINISTRATOR, HR, EMPLOYEE)
- ✅ Team filtering
- ✅ Include deleted users
- ✅ Error handling (invalid parameters)
- ✅ Edge cases (empty results, max limits)

### user-by-id.test.sh
Tests for `GET /api/users/:id`:
- ✅ Get existing user with teams
- ✅ Get user without teams
- ✅ Invalid UUID format (400 error)
- ✅ Non-existent user (404 error)
- ✅ User with multiple teams
- ✅ Authorization checks (RBAC)

### users-create.test.sh
Tests for `POST /api/users`:
- ✅ Create employee with default role
- ✅ Create user with ADMINISTRATOR role
- ✅ Create user with HR role
- ✅ Duplicate email rejection (400 error)
- ✅ Missing required fields validation
- ✅ Invalid email format validation
- ✅ Password too short validation
- ✅ Invalid JSON body handling
- ✅ Invalid role value validation
- ✅ Authorization check (admin only)

### users-update.test.sh
Tests for `PATCH /api/users/:id`:
- ✅ Update firstName only
- ✅ Update lastName only
- ✅ Update both names at once
- ✅ Update role (admin only)
- ✅ Update all fields together
- ✅ Invalid UUID format (400 error)
- ✅ Non-existent user (404 error)
- ✅ Empty body validation
- ✅ Invalid role validation
- ✅ Empty field validation
- ✅ Field too long validation
- ✅ Invalid JSON body handling
- ✅ Cannot change own role (400 error)
- ✅ Authorization checks (RBAC)

### users-delete.test.sh
Tests for `DELETE /api/users/:id`:
- ✅ Soft-delete user successfully
- ✅ Prevent duplicate deletion (404 error)
- ✅ Non-existent user (404 error)
- ✅ Invalid UUID format (400 error)
- ✅ Verify user not in default list
- ✅ Verify user visible with includeDeleted
- ✅ Verify no access to deleted user details
- ✅ Cancelled vacations count in response
- ✅ Authorization check (admin only)

### teams-list.test.sh
Tests for `GET /api/teams`:
- ✅ Basic GET request with default pagination
- ✅ Pagination with limit and offset
- ✅ Include member count parameter
- ✅ Validation: limit exceeds maximum (400 error)
- ✅ Validation: negative offset (400 error)
- ✅ Edge case: limit = 1
- ✅ Edge case: limit = 100 (max allowed)

### teams-by-id.test.sh
Tests for `GET /api/teams/:id`:
- ✅ Get team details with members list
- ✅ Invalid UUID format (400 error)
- ✅ Non-existent team (404 error)
- ✅ Response structure validation
- ✅ Member details in response
- ✅ Authorization check (EMPLOYEE can only see own teams)

### teams-create.test.sh
Tests for `POST /api/teams`:
- ✅ Create team successfully (201)
- ✅ Duplicate team name (400 error)
- ✅ Missing team name (400 error)
- ✅ Empty team name (400 error)
- ✅ Team name too long (>100 chars, 400 error)
- ✅ Invalid JSON body (400 error)
- ✅ Authorization check (HR/ADMIN only)
- ✅ Auto-cleanup created test teams

### teams-update.test.sh
Tests for `PATCH /api/teams/:id`:
- ✅ Update team name successfully
- ✅ Empty name validation (400 error)
- ✅ Name too long validation (400 error)
- ✅ Non-existent team (404 error)
- ✅ Invalid UUID format (400 error)
- ✅ Invalid JSON body (400 error)
- ✅ Duplicate name check (400 error)
- ✅ Authorization check (HR/ADMIN only)
- ✅ Auto-cleanup test teams

### teams-delete.test.sh
Tests for `DELETE /api/teams/:id`:
- ✅ Delete team successfully
- ✅ Verify deletion (404 on GET after DELETE)
- ✅ Non-existent team (404 error)
- ✅ Invalid UUID format (400 error)
- ✅ Idempotency check (double delete)
- ✅ Authorization check (HR/ADMIN only)
- ✅ CASCADE deletion of team members

## Writing New Tests

### Test File Naming Convention

Use the pattern: `<endpoint-name>.test.sh`

Examples:
- `users-list.test.sh` - for GET /api/users
- `user-by-id.test.sh` - for GET /api/users/:id
- `users-create.test.sh` - for POST /api/users
- `users-update.test.sh` - for PATCH /api/users/:id
- `users-delete.test.sh` - for DELETE /api/users/:id
- `teams-list.test.sh` - for GET /api/teams
- `teams-by-id.test.sh` - for GET /api/teams/:id
- `teams-create.test.sh` - for POST /api/teams
- `teams-update.test.sh` - for PATCH /api/teams/:id
- `teams-delete.test.sh` - for DELETE /api/teams/:id
- `vacation-requests.test.sh` - for future vacation endpoints

### Test Template

```bash
#!/bin/bash

# Test script for <ENDPOINT_NAME>
# Description: <Brief description of what is being tested>

echo "🚀 Starting tests for <ENDPOINT_NAME>..."

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

API_BASE="http://localhost:3000"

# Test 1: Description
echo "📝 Test 1: <Test description>"
response=$(curl -s "$API_BASE/your-endpoint")
echo "$response" | jq . || echo "Request failed"
echo ""

# Test 2: Description
echo "📝 Test 2: <Test description>"
response=$(curl -s "$API_BASE/your-endpoint?param=value")
echo "$response" | jq . || echo "Request failed"
echo ""

echo "✅ Tests completed!"
```

### Best Practices

1. **Always check server is running** before making requests
2. **Use meaningful test descriptions** for easy debugging
3. **Test both success and error cases**
4. **Include edge cases** (empty data, max values, etc.)
5. **Clean up after tests** (especially if creating data)
6. **Use test data from seed.sql** for consistent results
7. **Document expected results** in comments

## Test Data

After running `./reset-db.sh`, the following test accounts are available:

**Administrator:**
- ID: `00000000-0000-0000-0000-000000000001`
- Email: `admin.user@vacationplanner.pl`

**HR:**
- ID: `00000000-0000-0000-0000-000000000002`
- Email: `ferdynand.kiepski@vacationplanner.pl`

**Employees:**
- ID: `00000000-0000-0000-0000-000000000010` (Kazimierz - in 2 teams)
- ID: `00000000-0000-0000-0000-000000000011` (Jacek - in 1 team)
- ... more employees in seed.sql

**Teams:**
- ID: `10000000-0000-0000-0000-000000000001` (Green Team)
- ID: `10000000-0000-0000-0000-000000000002` (Red Team)

## Troubleshooting

### Server not starting

```bash
# Check if port 3000 is already in use
lsof -i :3000

# Kill existing process
pkill -f "astro dev"

# Start fresh
npm run dev
```

### Tests failing unexpectedly

```bash
# 1. Check Supabase status
supabase status

# 2. Reset database
./reset-db.sh

# 3. Clear test logs
rm /tmp/astro-test*.log

# 4. Run tests again
./tests/api/run-all.sh
```

### Database issues

```bash
# Stop and restart Supabase
supabase stop
supabase start

# Reset database with fresh seed data
./reset-db.sh
```

### curl not found

```bash
# Install curl
# Ubuntu/Debian:
sudo apt-get install curl

# macOS:
brew install curl
```

### jq not found (optional)

```bash
# Install jq for JSON formatting
# Ubuntu/Debian:
sudo apt-get install jq

# macOS:
brew install jq
```

## Continuous Integration

These tests are designed to be run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run API Tests
  run: |
    npm run dev &
    sleep 10
    ./tests/api/run-all.sh
```

## Contributing

When adding new API endpoints:

1. Create a new test file: `<endpoint>.test.sh`
2. Make it executable: `chmod +x tests/api/<endpoint>.test.sh`
3. Follow the test template above
4. The `run-all.sh` script will automatically discover it
5. Update this README with test coverage

## Related Documentation

- **API Documentation:** [.ai/api-users-documentation.md](../../.ai/api-users-documentation.md)
- **API Examples:** [docs/API_EXAMPLES.md](../../docs/API_EXAMPLES.md)
- **Main README:** [README.md](../../README.md)
- **Testing Guide:** [TESTING.md](../../TESTING.md)

