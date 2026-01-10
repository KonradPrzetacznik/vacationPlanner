#!/bin/bash

# Załaduj wspólne funkcje pomocnicze
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Inicjalizuj serwer
init_server

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing GET /api/vacation-requests endpoint${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test 1: Podstawowe wywołanie
echo -e "${YELLOW}Test 1: Podstawowe GET /api/vacation-requests${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/vacation-requests")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Podstawowe GET /api/vacation-requests" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response preview:"
    echo "$body" | jq -r '.data[0:3] | .[] | "  - \(.user.firstName) \(.user.lastName): \(.startDate) to \(.endDate) (\(.status))"' 2>/dev/null || echo "$body" | head -c 200
    total=$(echo "$body" | jq -r '.pagination.total' 2>/dev/null || echo "N/A")
    echo "Total vacation requests: $total"
fi
echo ""

# Test 2: Paginacja
echo -e "${YELLOW}Test 2: Paginacja (limit=5, offset=0)${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/vacation-requests?limit=5&offset=0")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Paginacja limit=5" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    count=$(echo "$body" | jq -r '.data | length' 2>/dev/null || echo "N/A")
    echo "Returned requests count: $count"
    limit=$(echo "$body" | jq -r '.pagination.limit' 2>/dev/null || echo "N/A")
    offset=$(echo "$body" | jq -r '.pagination.offset' 2>/dev/null || echo "N/A")
    echo "Pagination: limit=$limit, offset=$offset"
fi
echo ""

# Test 3: Filtrowanie po statusie SUBMITTED
echo -e "${YELLOW}Test 3: Filtrowanie po statusie (status=SUBMITTED)${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/vacation-requests?status=SUBMITTED")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Filtrowanie status=SUBMITTED" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    count=$(echo "$body" | jq -r '.data | length' 2>/dev/null || echo "N/A")
    echo "Submitted requests count: $count"
    echo "$body" | jq -r '.data[] | "  - \(.user.firstName) \(.user.lastName): \(.status)"' 2>/dev/null | head -5
fi
echo ""

# Test 4: Filtrowanie po wielu statusach
echo -e "${YELLOW}Test 4: Filtrowanie po wielu statusach (SUBMITTED i APPROVED)${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/vacation-requests?status=SUBMITTED&status=APPROVED")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Filtrowanie multiple status" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    count=$(echo "$body" | jq -r '.data | length' 2>/dev/null || echo "N/A")
    echo "Requests with SUBMITTED or APPROVED status: $count"
fi
echo ""

# Test 5: Nieprawidłowy limit (walidacja)
echo -e "${YELLOW}Test 5: Walidacja - nieprawidłowy limit (999)${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/vacation-requests?limit=999")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja limit max 100" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 6: Nieprawidłowy UUID dla userId
echo -e "${YELLOW}Test 6: Walidacja - nieprawidłowy UUID${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/vacation-requests?userId=invalid-uuid")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja UUID" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 7: Nieprawidłowy format daty
echo -e "${YELLOW}Test 7: Walidacja - nieprawidłowy format daty${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/vacation-requests?startDate=2026-13-45")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja date format" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 8: Filtrowanie po dacie rozpoczęcia
echo -e "${YELLOW}Test 8: Filtrowanie po dacie rozpoczęcia (startDate=2026-01-01)${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/vacation-requests?startDate=2026-01-01")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Filtrowanie startDate" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    count=$(echo "$body" | jq -r '.data | length' 2>/dev/null || echo "N/A")
    echo "Requests starting from 2026-01-01: $count"
    echo "$body" | jq -r '.data[0:3] | .[] | "  - \(.startDate) to \(.endDate)"' 2>/dev/null
fi
echo ""

# Test 9: Filtrowanie po zakresie dat
echo -e "${YELLOW}Test 9: Filtrowanie po zakresie dat (startDate=2026-01-01, endDate=2026-12-31)${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/vacation-requests?startDate=2026-01-01&endDate=2026-12-31")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Filtrowanie date range" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    count=$(echo "$body" | jq -r '.data | length' 2>/dev/null || echo "N/A")
    echo "Requests in 2026: $count"
fi
echo ""

# Test 10: Nieprawidłowy status
echo -e "${YELLOW}Test 10: Walidacja - nieprawidłowy status${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/vacation-requests?status=INVALID_STATUS")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja status enum" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Podsumowanie
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo "All tests completed!"
echo ""

