#!/bin/bash

# Załaduj wspólne funkcje pomocnicze
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Inicjalizuj serwer
init_server

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing GET /api/teams endpoint${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""


# Test 1: Podstawowe wywołanie
echo -e "${YELLOW}Test 1: Podstawowe GET /api/teams${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/teams")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Podstawowe GET /api/teams" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Response preview:"
    echo "$body" | jq -r '.data[0:3] | .[] | "  - \(.name) (ID: \(.id))"' 2>/dev/null || echo "$body" | head -c 200
    total=$(echo "$body" | jq -r '.pagination.total' 2>/dev/null || echo "N/A")
    echo "Total teams: $total"
fi
echo ""

# Test 2: Paginacja
echo -e "${YELLOW}Test 2: Paginacja (limit=5, offset=0)${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/teams?limit=5&offset=0")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Paginacja limit=5" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    count=$(echo "$body" | jq -r '.data | length' 2>/dev/null || echo "N/A")
    echo "Returned teams count: $count"
fi
echo ""

# Test 3: Włączenie licznika członków
echo -e "${YELLOW}Test 3: Włączenie licznika członków (includeMemberCount=true)${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/teams?includeMemberCount=true")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "includeMemberCount=true" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    echo "Teams with member counts:"
    echo "$body" | jq -r '.data[0:3] | .[] | "  - \(.name): \(.memberCount // 0) members"' 2>/dev/null || echo "$body" | head -c 200
fi
echo ""

# Test 4: Nieprawidłowy limit (walidacja)
echo -e "${YELLOW}Test 4: Walidacja - nieprawidłowy limit (999)${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/teams?limit=999")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja limit max 100" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 5: Nieprawidłowy offset (walidacja)
echo -e "${YELLOW}Test 5: Walidacja - ujemny offset${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/teams?offset=-1")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Walidacja offset >= 0" "$status_code" 400

if [ "$status_code" -eq 400 ]; then
    echo "Error message:"
    echo "$body" | jq -r '.error' 2>/dev/null || echo "$body"
fi
echo ""

# Test 6: Limit = 1 (edge case)
echo -e "${YELLOW}Test 6: Edge case - limit=1${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/teams?limit=1")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Edge case limit=1" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    count=$(echo "$body" | jq -r '.data | length' 2>/dev/null || echo "N/A")
    echo "Returned teams count: $count (should be 1)"
fi
echo ""

# Test 7: Limit = 100 (max allowed)
echo -e "${YELLOW}Test 7: Edge case - limit=100 (max)${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/api/teams?limit=100")
status_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

print_test "Edge case limit=100" "$status_code" 200

if [ "$status_code" -eq 200 ]; then
    count=$(echo "$body" | jq -r '.data | length' 2>/dev/null || echo "N/A")
    echo "Returned teams count: $count"
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Tests completed${NC}"
echo -e "${BLUE}========================================${NC}"

