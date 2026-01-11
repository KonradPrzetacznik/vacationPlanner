#!/bin/bash

# Załaduj wspólne funkcje pomocnicze
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Inicjalizuj serwer
init_server

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing POST /api/vacation-requests endpoint${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test 1: Create vacation request with valid data
echo -e "${YELLOW}Test 1: POST with valid vacation request data${NC}"
# Use dates in the future (next month, Monday to Friday)
start_date="2026-02-02"  # Monday
end_date="2026-02-06"    # Friday

response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"startDate\":\"${start_date}\",\"endDate\":\"${end_date}\"}" \
    "${API_BASE}/api/vacation-requests")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Create vacation request" "$status_code" 201

if [ "$status_code" -eq 201 ]; then
    echo "Response preview:"
    created_id=$(echo "$body" | jq -r '.id' 2>/dev/null || echo "N/A")
    created_start=$(echo "$body" | jq -r '.startDate' 2>/dev/null || echo "N/A")
    created_end=$(echo "$body" | jq -r '.endDate' 2>/dev/null || echo "N/A")
    created_days=$(echo "$body" | jq -r '.businessDaysCount' 2>/dev/null || echo "N/A")
    created_status=$(echo "$body" | jq -r '.status' 2>/dev/null || echo "N/A")

    echo "  ID: $created_id"
    echo "  Dates: $created_start to $created_end"
    echo "  Business Days: $created_days"
    echo "  Status: $created_status"

    # Save ID for cleanup later
    CREATED_REQUEST_ID="$created_id"
fi
echo ""

# Test 2: Create vacation request with missing startDate
echo -e "${YELLOW}Test 2: POST with missing startDate${NC}"
response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"endDate\":\"2026-03-15\"}" \
    "${API_BASE}/api/vacation-requests")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Missing startDate" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    error_msg=$(echo "$body" | jq -r '.error' 2>/dev/null || echo "N/A")
    echo "Error message: $error_msg"
fi
echo ""

# Test 3: Create vacation request with invalid date format
echo -e "${YELLOW}Test 3: POST with invalid date format${NC}"
response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"startDate\":\"15-03-2026\",\"endDate\":\"2026-03-20\"}" \
    "${API_BASE}/api/vacation-requests")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Invalid date format" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    error_msg=$(echo "$body" | jq -r '.error' 2>/dev/null || echo "N/A")
    echo "Error message: $error_msg"
fi
echo ""

# Test 4: Create vacation request with date in the past
echo -e "${YELLOW}Test 4: POST with date in the past${NC}"
response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"startDate\":\"2023-01-10\",\"endDate\":\"2023-01-15\"}" \
    "${API_BASE}/api/vacation-requests")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Date in the past" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    error_msg=$(echo "$body" | jq -r '.error' 2>/dev/null || echo "N/A")
    echo "Error message: $error_msg"
fi
echo ""

# Test 5: Create vacation request with weekend date
echo -e "${YELLOW}Test 5: POST with weekend date (Saturday)${NC}"
response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"startDate\":\"2026-02-07\",\"endDate\":\"2026-02-10\"}" \
    "${API_BASE}/api/vacation-requests")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Weekend start date" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    error_msg=$(echo "$body" | jq -r '.error' 2>/dev/null || echo "N/A")
    echo "Error message: $error_msg"
fi
echo ""

# Test 6: Create vacation request with endDate before startDate
echo -e "${YELLOW}Test 6: POST with endDate before startDate${NC}"
response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"startDate\":\"2026-03-20\",\"endDate\":\"2026-03-10\"}" \
    "${API_BASE}/api/vacation-requests")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "EndDate before startDate" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    error_msg=$(echo "$body" | jq -r '.error' 2>/dev/null || echo "N/A")
    echo "Error message: $error_msg"
fi
echo ""

# Test 7: Create vacation request with invalid JSON
echo -e "${YELLOW}Test 7: POST with invalid JSON${NC}"
response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"startDate\":\"2026-03-10\",\"endDate\":" \
    "${API_BASE}/api/vacation-requests")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Invalid JSON body" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    error_msg=$(echo "$body" | jq -r '.error' 2>/dev/null || echo "N/A")
    echo "Error message: $error_msg"
fi
echo ""

# Test 8: Create overlapping vacation request
echo -e "${YELLOW}Test 8: POST with overlapping dates (if previous request succeeded)${NC}"
if [ -n "$CREATED_REQUEST_ID" ]; then
    # Try to create request with overlapping dates
    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"startDate\":\"${start_date}\",\"endDate\":\"${end_date}\"}" \
        "${API_BASE}/api/vacation-requests")
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)

    print_test "Overlapping vacation request" "$status_code" 409

    if [ "$status_code" -eq 409 ]; then
        error_msg=$(echo "$body" | jq -r '.error' 2>/dev/null || echo "N/A")
        echo "Error message: $error_msg"
    fi
else
    echo -e "${YELLOW}Skipped (no previous request created)${NC}"
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}POST /api/vacation-requests tests completed${NC}"
echo -e "${BLUE}========================================${NC}"

# Note: Cleanup of created requests could be added here if DELETE endpoint exists
if [ -n "$CREATED_REQUEST_ID" ]; then
    echo -e "${YELLOW}Note: Created vacation request with ID: $CREATED_REQUEST_ID${NC}"
    echo -e "${YELLOW}You may want to clean it up manually if needed.${NC}"
fi

