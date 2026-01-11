#!/bin/bash

# Test script for GET /api/settings endpoint
# Tests retrieving all global settings

# Load common test helper functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Initialize server
init_server

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing GET /api/settings endpoint${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test 1: Basic GET /api/settings
echo -e "${YELLOW}Test 1: Basic GET /api/settings${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/settings")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "GET /api/settings returns 200" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response preview:"
    echo "$body" | jq '.'

    # Check if data array exists
    data_exists=$(echo "$body" | jq -r '.data' 2>/dev/null)
    if [ "$data_exists" != "null" ] && [ "$data_exists" != "" ]; then
        echo -e "${GREEN}✓${NC} Response contains 'data' array"

        # Check if default settings exist
        default_vacation_days=$(echo "$body" | jq -r '.data[] | select(.key == "default_vacation_days") | .value')
        team_occupancy_threshold=$(echo "$body" | jq -r '.data[] | select(.key == "team_occupancy_threshold") | .value')

        if [ -n "$default_vacation_days" ]; then
            echo -e "${GREEN}✓${NC} default_vacation_days: $default_vacation_days"
        else
            echo -e "${RED}✗${NC} default_vacation_days not found"
        fi

        if [ -n "$team_occupancy_threshold" ]; then
            echo -e "${GREEN}✓${NC} team_occupancy_threshold: $team_occupancy_threshold"
        else
            echo -e "${RED}✗${NC} team_occupancy_threshold not found"
        fi
    else
        echo -e "${RED}✗${NC} Response does not contain 'data' array"
    fi
else
    echo "Error response:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
fi
echo ""

# Test 2: Verify setting structure
echo -e "${YELLOW}Test 2: Verify setting structure (key, value, description, updatedAt)${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/settings")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$status_code" -eq 200 ]; then
    first_setting=$(echo "$body" | jq -r '.data[0]')

    has_key=$(echo "$first_setting" | jq -r 'has("key")')
    has_value=$(echo "$first_setting" | jq -r 'has("value")')
    has_description=$(echo "$first_setting" | jq -r 'has("description")')
    has_updated_at=$(echo "$first_setting" | jq -r 'has("updatedAt")')

    if [ "$has_key" = "true" ]; then
        echo -e "${GREEN}✓${NC} Setting has 'key' field"
    else
        echo -e "${RED}✗${NC} Setting missing 'key' field"
    fi

    if [ "$has_value" = "true" ]; then
        value_type=$(echo "$first_setting" | jq -r '.value | type')
        echo -e "${GREEN}✓${NC} Setting has 'value' field (type: $value_type)"
    else
        echo -e "${RED}✗${NC} Setting missing 'value' field"
    fi

    if [ "$has_description" = "true" ]; then
        echo -e "${GREEN}✓${NC} Setting has 'description' field"
    else
        echo -e "${RED}✗${NC} Setting missing 'description' field"
    fi

    if [ "$has_updated_at" = "true" ]; then
        echo -e "${GREEN}✓${NC} Setting has 'updatedAt' field"
    else
        echo -e "${RED}✗${NC} Setting missing 'updatedAt' field"
    fi
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo "All GET /api/settings tests completed!"

