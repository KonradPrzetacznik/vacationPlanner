#!/bin/bash

# Test script for GET /api/settings/:key endpoint
# Tests retrieving a specific setting by key

# Load common test helper functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Initialize server
init_server

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing GET /api/settings/:key endpoint${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test 1: Get default_vacation_days setting
echo -e "${YELLOW}Test 1: GET /api/settings/default_vacation_days${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/settings/default_vacation_days")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "GET default_vacation_days returns 200" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response:"
    echo "$body" | jq '.'

    key=$(echo "$body" | jq -r '.key')
    value=$(echo "$body" | jq -r '.value')

    if [ "$key" = "default_vacation_days" ]; then
        echo -e "${GREEN}✓${NC} Correct key returned"
    else
        echo -e "${RED}✗${NC} Wrong key returned: $key"
    fi

    if [ -n "$value" ] && [ "$value" != "null" ]; then
        echo -e "${GREEN}✓${NC} Value: $value"
    else
        echo -e "${RED}✗${NC} Value is missing or null"
    fi
fi
echo ""

# Test 2: Get team_occupancy_threshold setting
echo -e "${YELLOW}Test 2: GET /api/settings/team_occupancy_threshold${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/settings/team_occupancy_threshold")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "GET team_occupancy_threshold returns 200" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response:"
    echo "$body" | jq '.'

    key=$(echo "$body" | jq -r '.key')
    value=$(echo "$body" | jq -r '.value')

    if [ "$key" = "team_occupancy_threshold" ]; then
        echo -e "${GREEN}✓${NC} Correct key returned"
    else
        echo -e "${RED}✗${NC} Wrong key returned: $key"
    fi

    if [ -n "$value" ] && [ "$value" != "null" ]; then
        echo -e "${GREEN}✓${NC} Value: $value"
    else
        echo -e "${RED}✗${NC} Value is missing or null"
    fi
fi
echo ""

# Test 3: Get non-existent setting (404)
echo -e "${YELLOW}Test 3: GET /api/settings/nonexistent_key (should return 404)${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/settings/nonexistent_key")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "GET nonexistent key returns 404" "$status_code" 404

if [ "$status_code" -eq 404 ]; then
    echo "Error response:"
    echo "$body" | jq '.'

    error_msg=$(echo "$body" | jq -r '.error')
    if [[ "$error_msg" == *"not found"* ]]; then
        echo -e "${GREEN}✓${NC} Correct error message"
    else
        echo -e "${RED}✗${NC} Unexpected error message: $error_msg"
    fi
fi
echo ""

# Test 4: Empty key (400)
echo -e "${YELLOW}Test 4: GET /api/settings/ with empty key${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/settings/")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

# Note: This might return 404 from Astro routing, not our validation
if [ "$status_code" -eq 404 ] || [ "$status_code" -eq 400 ]; then
    echo -e "${GREEN}✓${NC} Empty key handled correctly (status: $status_code)"
else
    echo -e "${RED}✗${NC} Unexpected status code: $status_code"
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo "All GET /api/settings/:key tests completed!"

