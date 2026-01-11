#!/bin/bash

# Test script for PUT /api/settings/:key endpoint
# Tests updating settings (HR only)

# Load common test helper functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Initialize server
init_server

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing PUT /api/settings/:key endpoint${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test 1: Update default_vacation_days
echo -e "${YELLOW}Test 1: PUT /api/settings/default_vacation_days with valid value${NC}"
response=$(curl -s -w "\n%{http_code}" -X PUT \
  -H "Content-Type: application/json" \
  -d '{"value": 26}' \
  "${API_BASE}/api/settings/default_vacation_days")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "PUT default_vacation_days returns 200" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response:"
    echo "$body" | jq '.'

    value=$(echo "$body" | jq -r '.value')
    if [ "$value" = "26" ]; then
        echo -e "${GREEN}✓${NC} Value updated correctly to 26"
    else
        echo -e "${RED}✗${NC} Value not updated correctly: $value"
    fi
fi
echo ""

# Test 2: Update team_occupancy_threshold with valid value (0-100)
echo -e "${YELLOW}Test 2: PUT /api/settings/team_occupancy_threshold with valid value${NC}"
response=$(curl -s -w "\n%{http_code}" -X PUT \
  -H "Content-Type: application/json" \
  -d '{"value": 50}' \
  "${API_BASE}/api/settings/team_occupancy_threshold")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "PUT team_occupancy_threshold returns 200" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    value=$(echo "$body" | jq -r '.value')
    if [ "$value" = "50" ]; then
        echo -e "${GREEN}✓${NC} Value updated correctly to 50"
    else
        echo -e "${RED}✗${NC} Value not updated correctly: $value"
    fi
fi
echo ""

# Test 3: Validation - team_occupancy_threshold > 100 (should fail)
echo -e "${YELLOW}Test 3: PUT team_occupancy_threshold with value > 100 (should fail)${NC}"
response=$(curl -s -w "\n%{http_code}" -X PUT \
  -H "Content-Type: application/json" \
  -d '{"value": 150}' \
  "${API_BASE}/api/settings/team_occupancy_threshold")
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

# Test 4: Validation - negative value (should fail)
echo -e "${YELLOW}Test 4: PUT with negative value (should fail)${NC}"
response=$(curl -s -w "\n%{http_code}" -X PUT \
  -H "Content-Type: application/json" \
  -d '{"value": -5}' \
  "${API_BASE}/api/settings/default_vacation_days")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Validation: negative value returns 400" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error response:"
    echo "$body" | jq '.'

    error_msg=$(echo "$body" | jq -r '.error')
    if [[ "$error_msg" == *"Invalid request body"* ]]; then
        echo -e "${GREEN}✓${NC} Correct validation error"
    fi
fi
echo ""

# Test 5: Validation - float value (should fail, integer required)
echo -e "${YELLOW}Test 5: PUT with float value (should fail, integer required)${NC}"
response=$(curl -s -w "\n%{http_code}" -X PUT \
  -H "Content-Type: application/json" \
  -d '{"value": 25.5}' \
  "${API_BASE}/api/settings/default_vacation_days")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Validation: float value returns 400" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error response:"
    echo "$body" | jq '.'

    details=$(echo "$body" | jq -r '.details.value[0]')
    if [[ "$details" == *"integer"* ]]; then
        echo -e "${GREEN}✓${NC} Correct validation error for integer"
    fi
fi
echo ""

# Test 6: Validation - missing value field (should fail)
echo -e "${YELLOW}Test 6: PUT with missing value field (should fail)${NC}"
response=$(curl -s -w "\n%{http_code}" -X PUT \
  -H "Content-Type: application/json" \
  -d '{}' \
  "${API_BASE}/api/settings/default_vacation_days")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Validation: missing value returns 400" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo -e "${GREEN}✓${NC} Missing value field handled correctly"
fi
echo ""

# Test 7: Invalid JSON (should fail)
echo -e "${YELLOW}Test 7: PUT with invalid JSON (should fail)${NC}"
response=$(curl -s -w "\n%{http_code}" -X PUT \
  -H "Content-Type: application/json" \
  -d 'invalid json' \
  "${API_BASE}/api/settings/default_vacation_days")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Validation: invalid JSON returns 400" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    error_msg=$(echo "$body" | jq -r '.error')
    if [[ "$error_msg" == *"Invalid JSON"* ]]; then
        echo -e "${GREEN}✓${NC} Correct error for invalid JSON"
    fi
fi
echo ""

# Test 8: Update non-existent setting (should fail with 404)
echo -e "${YELLOW}Test 8: PUT /api/settings/nonexistent_key (should fail)${NC}"
response=$(curl -s -w "\n%{http_code}" -X PUT \
  -H "Content-Type: application/json" \
  -d '{"value": 100}' \
  "${API_BASE}/api/settings/nonexistent_key")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "PUT nonexistent key returns 404" "$status_code" 404

if [ "$status_code" -eq 404 ]; then
    echo -e "${GREEN}✓${NC} Correct 404 for nonexistent key"
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo "All PUT /api/settings/:key tests completed!"

