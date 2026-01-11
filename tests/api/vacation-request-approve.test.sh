#!/bin/bash

# Załaduj wspólne funkcje pomocnicze
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Inicjalizuj serwer
init_server

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing POST /api/vacation-requests/:id/approve endpoint${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Find a SUBMITTED vacation request to test with
echo -e "${YELLOW}Finding a SUBMITTED vacation request...${NC}"
list_response=$(curl -s "${API_BASE}/api/vacation-requests?status=SUBMITTED&limit=1")
submitted_id=$(echo "$list_response" | jq -r '.data[0].id' 2>/dev/null)

if [ -z "$submitted_id" ] || [ "$submitted_id" = "null" ]; then
    echo -e "${YELLOW}No SUBMITTED vacation request found. Creating one for testing...${NC}"

    # Create a vacation request as employee (we'll need to change DEFAULT_USER_ID temporarily)
    # Using dates in future: February 2026
    create_response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"startDate":"2026-02-16","endDate":"2026-02-20"}' \
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

# Test 1: Approve vacation request without acknowledgment (no threshold exceeded)
echo -e "${YELLOW}Test 1: POST approve without threshold exceeded${NC}"
response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"acknowledgeThresholdWarning":false}' \
    "${API_BASE}/api/vacation-requests/${submitted_id}/approve")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Approve vacation request" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response preview:"
    approved_id=$(echo "$body" | jq -r '.id' 2>/dev/null || echo "N/A")
    approved_status=$(echo "$body" | jq -r '.status' 2>/dev/null || echo "N/A")
    processed_by=$(echo "$body" | jq -r '.processedByUserId' 2>/dev/null || echo "N/A")
    processed_at=$(echo "$body" | jq -r '.processedAt' 2>/dev/null || echo "N/A")
    threshold_warning=$(echo "$body" | jq -r '.thresholdWarning' 2>/dev/null || echo "null")

    echo "  ID: $approved_id"
    echo "  Status: $approved_status"
    echo "  Processed By: $processed_by"
    echo "  Processed At: $processed_at"
    echo "  Threshold Warning: $threshold_warning"

    # Save ID for potential cleanup
    APPROVED_REQUEST_ID="$approved_id"
fi
echo ""

# Test 2: Try to approve already approved request (should fail)
echo -e "${YELLOW}Test 2: POST approve on already APPROVED request${NC}"
response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"acknowledgeThresholdWarning":false}' \
    "${API_BASE}/api/vacation-requests/${submitted_id}/approve")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Approve already approved request" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    error_msg=$(echo "$body" | jq -r '.error' 2>/dev/null || echo "N/A")
    echo "Error message: $error_msg"
fi
echo ""

# Test 3: Approve with invalid UUID
echo -e "${YELLOW}Test 3: POST approve with invalid UUID${NC}"
response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"acknowledgeThresholdWarning":false}' \
    "${API_BASE}/api/vacation-requests/invalid-uuid/approve")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Invalid UUID format" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    error_msg=$(echo "$body" | jq -r '.error' 2>/dev/null || echo "N/A")
    echo "Error message: $error_msg"
fi
echo ""

# Test 4: Approve non-existent request
echo -e "${YELLOW}Test 4: POST approve with non-existent UUID${NC}"
fake_id="00000000-0000-0000-0000-000000000000"
response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"acknowledgeThresholdWarning":false}' \
    "${API_BASE}/api/vacation-requests/${fake_id}/approve")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Non-existent vacation request" "$status_code" 404

if [ "$status_code" -eq 404 ]; then
    error_msg=$(echo "$body" | jq -r '.error' 2>/dev/null || echo "N/A")
    echo "Error message: $error_msg"
fi
echo ""

# Test 5: Approve with invalid body
echo -e "${YELLOW}Test 5: POST approve with invalid body${NC}"
response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"invalidField":"value"}' \
    "${API_BASE}/api/vacation-requests/${submitted_id}/approve")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

# Should still work (acknowledgeThresholdWarning is optional with default false)
print_test "Approve with extra fields in body" "$status_code" "200 or 400"
echo "  Status: $status_code"
if [ "$status_code" -eq 400 ] || [ "$status_code" -eq 200 ]; then
    echo -e "  ${GREEN}✓ Response is acceptable${NC}"
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}POST /api/vacation-requests/:id/approve tests completed${NC}"
echo -e "${BLUE}========================================${NC}"

