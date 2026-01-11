#!/bin/bash

# Załaduj wspólne funkcje pomocnicze
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Inicjalizuj serwer
init_server

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing POST /api/vacation-requests/:id/cancel endpoint${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Find a SUBMITTED vacation request to test with
echo -e "${YELLOW}Finding a SUBMITTED vacation request...${NC}"
list_response=$(curl -s "${API_BASE}/api/vacation-requests?status=SUBMITTED&limit=1")
submitted_id=$(echo "$list_response" | jq -r '.data[0].id' 2>/dev/null)

if [ -z "$submitted_id" ] || [ "$submitted_id" = "null" ]; then
    echo -e "${YELLOW}No SUBMITTED vacation request found. Creating one for testing...${NC}"

    # Create a vacation request - dates in future
    create_response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"startDate":"2026-04-13","endDate":"2026-04-17"}' \
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

# Test 1: Cancel SUBMITTED vacation request
echo -e "${YELLOW}Test 1: POST cancel on SUBMITTED request${NC}"
response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    "${API_BASE}/api/vacation-requests/${submitted_id}/cancel")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Cancel SUBMITTED vacation request" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response preview:"
    cancelled_id=$(echo "$body" | jq -r '.id' 2>/dev/null || echo "N/A")
    cancelled_status=$(echo "$body" | jq -r '.status' 2>/dev/null || echo "N/A")
    days_returned=$(echo "$body" | jq -r '.daysReturned' 2>/dev/null || echo "N/A")
    updated_at=$(echo "$body" | jq -r '.updatedAt' 2>/dev/null || echo "N/A")

    echo "  ID: $cancelled_id"
    echo "  Status: $cancelled_status"
    echo "  Days Returned: $days_returned"
    echo "  Updated At: $updated_at"

    # Save ID for potential cleanup
    CANCELLED_REQUEST_ID="$cancelled_id"
fi
echo ""

# Test 2: Try to cancel already cancelled request (should fail)
echo -e "${YELLOW}Test 2: POST cancel on already CANCELLED request${NC}"
response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    "${API_BASE}/api/vacation-requests/${submitted_id}/cancel")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Cancel already cancelled request" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    error_msg=$(echo "$body" | jq -r '.error' 2>/dev/null || echo "N/A")
    echo "Error message: $error_msg"
fi
echo ""

# Test 3: Cancel APPROVED vacation request (future date - should succeed)
echo -e "${YELLOW}Test 3: POST cancel on APPROVED request (future date)${NC}"

# First create and approve a request
create_response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"startDate":"2026-05-04","endDate":"2026-05-08"}' \
    "${API_BASE}/api/vacation-requests")
create_status=$(echo "$create_response" | tail -n 1)
create_body=$(echo "$create_response" | head -n -1)
approved_future_id=$(echo "$create_body" | jq -r '.id' 2>/dev/null)

# Approve it (requires HR role in DEFAULT_USER_ID)
approve_response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"acknowledgeThresholdWarning":true}' \
    "${API_BASE}/api/vacation-requests/${approved_future_id}/approve")
approve_status=$(echo "$approve_response" | tail -n 1)

if [ "$approve_status" -eq 200 ]; then
    echo -e "${GREEN}✓ Request approved successfully${NC}"

    # Now try to cancel it
    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        "${API_BASE}/api/vacation-requests/${approved_future_id}/cancel")
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)

    print_test "Cancel APPROVED request (future)" "$status_code" 200

    if [ "$status_code" -eq 200 ]; then
        echo "Response preview:"
        days_returned=$(echo "$body" | jq -r '.daysReturned' 2>/dev/null || echo "N/A")
        echo "  Days Returned: $days_returned"
    fi
else
    echo -e "${YELLOW}⚠ Could not approve request, skipping cancel test${NC}"
fi
echo ""

# Test 4: Try to cancel REJECTED request (should fail)
echo -e "${YELLOW}Test 4: POST cancel on REJECTED request${NC}"

# Find or create a rejected request
list_rejected=$(curl -s "${API_BASE}/api/vacation-requests?status=REJECTED&limit=1")
rejected_id=$(echo "$list_rejected" | jq -r '.data[0].id' 2>/dev/null)

if [ -z "$rejected_id" ] || [ "$rejected_id" = "null" ]; then
    # Create and reject a request
    create_response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"startDate":"2026-06-01","endDate":"2026-06-05"}' \
        "${API_BASE}/api/vacation-requests")
    create_body=$(echo "$create_response" | head -n -1)
    rejected_id=$(echo "$create_body" | jq -r '.id' 2>/dev/null)

    # Reject it
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"reason":"Test rejection"}' \
        "${API_BASE}/api/vacation-requests/${rejected_id}/reject" > /dev/null
fi

response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    "${API_BASE}/api/vacation-requests/${rejected_id}/cancel")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Cancel REJECTED request" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    error_msg=$(echo "$body" | jq -r '.error' 2>/dev/null || echo "N/A")
    echo "Error message: $error_msg"
fi
echo ""

# Test 5: Cancel with invalid UUID
echo -e "${YELLOW}Test 5: POST cancel with invalid UUID${NC}"
response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    "${API_BASE}/api/vacation-requests/invalid-uuid/cancel")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Invalid UUID format" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    error_msg=$(echo "$body" | jq -r '.error' 2>/dev/null || echo "N/A")
    echo "Error message: $error_msg"
fi
echo ""

# Test 6: Cancel non-existent request
echo -e "${YELLOW}Test 6: POST cancel with non-existent UUID${NC}"
fake_id="00000000-0000-0000-0000-000000000000"
response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    "${API_BASE}/api/vacation-requests/${fake_id}/cancel")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Non-existent vacation request" "$status_code" 404

if [ "$status_code" -eq 404 ]; then
    error_msg=$(echo "$body" | jq -r '.error' 2>/dev/null || echo "N/A")
    echo "Error message: $error_msg"
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}POST /api/vacation-requests/:id/cancel tests completed${NC}"
echo -e "${BLUE}========================================${NC}"

