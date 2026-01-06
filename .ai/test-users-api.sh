#!/bin/bash

# Test script for GET /api/users endpoint
# Requires: curl, jq (optional for pretty JSON output)

API_BASE="http://localhost:3000"
ENDPOINT="/api/users"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test credentials (from seed.sql)
ADMIN_EMAIL="admin.user@vacationplanner.pl"
HR_EMAIL="ferdynand.kiepski@vacationplanner.pl"
EMPLOYEE_EMAIL="kazimierz.pawlak@vacationplanner.pl"
PASSWORD="test123"

echo "=========================================="
echo "Testing GET /api/users endpoint"
echo "=========================================="
echo ""

# Function to print test result
print_result() {
    local test_name="$1"
    local status_code="$2"
    local expected="$3"

    if [ "$status_code" -eq "$expected" ]; then
        echo -e "${GREEN}✓ PASS${NC} - $test_name (HTTP $status_code)"
    else
        echo -e "${RED}✗ FAIL${NC} - $test_name (Expected HTTP $expected, got $status_code)"
    fi
}

# Function to get auth token (simplified - in real app use Supabase auth)
# For now, we'll test without auth to see 401 error
test_without_auth() {
    echo "Test 1: Request without authentication"
    response=$(curl -s -w "\n%{http_code}" "${API_BASE}${ENDPOINT}")
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)

    print_result "Unauthorized request" "$status_code" 401
    echo "Response: $body"
    echo ""
}

# Function to test with invalid parameters
test_invalid_params() {
    echo "Test 2: Request with invalid limit (999 > max 100)"
    response=$(curl -s -w "\n%{http_code}" "${API_BASE}${ENDPOINT}?limit=999")
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)

    print_result "Invalid limit parameter" "$status_code" 400
    echo "Response: $body"
    echo ""
}

# Function to test with invalid UUID
test_invalid_uuid() {
    echo "Test 3: Request with invalid teamId"
    response=$(curl -s -w "\n%{http_code}" "${API_BASE}${ENDPOINT}?teamId=invalid-uuid")
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)

    print_result "Invalid UUID parameter" "$status_code" 400
    echo "Response: $body"
    echo ""
}

# Note: Tests with authentication require implementing Supabase auth flow
# For now, we'll test the validation and error handling

echo "=========================================="
echo "Running validation tests (no auth needed)"
echo "=========================================="
echo ""

test_without_auth
test_invalid_params
test_invalid_uuid

echo "=========================================="
echo "Tests completed!"
echo "=========================================="
echo ""
echo -e "${YELLOW}Note:${NC} To test authenticated endpoints, you need to:"
echo "1. Obtain a valid Supabase JWT token"
echo "2. Pass it in the request:"
echo "   curl -H 'Authorization: Bearer \$TOKEN' ${API_BASE}${ENDPOINT}"
echo ""
echo "Test users from seed.sql:"
echo "  - Admin: ${ADMIN_EMAIL}"
echo "  - HR: ${HR_EMAIL}"
echo "  - Employee: ${EMPLOYEE_EMAIL}"
echo "  - Password (all): ${PASSWORD}"

