#!/bin/bash

# Załaduj wspólne funkcje pomocnicze
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Inicjalizuj serwer
init_server

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing POST /api/vacation-requests/:id/reject endpoint${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Find a SUBMITTED vacation request to test with
echo -e "${YELLOW}Finding a SUBMITTED vacation request...${NC}"
list_response=$(curl -s "${API_BASE}/api/vacation-requests?status=SUBMITTED&limit=1")
submitted_id=$(echo "$list_response" | jq -r '.data[0].id' 2>/dev/null)

if [ -z "$submitted_id" ] || [ "$submitted_id" = "null" ]; then
    echo -e "${YELLOW}No SUBMITTED vacation request found. Creating one for testing...${NC}"

    # Create a vacation request
    create_response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"startDate":"2026-03-09","endDate":"2026-03-13"}' \
        "${API_BASE}/api/vacation-requests")

    create_status=$(echo "$create_response" | tail -n 1)
    create_body=$(echo "$create_response" | head -n -1)

    if [ "$create_status" -eq 201 ]; then
        submitted_id=$(echo "$create_body" | jq -r '.id' 2>/dev/null)
        echo -e "${GREEN}✓ Created test vacation request: $submitted_id${NC}"
    else
        echo -e "${RED}✗ Failed to create test vacation request${NC}"
        exit 1
    fi
fi

echo "Using vacation request ID: $submitted_id"
echo ""

# Test 1: Reject vacation request with valid reason
echo -e "${YELLOW}Test 1: POST reject with valid reason${NC}"
response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"reason":"Team capacity exceeded during this period"}' \
    "${API_BASE}/api/vacation-requests/${submitted_id}/reject")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Reject vacation request" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response preview:"
    rejected_id=$(echo "$body" | jq -r '.id' 2>/dev/null || echo "N/A")
    rejected_status=$(echo "$body" | jq -r '.status' 2>/dev/null || echo "N/A")
    processed_by=$(echo "$body" | jq -r '.processedByUserId' 2>/dev/null || echo "N/A")
    processed_at=$(echo "$body" | jq -r '.processedAt' 2>/dev/null || echo "N/A")

    echo "  ID: $rejected_id"
    echo "  Status: $rejected_status"
    echo "  Processed By: $processed_by"
    echo "  Processed At: $processed_at"

    # Save ID for potential cleanup
    REJECTED_REQUEST_ID="$rejected_id"
fi
echo ""

# Test 2: Try to reject already rejected request (should fail)
echo -e "${YELLOW}Test 2: POST reject on already REJECTED request${NC}"
response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"reason":"Another reason"}' \
    "${API_BASE}/api/vacation-requests/${submitted_id}/reject")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Reject already rejected request" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    error_msg=$(echo "$body" | jq -r '.error' 2>/dev/null || echo "N/A")
    echo "Error message: $error_msg"
fi
echo ""

# Test 3: Reject without reason (should fail)
echo -e "${YELLOW}Test 3: POST reject without reason${NC}"

# Create a new SUBMITTED request for this test
create_response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"startDate":"2026-03-16","endDate":"2026-03-20"}' \
    "${API_BASE}/api/vacation-requests")
create_status=$(echo "$create_response" | tail -n 1)
create_body=$(echo "$create_response" | head -n -1)
new_submitted_id=$(echo "$create_body" | jq -r '.id' 2>/dev/null)

response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{}' \
    "${API_BASE}/api/vacation-requests/${new_submitted_id}/reject")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Reject without reason" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    error_msg=$(echo "$body" | jq -r '.error' 2>/dev/null || echo "N/A")
    echo "Error message: $error_msg"
fi
echo ""

# Test 4: Reject with reason too long (> 500 characters)
echo -e "${YELLOW}Test 4: POST reject with reason too long${NC}"
long_reason=$(printf 'x%.0s' {1..501})
response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"reason\":\"${long_reason}\"}" \
    "${API_BASE}/api/vacation-requests/${new_submitted_id}/reject")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Reject with reason too long" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    error_msg=$(echo "$body" | jq -r '.error' 2>/dev/null || echo "N/A")
    echo "Error message: $error_msg"
fi
echo ""

# Test 5: Reject with invalid UUID
echo -e "${YELLOW}Test 5: POST reject with invalid UUID${NC}"
response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"reason":"Test reason"}' \
    "${API_BASE}/api/vacation-requests/invalid-uuid/reject")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Invalid UUID format" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    error_msg=$(echo "$body" | jq -r '.error' 2>/dev/null || echo "N/A")
    echo "Error message: $error_msg"
fi
echo ""

# Test 6: Reject non-existent request
echo -e "${YELLOW}Test 6: POST reject with non-existent UUID${NC}"
fake_id="00000000-0000-0000-0000-000000000000"
response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"reason":"Test reason"}' \
    "${API_BASE}/api/vacation-requests/${fake_id}/reject")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Non-existent vacation request" "$status_code" 404

if [ "$status_code" -eq 404 ]; then
    error_msg=$(echo "$body" | jq -r '.error' 2>/dev/null || echo "N/A")
    echo "Error message: $error_msg"
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}POST /api/vacation-requests/:id/reject tests completed${NC}"
echo -e "${BLUE}========================================${NC}"

