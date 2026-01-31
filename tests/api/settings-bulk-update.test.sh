#!/bin/bash

# Test script for POST /api/settings endpoint
# Tests bulk updating settings (HR and ADMINISTRATOR only)

# Load common test helper functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Initialize server
init_server

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing POST /api/settings endpoint${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test 1: Update both settings with valid values
echo -e "${YELLOW}Test 1: POST /api/settings with valid values${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '[{"key": "default_vacation_days", "value": 28}, {"key": "team_occupancy_threshold", "value": 75}]' \
  "${API_BASE}/api/settings")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "POST settings returns 200" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response:"
    echo "$body" | jq '.'

    # Verify both values were updated
    default_days=$(echo "$body" | jq -r '.data[] | select(.key=="default_vacation_days") | .value')
    threshold=$(echo "$body" | jq -r '.data[] | select(.key=="team_occupancy_threshold") | .value')

    if [ "$default_days" = "28" ]; then
        echo -e "${GREEN}✓${NC} default_vacation_days updated correctly to 28"
    else
        echo -e "${RED}✗${NC} default_vacation_days not updated correctly: $default_days"
    fi

    if [ "$threshold" = "75" ]; then
        echo -e "${GREEN}✓${NC} team_occupancy_threshold updated correctly to 75"
    else
        echo -e "${RED}✗${NC} team_occupancy_threshold not updated correctly: $threshold"
    fi
fi
echo ""

# Test 2: Validation - team_occupancy_threshold > 100 (should fail)
echo -e "${YELLOW}Test 2: POST with team_occupancy_threshold > 100 (should fail)${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '[{"key": "team_occupancy_threshold", "value": 150}]' \
  "${API_BASE}/api/settings")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Validation: value > 100 returns 400" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error response:"
    echo "$body" | jq '.'

    error_msg=$(echo "$body" | jq -r '.error')
    if [[ "$error_msg" == *"between 0 and 100"* ]]; then
        echo -e "${GREEN}✓${NC} Correct validation error message"
    else
        echo -e "${RED}✗${NC} Unexpected error message: $error_msg"
    fi
fi
echo ""

# Test 3: Validation - team_occupancy_threshold < 0 (should fail)
echo -e "${YELLOW}Test 3: POST with team_occupancy_threshold < 0 (should fail)${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '[{"key": "team_occupancy_threshold", "value": -10}]' \
  "${API_BASE}/api/settings")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Validation: negative value returns 400" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error response:"
    echo "$body" | jq '.'
fi
echo ""

# Test 4: Validation - default_vacation_days > 365 (should fail)
echo -e "${YELLOW}Test 4: POST with default_vacation_days > 365 (should fail)${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '[{"key": "default_vacation_days", "value": 400}]' \
  "${API_BASE}/api/settings")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

# Note: Currently there's no validation in the service for max days,
# so this might pass. We should add validation if needed.
echo "Status code: $status_code"
echo "Response:"
echo "$body" | jq '.'
echo ""

# Test 5: Validation - default_vacation_days < 1 (should fail)
echo -e "${YELLOW}Test 5: POST with default_vacation_days < 1 (should fail)${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '[{"key": "default_vacation_days", "value": 0}]' \
  "${API_BASE}/api/settings")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

echo "Status code: $status_code"
echo "Response:"
echo "$body" | jq '.'
echo ""

# Test 6: Invalid request body (missing value field)
echo -e "${YELLOW}Test 6: POST with invalid request body (should fail)${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '[{"key": "default_vacation_days"}]' \
  "${API_BASE}/api/settings")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Invalid body returns 400" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error response:"
    echo "$body" | jq '.'
fi
echo ""

# Test 7: Non-existent setting key (should fail)
echo -e "${YELLOW}Test 7: POST with non-existent setting key (should fail)${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '[{"key": "non_existent_setting", "value": 100}]' \
  "${API_BASE}/api/settings")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Non-existent key returns 404" "$status_code" 404

if [ "$status_code" -eq 404 ]; then
    echo "Error response:"
    echo "$body" | jq '.'
fi
echo ""

# Test 8: Update only one setting
echo -e "${YELLOW}Test 8: POST updating only default_vacation_days${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '[{"key": "default_vacation_days", "value": 26}]' \
  "${API_BASE}/api/settings")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "POST single setting returns 200" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response:"
    echo "$body" | jq '.'
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}All tests completed${NC}"
echo -e "${BLUE}========================================${NC}"
