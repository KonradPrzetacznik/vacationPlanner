#!/bin/bash

# Test script for Users Management View
# This script performs basic smoke tests on the users management endpoints

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:4321}"
ADMIN_USER_ID="00000000-0000-0000-0000-000000000001"

echo -e "${YELLOW}=== Users Management View - Smoke Tests ===${NC}\n"

# Test 1: GET /api/users - List users
echo -e "${YELLOW}Test 1: List users (GET /api/users)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "${API_BASE_URL}/api/users?limit=10&offset=0")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ List users successful${NC}"
    echo "Sample response:"
    echo "$BODY" | jq -r '.data[0:2] | if length > 0 then .[0] else "No users found" end' 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}✗ List users failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
    exit 1
fi
echo ""

# Test 2: GET /api/users with filters
echo -e "${YELLOW}Test 2: List users with role filter${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "${API_BASE_URL}/api/users?role=ADMINISTRATOR")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Filter by role successful${NC}"
    ADMIN_COUNT=$(echo "$BODY" | jq -r '.pagination.total' 2>/dev/null || echo "N/A")
    echo "Total administrators: $ADMIN_COUNT"
else
    echo -e "${RED}✗ Filter failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
    exit 1
fi
echo ""

# Test 3: GET /api/users/:id - Get specific user
echo -e "${YELLOW}Test 3: Get user by ID${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "${API_BASE_URL}/api/users/${ADMIN_USER_ID}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Get user by ID successful${NC}"
    USER_NAME=$(echo "$BODY" | jq -r '.data.firstName + " " + .data.lastName' 2>/dev/null || echo "N/A")
    echo "User: $USER_NAME"
else
    echo -e "${RED}✗ Get user failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
    exit 1
fi
echo ""

# Test 4: POST /api/users - Create user
echo -e "${YELLOW}Test 4: Create new user${NC}"
TEST_EMAIL="test.user.$(date +%s)@example.com"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE_URL}/api/users" \
    -H "Content-Type: application/json" \
    -d "{
        \"firstName\": \"Test\",
        \"lastName\": \"User\",
        \"email\": \"${TEST_EMAIL}\",
        \"role\": \"EMPLOYEE\",
        \"temporaryPassword\": \"TestPassword123\"
    }")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Create user successful${NC}"
    NEW_USER_ID=$(echo "$BODY" | jq -r '.id' 2>/dev/null || echo "")
    echo "Created user ID: $NEW_USER_ID"
    echo "Email: $TEST_EMAIL"

    # Test 5: PATCH /api/users/:id - Update user
    if [ -n "$NEW_USER_ID" ]; then
        echo ""
        echo -e "${YELLOW}Test 5: Update user${NC}"
        RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE_URL}/api/users/${NEW_USER_ID}" \
            -H "Content-Type: application/json" \
            -d "{
                \"firstName\": \"Updated\",
                \"lastName\": \"TestUser\"
            }")
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        BODY=$(echo "$RESPONSE" | head -n-1)

        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✓ Update user successful${NC}"
            UPDATED_NAME=$(echo "$BODY" | jq -r '.firstName + " " + .lastName' 2>/dev/null || echo "N/A")
            echo "Updated name: $UPDATED_NAME"
        else
            echo -e "${RED}✗ Update user failed (HTTP $HTTP_CODE)${NC}"
            echo "$BODY"
        fi

        # Test 6: DELETE /api/users/:id - Delete user
        echo ""
        echo -e "${YELLOW}Test 6: Delete user${NC}"
        RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "${API_BASE_URL}/api/users/${NEW_USER_ID}")
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        BODY=$(echo "$RESPONSE" | head -n-1)

        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✓ Delete user successful${NC}"
            CANCELLED_VACATIONS=$(echo "$BODY" | jq -r '.cancelledVacations' 2>/dev/null || echo "0")
            echo "Cancelled vacations: $CANCELLED_VACATIONS"
        else
            echo -e "${RED}✗ Delete user failed (HTTP $HTTP_CODE)${NC}"
            echo "$BODY"
        fi
    fi
else
    echo -e "${RED}✗ Create user failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi

echo ""
echo -e "${GREEN}=== All tests completed ===${NC}"
