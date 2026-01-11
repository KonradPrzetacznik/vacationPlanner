#!/bin/bash

# Załaduj wspólne funkcje pomocnicze
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Inicjalizuj serwer
init_server

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing GET /api/vacation-requests/:id endpoint${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get a sample vacation request ID first
echo -e "${YELLOW}Fetching a sample vacation request ID...${NC}"
list_response=$(curl -s "${API_BASE}/api/vacation-requests?limit=1")
sample_id=$(echo "$list_response" | jq -r '.data[0].id' 2>/dev/null)

if [ -z "$sample_id" ] || [ "$sample_id" = "null" ]; then
    echo -e "${RED}✗ No vacation requests found in the system. Please seed the database first.${NC}"
    exit 1
fi

echo "Using vacation request ID: $sample_id"
echo ""

# Test 1: Get vacation request by valid ID
echo -e "${YELLOW}Test 1: GET vacation request by valid ID${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/vacation-requests/${sample_id}")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "GET vacation request by ID" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response preview:"
    user_name=$(echo "$body" | jq -r '.data.user.firstName + " " + .data.user.lastName' 2>/dev/null || echo "N/A")
    user_email=$(echo "$body" | jq -r '.data.user.email' 2>/dev/null || echo "N/A")
    start_date=$(echo "$body" | jq -r '.data.startDate' 2>/dev/null || echo "N/A")
    end_date=$(echo "$body" | jq -r '.data.endDate' 2>/dev/null || echo "N/A")
    business_days=$(echo "$body" | jq -r '.data.businessDaysCount' 2>/dev/null || echo "N/A")
    status=$(echo "$body" | jq -r '.data.status' 2>/dev/null || echo "N/A")

    echo "  User: $user_name ($user_email)"
    echo "  Dates: $start_date to $end_date"
    echo "  Business Days: $business_days"
    echo "  Status: $status"

    processed_by=$(echo "$body" | jq -r '.data.processedBy' 2>/dev/null || echo "null")
    if [ "$processed_by" != "null" ]; then
        processed_by_name=$(echo "$body" | jq -r '.data.processedBy.firstName + " " + .data.processedBy.lastName' 2>/dev/null || echo "N/A")
        processed_at=$(echo "$body" | jq -r '.data.processedAt' 2>/dev/null || echo "N/A")
        echo "  Processed By: $processed_by_name at $processed_at"
    fi
fi
echo ""

# Test 2: Get vacation request with invalid UUID format
echo -e "${YELLOW}Test 2: GET with invalid UUID format${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/vacation-requests/invalid-uuid")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Invalid UUID format" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    error_msg=$(echo "$body" | jq -r '.error' 2>/dev/null || echo "N/A")
    echo "Error message: $error_msg"
fi
echo ""

# Test 3: Get vacation request with non-existent ID
echo -e "${YELLOW}Test 3: GET with non-existent UUID${NC}"
fake_id="00000000-0000-0000-0000-000000000000"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/vacation-requests/${fake_id}")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Non-existent vacation request" "$status_code" 404

if [ "$status_code" -eq 404 ]; then
    error_msg=$(echo "$body" | jq -r '.error' 2>/dev/null || echo "N/A")
    echo "Error message: $error_msg"
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}GET /api/vacation-requests/:id tests completed${NC}"
echo -e "${BLUE}========================================${NC}"

